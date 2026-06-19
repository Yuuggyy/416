import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor — wrappers Android & iOS pour 416 Records
 *
 * Deux modes possibles :
 * 1) "Remote URL" (recommandé, zéro maintenance) :
 *    L'app mobile charge directement le site Netlify publié.
 *    => décommenter server.url ci-dessous avec votre URL prod.
 *
 * 2) "Bundle statique" :
 *    On build le site (bun run build) puis on copie /dist dans les
 *    projets natifs. Voir README section "Build mobile".
 */
const config: CapacitorConfig = {
  appId: "com.records416.app",
  appName: "416 Records",
  webDir: "dist",
  bundledWebRuntime: false,
  // server: {
  //   url: "https://votre-site.netlify.app",
  //   cleartext: false,
  // },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
