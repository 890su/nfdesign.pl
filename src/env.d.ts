/// <reference types="astro/client" />

interface CloudflareEnv {
  LEADS_DB: D1Database;
  PRIVATE_UPLOADS: R2Bucket;
  ENVIRONMENT?: string;
  DEV_ALLOW_UNVERIFIED_TURNSTILE?: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  NOTIFICATION_EMAIL?: string;
  PUBLIC_TURNSTILE_SITE_KEY?: string;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: CloudflareEnv;
    };
  }
}
