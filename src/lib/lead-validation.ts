const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const maxFileSize = 15 * 1024 * 1024;

export type LeadInput = {
  locale: "pl" | "uk" | "ru";
  segment: "new_build" | "small_flat" | "rental";
  name: string;
  contact: string;
  area: number | null;
  projectStage: string;
  message: string;
  idempotencyKey: string;
  consent: boolean;
  utm: Record<string, string>;
};

const text = (form: FormData, name: string, max: number) =>
  String(form.get(name) ?? "")
    .trim()
    .slice(0, max);

export function parseLead(
  form: FormData,
):
  | { ok: true; lead: LeadInput; file: File | null }
  | { ok: false; reason: string } {
  const locale = text(form, "locale", 2);
  const segment = text(form, "segment", 24);
  const name = text(form, "name", 80);
  const contact = text(form, "contact", 160);
  const projectStage = text(form, "projectStage", 40);
  const message = text(form, "message", 1500);
  const idempotencyKey = text(form, "idempotencyKey", 80);
  const areaRaw = text(form, "area", 6);
  const area = areaRaw ? Number.parseInt(areaRaw, 10) : null;
  const elapsed = Number.parseInt(text(form, "elapsedMs", 12), 10);
  const honeypot = text(form, "companyWebsite", 200);
  const fileValue = form.get("plan");
  const file =
    fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

  if (honeypot || !Number.isFinite(elapsed) || elapsed < 1200)
    return { ok: false, reason: "invalid_submission" };
  if (!["pl", "uk", "ru"].includes(locale))
    return { ok: false, reason: "invalid_locale" };
  if (!["new_build", "small_flat", "rental"].includes(segment))
    return { ok: false, reason: "invalid_segment" };
  if (name.length < 2 || contact.length < 5 || idempotencyKey.length < 16)
    return { ok: false, reason: "missing_fields" };
  if (!projectStage || form.get("consent") !== "yes")
    return { ok: false, reason: "consent_required" };
  if (area !== null && (!Number.isFinite(area) || area < 10 || area > 500))
    return { ok: false, reason: "invalid_area" };
  if (file && (!allowedTypes.has(file.type) || file.size > maxFileSize))
    return { ok: false, reason: "invalid_file" };

  return {
    ok: true,
    lead: {
      locale: locale as LeadInput["locale"],
      segment: segment as LeadInput["segment"],
      name,
      contact,
      area,
      projectStage,
      message,
      idempotencyKey,
      consent: true,
      utm: Object.fromEntries(
        ["utm_source", "utm_medium", "utm_campaign", "utm_content"].map(
          (key) => [key, text(form, key, 160)],
        ),
      ),
    },
    file,
  };
}

export async function validateFileSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.type === "application/pdf")
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    );
  if (file.type === "image/jpeg")
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png")
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  if (file.type === "image/webp")
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}
