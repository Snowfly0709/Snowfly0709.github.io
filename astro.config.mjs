import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://snowfly09.com",
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
  markdown: {
    syntaxHighlight: {
      type: "shiki",
      excludeLangs: ["math"]
    }
  },
  vite: {
    cacheDir: ".vite"
  }
});