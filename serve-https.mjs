#!/usr/bin/env node

import express from "express";
import https from "https";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { networkInterfaces } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8443;
const HOST = process.env.HOST || "0.0.0.0";

// Configuration
const config = {
  port: PORT,
  host: HOST,
  distPath: path.join(__dirname, "dist"),
  certsPath: path.join(__dirname, "certs"),
};

console.log("🚀 NBBC Immo - Serveur HTTPS de développement");
console.log("===============================================");

// Fonction pour créer les certificats auto-signés
function createSelfSignedCertificates() {
  const certsDir = config.certsPath;
  const keyPath = path.join(certsDir, "key.pem");
  const certPath = path.join(certsDir, "cert.pem");

  // Vérifier si les certificats existent déjà
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log("✅ Certificats SSL trouvés");
    return { key: keyPath, cert: certPath };
  }

  console.log("📋 Génération des certificats SSL auto-signés...");

  // Créer le dossier certs s'il n'existe pas
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  try {
    // Générer la clé privée
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: "inherit" });

    // Générer le certificat
    const opensslConfig = `
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = TG
ST = Maritime
L = Lome
O = NBBC Immo
OU = Development
CN = localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = 127.0.0.1
DNS.4 = 0.0.0.0
IP.1 = 127.0.0.1
IP.2 = 0.0.0.0
    `.trim();

    const configPath = path.join(certsDir, "openssl.conf");
    fs.writeFileSync(configPath, opensslConfig);

    execSync(
      `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -config "${configPath}"`,
      { stdio: "inherit" },
    );

    console.log("✅ Certificats SSL générés avec succès");

    // Nettoyer le fichier de config temporaire
    fs.unlinkSync(configPath);

    return { key: keyPath, cert: certPath };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la génération des certificats:",
      error.message,
    );
    console.log("💡 Assurez-vous qu'OpenSSL est installé sur votre système");
    process.exit(1);
  }
}

// Fonction pour construire l'application si nécessaire
function buildApp() {
  if (!fs.existsSync(config.distPath)) {
    console.log("📦 Construction de l'application...");
    try {
      execSync("npm run build", { stdio: "inherit", cwd: __dirname });
      console.log("✅ Application construite avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la construction:", error.message);
      process.exit(1);
    }
  } else {
    console.log("✅ Dossier dist trouvé");
  }
}

// Fonction pour obtenir l'IP locale
function getLocalIP() {
  const nets = networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Ignorer les adresses non IPv4 et internes
      if (net.family === "IPv4" && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  // Retourner la première IP trouvée
  const interfaces = Object.values(results).flat();
  return interfaces[0] || "localhost";
}

// Configuration d'Express
function setupExpress() {
  // Servir les fichiers statiques
  app.use(
    express.static(config.distPath, {
      maxAge: "1d",
      etag: true,
      setHeaders: (res, path) => {
        // Headers de sécurité
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("X-XSS-Protection", "1; mode=block");

        // Cache pour les assets
        if (path.endsWith(".js") || path.endsWith(".css")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }

        // Service Worker sans cache
        if (path.endsWith("sw.js")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Service-Worker-Allowed", "/");
        }
      },
    }),
  );

  // Route pour le manifest
  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    res.sendFile(path.join(config.distPath, "manifest.webmanifest"));
  });

  // SPA fallback - toutes les routes renvoient index.html
  app.use((req, res) => {
    res.sendFile(path.join(config.distPath, "index.html"));
  });

  return app;
}

// Fonction principale
function startServer() {
  try {
    // Construire l'app si nécessaire
    buildApp();

    // Générer ou charger les certificats
    const certs = createSelfSignedCertificates();

    // Configurer Express
    setupExpress();

    // Lire les certificats
    const httpsOptions = {
      key: fs.readFileSync(certs.key),
      cert: fs.readFileSync(certs.cert),
    };

    // Créer le serveur HTTPS
    const server = https.createServer(httpsOptions, app);

    // Démarrer le serveur
    server.listen(config.port, config.host, () => {
      const localIP = getLocalIP();

      console.log("\n🎉 Serveur HTTPS démarré avec succès !");
      console.log("=====================================");
      console.log(`🌐 Local:    https://localhost:${config.port}`);
      console.log(`📱 Mobile:   https://${localIP}:${config.port}`);
      console.log(`🔗 Réseau:   https://${config.host}:${config.port}`);
      console.log("\n📋 Instructions mobile:");
      console.log("1. Connectez votre téléphone au même WiFi");
      console.log(`2. Ouvrez: https://${localIP}:${config.port}`);
      console.log("3. Acceptez le certificat auto-signé");
      console.log("4. Testez l'installation PWA");
      console.log("\n⚠️  Note: Vous devrez accepter le certificat auto-signé");
      console.log('   dans votre navigateur mobile (page "Non sécurisé")');
      console.log("\n🛑 Appuyez sur Ctrl+C pour arrêter le serveur");
    });

    // Gestion de l'arrêt propre
    process.on("SIGINT", () => {
      console.log("\n\n🛑 Arrêt du serveur...");
      server.close(() => {
        console.log("✅ Serveur arrêté proprement");
        process.exit(0);
      });
    });

    process.on("SIGTERM", () => {
      console.log("\n\n🛑 Signal SIGTERM reçu, arrêt du serveur...");
      server.close(() => {
        console.log("✅ Serveur arrêté proprement");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error.message);
    process.exit(1);
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
🚀 NBBC Immo - Serveur HTTPS de développement

Usage: node serve-https.mjs [options]

Options:
  --help, -h     Afficher cette aide
  --port PORT    Port à utiliser (défaut: 8443)
  --host HOST    Host à utiliser (défaut: 0.0.0.0)

Variables d'environnement:
  PORT           Port du serveur
  HOST           Host du serveur

Exemples:
  node serve-https.mjs
  node serve-https.mjs --port 3000
  PORT=9000 node serve-https.mjs
  `);
  process.exit(0);
}

// Gestion des arguments
const portIndex = args.indexOf("--port");
if (portIndex !== -1 && args[portIndex + 1]) {
  config.port = parseInt(args[portIndex + 1], 10);
}

const hostIndex = args.indexOf("--host");
if (hostIndex !== -1 && args[hostIndex + 1]) {
  config.host = args[hostIndex + 1];
}

startServer();
