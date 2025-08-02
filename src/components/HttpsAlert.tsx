import React, { useState, useEffect } from 'react';
import { Shield, X, ExternalLink, Smartphone } from 'lucide-react';

const HttpsAlert: React.FC = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si HTTPS est requis
    const isHttps = location.protocol === 'https:';
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Vérifier si déjà rejeté dans cette session
    const alreadyDismissed = sessionStorage.getItem('https-alert-dismissed');

    // Afficher l'alerte si :
    // - Ce n'est pas HTTPS
    // - Ce n'est pas localhost
    // - C'est sur mobile
    // - L'utilisateur n'a pas déjà fermé l'alerte
    if (!isHttps && !isLocalhost && isMobile && !alreadyDismissed) {
      setShowAlert(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowAlert(false);
    setDismissed(true);
    sessionStorage.setItem('https-alert-dismissed', 'true');
  };

  const handleLearnMore = () => {
    // Rediriger vers une page d'aide ou documentation
    window.open('https://web.dev/why-https-matters/', '_blank');
  };

  if (!showAlert) {
    return null;
  }

  return (
    <>
      {/* Overlay pour mobile */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={handleDismiss} />

      {/* Alerte HTTPS */}
      <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-2xl border-l-4 border-red-500 overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 p-4 border-b border-red-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-2 rounded-full">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 text-sm">
                    Connexion non sécurisée
                  </h3>
                  <p className="text-red-600 text-xs mt-1">
                    HTTPS requis pour les fonctionnalités PWA
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="text-red-400 hover:text-red-600 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corps du message */}
          <div className="p-4">
            <div className="flex items-start space-x-3 mb-4">
              <Smartphone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Pour installer <strong>NBBC Immo</strong> comme application mobile et
                  utiliser toutes les fonctionnalités, une connexion HTTPS est nécessaire.
                </p>
              </div>
            </div>

            {/* Solutions */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-blue-800 text-sm mb-2">
                Solutions disponibles :
              </h4>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>• Accédez au site via HTTPS en production</li>
                <li>• Utilisez un tunnel sécurisé (ngrok)</li>
                <li>• Attendez le déploiement officiel</li>
              </ul>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3">
              <button
                onClick={handleLearnMore}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>En savoir plus</span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
              >
                Compris
              </button>
            </div>

            {/* Note informative */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                ℹ️ Cette application fonctionne normalement, mais l'installation
                PWA nécessite HTTPS pour des raisons de sécurité.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HttpsAlert;
