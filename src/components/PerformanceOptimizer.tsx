import React, { useEffect } from 'react';

const PerformanceOptimizer: React.FC = () => {
  useEffect(() => {
    // Préchargement des ressources critiques
    const preloadCriticalResources = () => {
      const criticalResources = [
        '/AppImages/favicon.svg',
        '/AppImages/logo.png',
        'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap'
      ];

      criticalResources.forEach((href) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        if (href.includes('font')) {
          link.as = 'style';
          link.crossOrigin = 'anonymous';
        } else if (href.includes('.svg') || href.includes('.png')) {
          link.as = 'image';
        }
        document.head.appendChild(link);
      });
    };

    // Optimisation des images lazy loading
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach((img) => imageObserver.observe(img));
    };

    // Mesure des Core Web Vitals
    const measureWebVitals = () => {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);

        // Envoyer à Google Analytics si configuré
        if (typeof gtag !== 'undefined') {
          gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'LCP',
            value: Math.round(lastEntry.startTime),
            non_interaction: true,
          });
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime);

          if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
              event_category: 'Performance',
              event_label: 'FID',
              value: Math.round(entry.processingStart - entry.startTime),
              non_interaction: true,
            });
          }
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        console.log('CLS:', clsValue);

        if (typeof gtag !== 'undefined') {
          gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'CLS',
            value: Math.round(clsValue * 1000),
            non_interaction: true,
          });
        }
      }).observe({ entryTypes: ['layout-shift'] });
    };

    // Optimisation du rendu
    const optimizeRendering = () => {
      // Réduire les repaints et reflows
      document.body.style.willChange = 'auto';

      // Optimiser les animations
      const animatedElements = document.querySelectorAll('[class*="animate"]');
      animatedElements.forEach((element) => {
        (element as HTMLElement).style.willChange = 'transform, opacity';
      });
    };

    // Gestion de la mémoire
    const optimizeMemory = () => {
      // Nettoyer les event listeners inutilisés
      window.addEventListener('beforeunload', () => {
        // Cleanup logic here
        document.removeEventListener('scroll', () => {});
        document.removeEventListener('resize', () => {});
      });
    };

    // Service Worker pour le cache
    const registerServiceWorker = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      }
    };

    // Préconnexion DNS
    const setupDNSPrefetch = () => {
      const domains = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://api.supabase.co'
      ];

      domains.forEach((domain) => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      });
    };

    // Resource hints pour les pages importantes
    const setupResourceHints = () => {
      const importantPages = [
        '/search',
        '/chap-chap',
        '/login',
        '/signup'
      ];

      importantPages.forEach((page) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = page;
        document.head.appendChild(link);
      });
    };

    // Optimisation des polices
    const optimizeFonts = () => {
      // Précharger les polices critiques
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = '/fonts/baloo-2-v15-latin.woff2';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink);

      // Font display swap pour éviter le FOIT
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: 'Baloo 2';
          font-display: swap;
          src: url('/fonts/baloo-2-v15-latin.woff2') format('woff2');
        }
      `;
      document.head.appendChild(style);
    };

    // Détection de la connection réseau
    const optimizeForConnection = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;

        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          // Réduire la qualité des images
          document.body.classList.add('slow-connection');
        }

        if (connection.saveData) {
          // Mode économie de données
          document.body.classList.add('save-data');
        }
      }
    };

    // Initialisation
    const init = () => {
      preloadCriticalResources();
      optimizeImages();
      measureWebVitals();
      optimizeRendering();
      optimizeMemory();
      registerServiceWorker();
      setupDNSPrefetch();
      setupResourceHints();
      optimizeFonts();
      optimizeForConnection();
    };

    // Délai pour éviter de bloquer le rendu initial
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    // Nettoyage
    return () => {
      // Cleanup observers et listeners
    };
  }, []);

  return null; // Ce composant ne rend rien
};

export default PerformanceOptimizer;
