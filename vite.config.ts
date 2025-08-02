import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://
// vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co/,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "favicon.png",
        "apple-touch-icon.png",
        "AppImages/favicon.png",
        "robots.txt",
        "sitemap.xml",
      ],
      manifest: {
        name: "NBBC Immo - Plateforme Immobilière du Togo",
        short_name: "NBBC Immo",
        description:
          "La première plateforme immobilière connectée du Togo. Location mensuelle, journalière et service Chap-Chap (à l'heure).",
        start_url: "/?utm_source=pwa",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#e49a33",
        orientation: "any",
        scope: "/",
        lang: "fr",
        dir: "ltr",
        categories: ["business", "lifestyle", "utilities"],
        icons: [
          {
            src: "/AppImages/favicon.png",
            sizes: "48x48",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/AppImages/favicon.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/AppImages/favicon.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/AppImages/favicon.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/AppImages/favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/AppImages/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
        shortcuts: [
          {
            name: "Rechercher un logement",
            short_name: "Recherche",
            description: "Trouver rapidement un logement",
            url: "/search?utm_source=pwa",
            icons: [{ src: "/AppImages/favicon.png", sizes: "96x96" }],
          },
          {
            name: "Service Chap-Chap",
            short_name: "Chap-Chap",
            description: "Location à l'heure",
            url: "/chap-chap?utm_source=pwa",
            icons: [{ src: "/AppImages/favicon.png", sizes: "96x96" }],
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      strategies: "generateSW",
      useCredentials: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
