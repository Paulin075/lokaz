import React from 'react';

interface PaginationProps {
  page: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ page, total, onChange, className }) => {
  if (total <= 1) return null;

  // Génère la liste des pages à afficher (ex: 1 2 3 ... 10)
  const getPages = () => {
    const pages = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1,2,3,4,5,'...',total);
      } else if (page >= total - 3) {
        pages.push(1,'...',total-4,total-3,total-2,total-1,total);
      } else {
        pages.push(1,'...',page-1,page,page+1,'...',total);
      }
    }
    return pages;
  };

  return (
    <nav className={`flex items-center gap-1 mt-6 justify-center ${className || ''}`} aria-label="Pagination">
      {getPages().map((p, idx) =>
        typeof p === 'number' ? (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1 rounded font-medium transition-colors
              ${p === page ? 'bg-lokaz-orange text-white' : 'bg-white text-lokaz-orange border border-lokaz-orange hover:bg-lokaz-orange/10'}
            `}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ) : (
          <span key={idx} className="px-2 text-gray-400 select-none">{p}</span>
        )
      )}
    </nav>
  );
};

export default Pagination;
