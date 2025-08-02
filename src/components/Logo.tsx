
import React from 'react';

const Logo = ({ className = "h-8 w-auto" }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo NBBC Immo - chemin mis à jour */}
      <img 
        src="/AppImages/favicon.png" 
        alt="NBBC IMMO" 
        className="h-full w-auto"
        onError={(e) => {
          // Fallback vers le SVG si l'image ne se charge pas
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.innerHTML = `
              <svg
                class="${className}"
                viewBox="0 0 200 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <text
                  x="100"
                  y="35"
                  fontFamily="Arial, sans-serif"
                  fontSize="32"
                  fontWeight="bold"
                  fill="#f97316"
                  textAnchor="middle"
                >
                  NBBC IMMO
                </text>
              </svg>
            `;
          }
        }}
      />
    </div>
  );
};

export default Logo;
