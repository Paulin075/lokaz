# Guide HTTPS pour NBBC Immo

## 🔒 Configuration HTTPS pour les tests mobiles

### Problème
Les PWA (Progressive Web Apps) nécessitent HTTPS pour fonctionner correctement sur mobile. En développement local, votre téléphone ne peut pas accéder au site si HTTPS n'est pas configuré.

## 🚀 Solutions

### Option 1 : Serveur de développement avec HTTPS (Recommandé)

```bash
# Démarrer le serveur avec HTTPS
npm run serve:mobile
```

Cette commande démarre le serveur sur `https://0.0.0.0:8080` accessible depuis votre réseau local.

### Option 2 : Utiliser ngrok (Simple et rapide)

1. **Installer ngrok** :
   ```bash
   # Ubuntu/Debian
   sudo apt install ngrok
   
   # Ou télécharger depuis https://ngrok.com/
   ```

2. **Démarrer votre application** :
   ```bash
   npm run dev
   ```

3. **Exposer avec HTTPS** :
   ```bash
   ngrok http 8080
   ```

4. **Utiliser l'URL HTTPS fournie** sur votre mobile

### Option 3 : Certificat auto-signé

1. **Générer un certificat** :
   ```bash
   # Créer le dossier certs
   mkdir certs
   cd certs
   
   # Générer le certificat
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

2. **Configurer Vite** :
   ```javascript
   // vite.config.ts
   server: {
     https: {
       key: fs.readFileSync('./certs/key.pem'),
       cert: fs.readFileSync('./certs/cert.pem'),
     },
     host: '0.0.0.0',
     port: 8080
   }
   ```

### Option 4 : Déploiement en ligne (Production)

Pour un test réel, déployez sur un service avec HTTPS :

- **Netlify** : `netlify deploy --prod`
- **Vercel** : `vercel --prod`
- **GitHub Pages** : Avec HTTPS automatique

## 📱 Test sur mobile

### 1. Trouver votre IP locale
```bash
# Linux/Mac
ip addr show | grep "inet " | grep -v 127.0.0.1

# Ou
hostname -I
```

### 2. Accéder depuis mobile
- Connectez votre téléphone au même WiFi
- Ouvrez : `https://[VOTRE_IP]:8080`
- Acceptez le certificat auto-signé

### 3. Installer la PWA
1. Ouvrez Chrome/Safari sur mobile
2. Naviguez vers votre site HTTPS
3. Le prompt d'installation PWA devrait apparaître
4. Ou utilisez "Ajouter à l'écran d'accueil"

## ⚠️ Résolution des problèmes

### Erreur "Site non sécurisé"
- **Chrome** : Tapez `chrome://flags/#allow-insecure-localhost` et activez
- **Firefox** : Cliquez "Avancé" → "Continuer vers le site"
- **Safari** : Paramètres → Safari → Avancé → Accepter les certificats

### PWA ne s'installe pas
1. Vérifiez HTTPS ✅
2. Vérifiez le manifest.json ✅
3. Vérifiez le Service Worker ✅
4. Testez en navigation privée
5. Videz le cache du navigateur

### Debugging PWA
Le PWADebugger s'affiche automatiquement en développement local pour vous aider à diagnostiquer les problèmes.

## 🎯 Commandes rapides

```bash
# Développement normal
npm run dev

# Développement avec HTTPS
npm run dev:https

# Accessible depuis mobile
npm run serve:mobile

# Build et preview avec HTTPS
npm run build && npm run preview:https

# Test avec ngrok
npm run dev
# Dans un autre terminal :
ngrok http 8080
```

## ✅ Checklist PWA Mobile

- [ ] HTTPS activé
- [ ] Manifest.json configuré
- [ ] Service Worker enregistré
- [ ] Icônes PWA (192px, 512px minimum)
- [ ] Start URL définie
- [ ] Display mode "standalone"
- [ ] Thème couleur défini
- [ ] Test sur Chrome mobile
- [ ] Test sur Safari iOS
- [ ] Installation PWA testée

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez la console développeur (F12)
2. Testez le PWADebugger en local
3. Utilisez la page `test-pwa.html`
4. Vérifiez Application → Manifest dans DevTools

---

**Note** : En production, utilisez toujours un certificat SSL valide de Let's Encrypt ou un fournisseur de confiance.