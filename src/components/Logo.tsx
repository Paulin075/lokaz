
import React from 'react';

const Logo = ({ className = "h-8 w-auto" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Maison stylisée avec toit africain */}
      <path
        d="M8 32V20L16 12L24 20V32H20V24H12V32H8Z"
        fill="#e49a33"
        stroke="#f4a640"
        strokeWidth="1"
      />
      {/* Porte */}
      <rect x="14" y="26" width="4" height="6" fill="#0c0c0c" rx="0.5" />
      {/* Fenêtre */}
      <rect x="18" y="18" width="4" height="4" fill="#ffffff" stroke="#e49a33" strokeWidth="0.5" />
      
      {/* Motif africain décoratif */}
      <circle cx="6" cy="14" r="2" fill="#f4a640" opacity="0.6" />
      <circle cx="26" cy="16" r="1.5" fill="#e49a33" opacity="0.8" />
      
      {/* Texte LOKAZ */}
      <text
        x="36"
        y="28"
        fontFamily="Baloo 2, cursive"
        fontSize="20"
        fontWeight="700"
        fill="#0c0c0c"
      >
        Lokaz
      </text>
      
      {/* Accent décoratif sous le texte */}
      <path
        d="M36 32 L70 32"
        stroke="#e49a33"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo;
