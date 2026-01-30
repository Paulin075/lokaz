import React from "react";

const FAQ = () => (
  <div className="max-w-3xl mx-auto py-16 px-4 font-baloo">
    <h1 className="text-3xl md:text-4xl font-bold text-lokaz-orange mb-8 text-center text-foreground">
      Foire Aux Questions (FAQ)
    </h1>
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-lokaz-black mb-2 dark:text-white">
          Comment puis-je réserver un logement sur Lokaz ?
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          Il vous suffit de rechercher un logement, de sélectionner vos dates et
          de suivre les instructions pour finaliser la réservation.
        </p>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-lokaz-black mb-2 dark:text-white">
          Quels sont les moyens de paiement acceptés ?
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          Nous acceptons TMoney, Flooz et Orange Money pour faciliter vos
          transactions.
        </p>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-lokaz-black mb-2 dark:text-white">
          Comment devenir propriétaire sur Lokaz ?
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          Inscrivez-vous en tant que propriétaire, ajoutez vos biens et
          commencez à recevoir des réservations en toute simplicité.
        </p>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-lokaz-black mb-2 dark:text-white">
          Comment contacter le support ?
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          Vous pouvez nous contacter via l'email contact@lokaz.com ou le numéro
          +228 96 20 04 88.
        </p>
      </div>
    </div>
  </div>
);

export default FAQ;
