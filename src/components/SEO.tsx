import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  canonical?: string;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = "NBBC Immo - Plateforme Immobilière #1 au Togo",
  description = "🏠 NBBC Immo : La plateforme immobilière connectée du Togo. Location mensuelle, journalière ou à l'heure (Chap-Chap). +500 logements à Lomé. Service 24/7.",
  keywords = "NBBC Immo, immobilier Togo, location Lomé, appartement Togo, maison location, Chap-Chap, location journalière",
  image = "https://nbbcimmo.com/AppImages/og-image.jpg",
  url = "https://nbbcimmo.com",
  type = "website",
  noIndex = false,
  canonical,
  structuredData
}) => {
  const siteTitle = "NBBC Immo";
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Title */}
      <title>{fullTitle}</title>

      {/* Meta descriptions */}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Robots */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${siteTitle} - ${title}`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={`${siteTitle} - ${title}`} />
      <meta name="twitter:site" content="@NBBCImmo" />
      <meta name="twitter:creator" content="@NBBCImmo" />

      {/* Geo tags */}
      <meta name="geo.region" content="TG" />
      <meta name="geo.placename" content="Lomé, Togo" />
      <meta name="geo.position" content="6.1319;1.2228" />
      <meta name="ICBM" content="6.1319, 1.2228" />

      {/* Additional meta tags */}
      <meta name="author" content="NBBC Immo" />
      <meta name="language" content="fr" />
      <meta name="theme-color" content="#FF6B35" />

      {/* Structured data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
