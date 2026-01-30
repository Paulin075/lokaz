import React from "react";
import { Button } from "@/components/ui/button";
import { Home, TrendingUp, Shield, Smartphone } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="bg-lokaz-orange py-20 px-4 font-baloo relative overflow-hidden">
      {/* Motifs décoratifs */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-8 left-8 w-16 h-16 border-2 border-white rounded-full"></div>
        <div className="absolute top-20 right-12 w-12 h-12 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-16 left-1/4 w-8 h-8 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-8 right-1/3 w-20 h-20 border border-white rounded-full"></div>
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Vous avez un espace à louer ?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-medium">
            Rejoignez des centaines de propriétaires qui font confiance à Lokaz
            pour maximiser leurs revenus locatifs
          </p>
        </div>

        {/* Avantages */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Revenus optimisés
            </h3>
            <p className="text-white/80 text-sm">
              Maximisez vos gains avec notre algorithme de prix intelligent
            </p>
          </div>
          <div className="text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Paiements sécurisés
            </h3>
            <p className="text-white/80 text-sm">
              TMoney, Flooz, Orange Money - tous vos paiements protégés
            </p>
          </div>
          <div className="text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Gestion simplifiée
            </h3>
            <p className="text-white/80 text-sm">
              Tableau de bord complet et facturation automatique
            </p>
          </div>
          <div className="text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Support 24/7</h3>
            <p className="text-white/80 text-sm">
              Équipe dédiée pour vous accompagner à chaque étape
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="bg-white text-lokaz-orange-light hover:bg-gray-50 font-bold py-4 px-12 rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 text-lg"
        >
          <Home className="h-6 w-6 mr-3" />
          Proposer mon logement
        </Button>
      </div>
    </section>
  );
};

export default CallToAction;
