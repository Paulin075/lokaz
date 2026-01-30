import React from 'react';
import { Helmet } from 'react-helmet-async';

interface LocalSEOProps {
  businessName?: string;
  description?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode?: string;
    addressCountry: string;
  };
  coordinates?: {
    latitude: string;
    longitude: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string[];
  priceRange?: string;
  rating?: {
    ratingValue: string;
    reviewCount: string;
  };
  services?: string[];
  images?: string[];
}

const LocalSEO: React.FC<LocalSEOProps> = ({
  businessName = "Lokaz",
  description = "Plateforme immobilière connectée du Togo - Location, vente et service Chap-Chap",
  address = {
    streetAddress: "Lomé",
    addressLocality: "Lomé",
    addressRegion: "Maritime",
    addressCountry: "TG"
  },
  coordinates = {
    latitude: "6.1319",
    longitude: "1.2228"
  },
  phone = "+228-96-20-04-88",
  email = "contact@lokaz.com",
  website = "https://lokaz.com",
  openingHours = [
    "Mo-Su 00:00-23:59"
  ],
  priceRange = "$$",
  rating = {
    ratingValue: "4.8",
    reviewCount: "127"
  },
  services = [
    "Location immobilière",
    "Vente immobilière",
    "Gestion locative",
    "Location journalière",
    "Service Chap-Chap"
  ],
  images = [
    "https://lokaz.com/AppImages/business-photo-1.jpg",
    "https://lokaz.com/AppImages/business-photo-2.jpg",
    "https://lokaz.com/AppImages/business-photo-3.jpg"
  ]
}) => {

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${website}/#localbusiness`,
    "name": businessName,
    "alternateName": "Lokaz",
    "description": description,
    "url": website,
    "telephone": phone,
    "email": email,
    "priceRange": priceRange,
    "currenciesAccepted": "XOF",
    "paymentAccepted": ["TMoney", "Flooz", "Orange Money", "Cash"],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": address.streetAddress,
      "addressLocality": address.addressLocality,
      "addressRegion": address.addressRegion,
      "postalCode": address.postalCode,
      "addressCountry": address.addressCountry
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": coordinates.latitude,
      "longitude": coordinates.longitude
    },
    "openingHoursSpecification": openingHours.map(hours => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": hours.includes("Mo-Su") ? [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday"
      ] : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": hours.split(" ")[1].split("-")[0],
      "closes": hours.split(" ")[1].split("-")[1]
    })),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": rating.ratingValue,
      "reviewCount": rating.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    },
    "image": images,
    "logo": `${website}/AppImages/logo.png`,
    "sameAs": [
      "https://facebook.com/Lokaz",
      "https://twitter.com/Lokaz",
      "https://instagram.com/Lokaz",
      "https://linkedin.com/company/lokaz"
    ],
    "areaServed": [
      {
        "@type": "Country",
        "name": "Togo"
      },
      {
        "@type": "City",
        "name": "Lomé"
      },
      {
        "@type": "City",
        "name": "Kara"
      },
      {
        "@type": "City",
        "name": "Sokodé"
      },
      {
        "@type": "City",
        "name": "Kpalimé"
      },
      {
        "@type": "City",
        "name": "Atakpamé"
      }
    ],
    "serviceType": services,
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Services Immobiliers Lokaz",
      "itemListElement": services.map((service, index) => ({
        "@type": "Offer",
        "position": index + 1,
        "itemOffered": {
          "@type": "Service",
          "name": service,
          "provider": {
            "@type": "Organization",
            "name": businessName
          }
        }
      }))
    },
    "potentialAction": [
      {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${website}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      {
        "@type": "ReserveAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${website}/search`
        }
      }
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": phone,
        "contactType": "customer service",
        "email": email,
        "availableLanguage": ["French"],
        "hoursAvailable": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "00:00",
          "closes": "23:59"
        },
        "areaServed": "TG"
      },
      {
        "@type": "ContactPoint",
        "contactType": "technical support",
        "telephone": phone,
        "email": "support@lokaz.com",
        "availableLanguage": ["French"]
      },
      {
        "@type": "ContactPoint",
        "contactType": "billing support",
        "telephone": phone,
        "email": "billing@lokaz.com",
        "availableLanguage": ["French"]
      }
    ],
    "knowsAbout": [
      "Location immobilière",
      "Vente immobilière",
      "Gestion locative",
      "Marché immobilier togolais",
      "Location courte durée",
      "Location à l'heure",
      "Investissement immobilier"
    ],
    "memberOf": {
      "@type": "Organization",
      "name": "Chambre de Commerce du Togo"
    },
    "founder": {
      "@type": "Person",
      "name": "Équipe Lokaz"
    },
    "foundingDate": "2024",
    "slogan": "La plateforme immobilière connectée du Togo"
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": website
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Services",
        "item": `${website}/search`
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Comment réserver un logement sur Lokaz ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pour réserver un logement, inscrivez-vous sur notre plateforme, recherchez le bien qui vous intéresse, puis cliquez sur 'Réserver'. Vous pourrez choisir vos dates et effectuer le paiement sécurisé."
        }
      },
      {
        "@type": "Question",
        "name": "Qu'est-ce que le service Chap-Chap ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Le service Chap-Chap permet de louer des espaces à l'heure ou à la journée pour des besoins urgents : bureaux, salles de réunion, ou logements pour courts séjours."
        }
      },
      {
        "@type": "Question",
        "name": "Quels moyens de paiement acceptez-vous ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nous acceptons TMoney, Flooz, Orange Money et les paiements en espèces. Tous nos paiements sont sécurisés."
        }
      },
      {
        "@type": "Question",
        "name": "Dans quelles villes êtes-vous présents ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nous sommes présents dans tout le Togo, avec une forte concentration à Lomé, Kara, Sokodé, Kpalimé et Atakpamé."
        }
      }
    ]
  };

  return (
    <Helmet>
      {/* Local Business Schema */}
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>

      {/* Breadcrumb Schema */}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>

      {/* FAQ Schema */}
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      {/* Geo meta tags */}
      <meta name="geo.region" content="TG" />
      <meta name="geo.placename" content={address.addressLocality} />
      <meta name="geo.position" content={`${coordinates.latitude};${coordinates.longitude}`} />
      <meta name="ICBM" content={`${coordinates.latitude}, ${coordinates.longitude}`} />

      {/* Dublin Core meta tags */}
      <meta name="DC.title" content={businessName} />
      <meta name="DC.creator" content={businessName} />
      <meta name="DC.subject" content="Immobilier, Location, Vente, Togo" />
      <meta name="DC.description" content={description} />
      <meta name="DC.publisher" content={businessName} />
      <meta name="DC.contributor" content={businessName} />
      <meta name="DC.date" content="2024" />
      <meta name="DC.type" content="Service" />
      <meta name="DC.format" content="text/html" />
      <meta name="DC.identifier" content={website} />
      <meta name="DC.source" content={website} />
      <meta name="DC.language" content="fr" />
      <meta name="DC.coverage" content="Togo" />
      <meta name="DC.rights" content={`© 2024 ${businessName}`} />
    </Helmet>
  );
};

export default LocalSEO;
