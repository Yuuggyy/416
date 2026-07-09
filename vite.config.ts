// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
//
// IMPORTANT — Netlify preset fix (2026-07-09):
// Nitro's "netlify" preset generates SSR serverless/edge functions. Our app has
// no server-side logic (Supabase is called client-side, no server loaders), so
// those generated functions have nothing real to do and crash at runtime,
// producing Netlify's generic "This page didn't load / Something went wrong on
// our end" error. We want a pure static SPA build on Netlify (per README section
// "Déploiement Netlify"), so we force the "static" preset there instead — this
// prerenders/exports plain HTML/JS/CSS to dist/, no functions involved, and
// netlify.toml's SPA fallback redirect (/* -> /index.html) handles client routing.
const nitroPreset = process.env.NETLIFY
  ? "static"
  : process.env.CF_PAGES
    ? "cloudflare-pages"
    : "cloudflare-module";

export default defineConfig({
  nitro: {
    preset: nitroPreset,
    cloudflare: { nodeCompat: true, deployConfig: true },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
