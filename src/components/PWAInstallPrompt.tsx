import React, { useEffect, useState, useCallback } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onClose?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Vérifier si l'app est déjà installée
  const checkIfInstalled = useCallback(() => {
    // Vérifier display-mode standalone
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;

    // Vérifier iOS standalone
    const isIOSStandalone = (window.navigator as any).standalone === true;

    // Vérifier si installé via beforeinstallprompt
    const isInstallPromptAvailable = "BeforeInstallPromptEvent" in window;

    // Vérifier l'URL pour les PWA installées
    const isInstalledApp = window.location.search.includes("utm_source=pwa");

    return isStandalone || isIOSStandalone || isInstalledApp;
  }, []);

  // Vérifier si HTTPS est disponible
  const checkHttpsSupport = useCallback(() => {
    const isHttps = location.protocol === "https:";
    const isLocalhost =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";

    return isHttps || isLocalhost;
  }, []);

  // Gérer l'événement beforeinstallprompt
  useEffect(() => {
    console.log("[PWA] Initialisation du composant PWA");

    if (checkIfInstalled()) {
      console.log("[PWA] Application déjà installée");
      setIsInstalled(true);
      return;
    }

    // Vérifier HTTPS en premier
    if (!checkHttpsSupport()) {
      console.log("[PWA] HTTPS requis pour l'installation PWA");
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWA] Événement beforeinstallprompt capturé");
      e.preventDefault();

      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);

      // Attendre un peu avant d'afficher le prompt pour une meilleure UX
      setTimeout(() => {
        setShowInstallPrompt(true);
        console.log("[PWA] Prompt d'installation affiché");
      }, 3000);
    };

    const handleAppInstalled = () => {
      console.log("[PWA] Application installée avec succès");
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    // Écouter les événements
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Pour le développement - simuler le prompt après 5 secondes
    let devTimer: NodeJS.Timeout;
    if (process.env.NODE_ENV === "development") {
      devTimer = setTimeout(() => {
        if (!isInstalled && !deferredPrompt && !showInstallPrompt) {
          console.log("[PWA] Mode développement - Simulation du prompt");
          setShowInstallPrompt(true);
        }
      }, 5000);
    }

    // Cleanup
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (devTimer) clearTimeout(devTimer);
    };
  }, [
    isInstalled,
    deferredPrompt,
    showInstallPrompt,
    onInstall,
    checkIfInstalled,
  ]);

  // Gérer l'installation
  const handleInstall = async () => {
    console.log("[PWA] Tentative d'installation");

    if (!deferredPrompt && process.env.NODE_ENV !== "development") {
      console.warn("[PWA] Aucun prompt d'installation disponible");
      return;
    }

    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        // Installation native PWA
        console.log("[PWA] Déclenchement du prompt natif");
        await deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] Résultat de l'installation: ${outcome}`);

        if (outcome === "accepted") {
          setIsInstalled(true);
          onInstall?.();
        }

        setDeferredPrompt(null);
      } else {
        // Mode développement ou fallback
        console.log("[PWA] Mode développement - Installation simulée");

        // Instructions manuelles pour l'utilisateur
        if (navigator.userAgent.includes("Chrome")) {
          alert(
            "Pour installer l'application :\n1. Cliquez sur les 3 points en haut à droite\n2. Sélectionnez 'Installer Lokaz'\n3. Confirmez l'installation",
          );
        } else if (navigator.userAgent.includes("Safari")) {
          alert(
            "Pour installer l'application :\n1. Cliquez sur le bouton Partager\n2. Sélectionnez 'Sur l'écran d'accueil'\n3. Confirmez l'ajout",
          );
        } else {
          alert(
            "Pour installer l'application :\nUtilisez le menu de votre navigateur pour 'Installer l'application' ou 'Ajouter à l'écran d'accueil'",
          );
        }

        onInstall?.();
      }
    } catch (error) {
      console.error("[PWA] Erreur lors de l'installation:", error);
    } finally {
      setIsInstalling(false);
      setShowInstallPrompt(false);
    }
  };

  // Gérer la fermeture
  const handleClose = () => {
    console.log("[PWA] Fermeture du prompt d'installation");
    setShowInstallPrompt(false);
    onClose?.();

    // Cacher définitivement pour cette session
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  // Auto-masquage après 15 secondes
  useEffect(() => {
    if (showInstallPrompt) {
      const timer = setTimeout(() => {
        console.log("[PWA] Auto-masquage du prompt après 15 secondes");
        setShowInstallPrompt(false);
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [showInstallPrompt]);

  // Ne pas afficher si déjà installé, HTTPS non disponible, ou si déjà rejeté dans cette session
  if (
    isInstalled ||
    !showInstallPrompt ||
    !checkHttpsSupport() ||
    sessionStorage.getItem("pwa-prompt-dismissed")
  ) {
    return null;
  }

  return (
    <>
      {/* Overlay pour mobile */}
      <div
        className="fixed inset-0 bg-black/20 z-40 md:hidden"
        onClick={handleClose}
      />

      {/* Toast PWA Install */}
      <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header avec dégradé */}
          <div className="bg-gradient-to-r from-lokaz-orange to-lokaz-orange-light p-4 text-white relative">
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pr-8">
              <div className="bg-white/20 p-2 rounded-xl">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Installer Lokaz</h3>
                <p className="text-white/90 text-sm">
                  Application mobile gratuite
                </p>
              </div>
            </div>
          </div>

          {/* Corps du message */}
          <div className="p-4">
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              🚀 Accédez rapidement à Lokaz depuis votre écran d'accueil.
              Recherchez des logements même hors ligne !
            </p>

            {/* Boutons d'action */}
            <div className="flex space-x-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-lokaz-orange hover:bg-lokaz-orange-light disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Installation...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Installer</span>
                  </>
                )}
              </button>

              <button
                onClick={handleClose}
                className="px-4 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Plus tard
              </button>
            </div>

            {/* Avantages */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>✓ Accès rapide</span>
                <span>✓ Mode hors-ligne</span>
                <span>✓ Notifications</span>
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="h-1 bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-lokaz-orange animate-[width-shrink_15s_linear]"
              style={{
                animation: "width-shrink 15s linear forwards",
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Styles pour l'animation */}
      <style>{`
        @keyframes width-shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </>
  );
};

export default PWAInstallPrompt;
