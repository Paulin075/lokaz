import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Smartphone,
  Wifi,
  Download,
} from "lucide-react";

interface PWACriteria {
  hasManifest: boolean;
  hasServiceWorker: boolean;
  hasHttps: boolean;
  hasIcons: boolean;
  hasStartUrl: boolean;
  hasDisplay: boolean;
  hasName: boolean;
  beforeInstallPrompt: boolean;
  isInstalled: boolean;
}

const PWADebugger: React.FC = () => {
  const [criteria, setCriteria] = useState<PWACriteria>({
    hasManifest: false,
    hasServiceWorker: false,
    hasHttps: false,
    hasIcons: false,
    hasStartUrl: false,
    hasDisplay: false,
    hasName: false,
    beforeInstallPrompt: false,
    isInstalled: false,
  });

  const [showDebugger, setShowDebugger] = useState(false);
  const [manifestData, setManifestData] = useState<any>(null);
  const [swRegistration, setSWRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Activer le débogueur seulement en développement local
    if (
      process.env.NODE_ENV === "development" &&
      window.location.hostname === "localhost"
    ) {
      setShowDebugger(true);
      checkPWACriteria();
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWA Debugger] beforeinstallprompt événement détecté");
      setCriteria((prev) => ({ ...prev, beforeInstallPrompt: true }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const checkPWACriteria = async () => {
    const newCriteria: PWACriteria = {
      hasManifest: false,
      hasServiceWorker: false,
      hasHttps: false,
      hasIcons: false,
      hasStartUrl: false,
      hasDisplay: false,
      hasName: false,
      beforeInstallPrompt: false,
      isInstalled: false,
    };

    // Vérifier HTTPS
    newCriteria.hasHttps =
      location.protocol === "https:" || location.hostname === "localhost";

    // Vérifier le manifest
    const manifestLink = document.querySelector(
      'link[rel="manifest"]',
    ) as HTMLLinkElement;
    if (manifestLink) {
      try {
        const response = await fetch(manifestLink.href);
        const manifest = await response.json();
        setManifestData(manifest);

        newCriteria.hasManifest = true;
        newCriteria.hasName = !!(manifest.name || manifest.short_name);
        newCriteria.hasStartUrl = !!manifest.start_url;
        newCriteria.hasDisplay = !!manifest.display;
        newCriteria.hasIcons = !!(manifest.icons && manifest.icons.length > 0);
      } catch (error) {
        console.error(
          "[PWA Debugger] Erreur lors de la lecture du manifest:",
          error,
        );
      }
    }

    // Vérifier le Service Worker
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          newCriteria.hasServiceWorker = true;
          setSWRegistration(registration);
        }
      } catch (error) {
        console.error("[PWA Debugger] Erreur Service Worker:", error);
      }
    }

    // Vérifier si installé
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    newCriteria.isInstalled = isStandalone || isIOSStandalone;

    setCriteria(newCriteria);
  };

  const getIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getOverallScore = () => {
    const checks = [
      criteria.hasManifest,
      criteria.hasServiceWorker,
      criteria.hasHttps,
      criteria.hasIcons,
      criteria.hasStartUrl,
      criteria.hasDisplay,
      criteria.hasName,
    ];
    const passed = checks.filter(Boolean).length;
    return { passed, total: checks.length };
  };

  const forceRefreshSW = async () => {
    if (swRegistration) {
      try {
        await swRegistration.update();
        console.log("[PWA Debugger] Service Worker mis à jour");
        window.location.reload();
      } catch (error) {
        console.error("[PWA Debugger] Erreur mise à jour SW:", error);
      }
    }
  };

  const testInstallation = () => {
    console.log("[PWA Debugger] Test manuel d'installation");

    // Déclencher l'événement beforeinstallprompt artificiel
    const event = new CustomEvent("beforeinstallprompt");
    window.dispatchEvent(event);
  };

  if (!showDebugger) return null;

  const score = getOverallScore();

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5" />
              <span className="font-semibold text-sm">PWA Debugger</span>
            </div>
            <div className="text-xs">
              {score.passed}/{score.total}
            </div>
          </div>
        </div>

        {/* Critères */}
        <div className="p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span>HTTPS/Localhost</span>
            {getIcon(criteria.hasHttps)}
          </div>

          <div className="flex items-center justify-between">
            <span>Manifest</span>
            {getIcon(criteria.hasManifest)}
          </div>

          <div className="flex items-center justify-between">
            <span>Service Worker</span>
            {getIcon(criteria.hasServiceWorker)}
          </div>

          <div className="flex items-center justify-between">
            <span>Icônes</span>
            {getIcon(criteria.hasIcons)}
          </div>

          <div className="flex items-center justify-between">
            <span>Start URL</span>
            {getIcon(criteria.hasStartUrl)}
          </div>

          <div className="flex items-center justify-between">
            <span>Display Mode</span>
            {getIcon(criteria.hasDisplay)}
          </div>

          <div className="flex items-center justify-between">
            <span>Nom d'app</span>
            {getIcon(criteria.hasName)}
          </div>

          <hr className="border-gray-700" />

          <div className="flex items-center justify-between">
            <span>BeforeInstallPrompt</span>
            {getIcon(criteria.beforeInstallPrompt)}
          </div>

          <div className="flex items-center justify-between">
            <span>Installée</span>
            {getIcon(criteria.isInstalled)}
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 bg-gray-800 space-y-2">
          <button
            onClick={checkPWACriteria}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs"
          >
            ♻️ Actualiser
          </button>

          <button
            onClick={forceRefreshSW}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-xs"
          >
            🔄 Maj SW
          </button>

          <button
            onClick={testInstallation}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded text-xs"
          >
            📱 Test Install
          </button>
        </div>

        {/* Informations supplémentaires */}
        {manifestData && (
          <div className="p-3 bg-gray-800 border-t border-gray-700">
            <div className="text-xs text-gray-300">
              <div>
                <strong>Nom:</strong> {manifestData.short_name}
              </div>
              <div>
                <strong>Thème:</strong> {manifestData.theme_color}
              </div>
              <div>
                <strong>Icônes:</strong> {manifestData.icons?.length || 0}
              </div>
              {manifestData.icons?.[0] && (
                <div>
                  <strong>Icône principale:</strong>{" "}
                  {manifestData.icons[0].sizes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conseils */}
        {score.passed < score.total && (
          <div className="p-3 bg-yellow-900 border-t border-yellow-700">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-200">
                {!criteria.hasHttps && (
                  <div>• Utilisez HTTPS en production</div>
                )}
                {!criteria.hasManifest && (
                  <div>• Ajoutez un fichier manifest.json</div>
                )}
                {!criteria.hasServiceWorker && (
                  <div>• Registrez un Service Worker</div>
                )}
                {!criteria.hasIcons && <div>• Ajoutez des icônes PWA</div>}
                {!criteria.beforeInstallPrompt && (
                  <div>• En attente de beforeinstallprompt</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status global */}
        <div
          className={`p-2 text-center text-xs font-semibold ${
            score.passed === score.total
              ? "bg-green-900 text-green-200"
              : score.passed > score.total / 2
                ? "bg-yellow-900 text-yellow-200"
                : "bg-red-900 text-red-200"
          }`}
        >
          {score.passed === score.total
            ? "✅ PWA Prête à installer"
            : score.passed > score.total / 2
              ? "⚠️ PWA Partiellement prête"
              : "❌ PWA Non installable"}
        </div>
      </div>
    </div>
  );
};

export default PWADebugger;
