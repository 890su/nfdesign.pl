import type { APIRoute } from "astro";
import { parseLead, validateFileSignature } from "@/lib/lead-validation";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

async function verifyTurnstile(
  request: Request,
  form: FormData,
  env: CloudflareEnv,
) {
  const isDevelopment = env.ENVIRONMENT !== "production";
  if (isDevelopment && env.DEV_ALLOW_UNVERIFIED_TURNSTILE === "true")
    return true;
  const token = String(form.get("cf-turnstile-response") ?? "");
  if (!env.TURNSTILE_SECRET_KEY || !token) return false;
  const verification = new FormData();
  verification.set("secret", env.TURNSTILE_SECRET_KEY);
  verification.set("response", token);
  const remoteIp = request.headers.get("cf-connecting-ip");
  if (remoteIp) verification.set("remoteip", remoteIp);
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: verification },
  );
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

function extensionFor(type: string) {
  return (
    {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    }[type] ?? "bin"
  );
}

async function notify(
  env: CloudflareEnv,
  leadId: string,
  segment: string,
  locale: string,
) {
  if (!env.RESEND_API_KEY || !env.NOTIFICATION_EMAIL) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Need for Design <leads@notifications.invalid>",
      to: [env.NOTIFICATION_EMAIL],
      subject: `New qualified request · ${segment} · ${locale}`,
      text: `A new lead was saved. ID: ${leadId}`,
    }),
  }).catch(() => undefined);
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;
  if (!env?.LEADS_DB || !env?.PRIVATE_UPLOADS)
    return json({ message: "service_not_configured" }, 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ message: "invalid_form" }, 400);
  }
  if (!(await verifyTurnstile(request, form, env)))
    return json({ message: "verification_failed" }, 403);
  const parsed = parseLead(form);
  if (!parsed.ok) return json({ message: parsed.reason }, 422);
  if (parsed.file && !(await validateFileSignature(parsed.file)))
    return json({ message: "invalid_file_signature" }, 422);

  const leadId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  try {
    await env.LEADS_DB.prepare(
      `INSERT INTO leads (id, created_at, locale, segment, name, contact, area, project_stage, message, utm_source, utm_medium, utm_campaign, utm_content, consent_version, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        leadId,
        createdAt,
        parsed.lead.locale,
        parsed.lead.segment,
        parsed.lead.name,
        parsed.lead.contact,
        parsed.lead.area,
        parsed.lead.projectStage,
        parsed.lead.message,
        parsed.lead.utm.utm_source,
        parsed.lead.utm.utm_medium,
        parsed.lead.utm.utm_campaign,
        parsed.lead.utm.utm_content,
        "2026-07-13",
        parsed.lead.idempotencyKey,
      )
      .run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE"))
      return json({ message: "already_submitted" }, 409);
    return json({ message: "storage_failed" }, 500);
  }

  if (parsed.file) {
    const fileId = crypto.randomUUID();
    const objectKey = `leads/${createdAt.slice(0, 10)}/${leadId}/${fileId}.${extensionFor(parsed.file.type)}`;
    const deleteAfter = new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000,
    ).toISOString();
    try {
      await env.PRIVATE_UPLOADS.put(objectKey, parsed.file.stream(), {
        httpMetadata: { contentType: parsed.file.type },
        customMetadata: { leadId },
      });
      await env.LEADS_DB.prepare(
        `INSERT INTO lead_files (id, lead_id, object_key, original_name, content_type, size_bytes, created_at, delete_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          fileId,
          leadId,
          objectKey,
          parsed.file.name.slice(0, 180),
          parsed.file.type,
          parsed.file.size,
          createdAt,
          deleteAfter,
        )
        .run();
    } catch {
      await env.LEADS_DB.prepare(
        `UPDATE leads SET status = 'upload_failed' WHERE id = ?`,
      )
        .bind(leadId)
        .run()
        .catch(() => undefined);
      return json({ message: "upload_failed", leadId }, 500);
    }
  }

  await notify(env, leadId, parsed.lead.segment, parsed.lead.locale);
  return json({ ok: true, leadId }, 201);
};

export const ALL: APIRoute = () => json({ message: "method_not_allowed" }, 405);
