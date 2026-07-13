import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const site = process.env.PUBLIC_SITE_URL ?? "http://localhost:4321";
const useCloudflare = process.env.CF_RUNTIME === "1";

export default defineConfig({
  site,
  output: "server",
  adapter: useCloudflare
    ? cloudflare({ imageService: "compile" })
    : node({ mode: "standalone" }),
  integrations: [
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith("/strategy"),
    }),
  ],
  i18n: {
    defaultLocale: "pl",
    locales: ["pl", "uk", "ru"],
    routing: { prefixDefaultLocale: true },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  compressHTML: true,
});
