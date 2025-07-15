import React from "react";

const Privacy = () => (
  <div className="max-w-3xl mx-auto py-16 px-4 font-baloo">
    <h1 className="text-3xl md:text-4xl font-bold text-lokaz-orange mb-8 text-center">Politique de confidentialité</h1>
    <div className="space-y-6 text-gray-700">
      <p>Lokaz s’engage à protéger vos données personnelles :</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Vos informations sont utilisées uniquement pour la gestion de vos réservations et de votre compte.</li>
        <li>Nous ne partageons pas vos données avec des tiers sans votre consentement.</li>
        <li>Vous pouvez demander la suppression de votre compte à tout moment.</li>
        <li>Pour toute question sur la confidentialité, contactez-nous à lokazsu228@gmail.com.</li>
      </ul>
    </div>
  </div>
);

export default Privacy; 