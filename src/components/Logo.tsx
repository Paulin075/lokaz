import React from 'react';

const Logo = ({ className = "h-12 w-auto" }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Lokaz - chemin mis à jour */}
      <img
        src="/AppImages/favicon.png"
        alt="LOKAZ"
        className="h-full w-auto dark:invert dark:brightness-200 transition-all duration-300 transform hover:scale-105"
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
                  LOKAZ
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
