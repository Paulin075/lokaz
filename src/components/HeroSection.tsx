import React from "react";
import { Button } from "@/components/ui/button";
import { Search, Home, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackgroundCarousel from "./BackgroundCarousel";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Carousel avec overlay plus sombre pour une meilleure lisibilité */}
      <div className="absolute inset-0">
        <BackgroundCarousel />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold font-baloo mb-6 drop-shadow-lg">
          Trouvez votre logement idéal
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          Lokaz vous connecte aux meilleurs logements. Location mensuelle,
          journalière ou à l'heure avec notre service Chap-Chap.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => navigate("/search")}
            size="lg"
            className="bg-lokaz-orange hover:bg-lokaz-orange-light text-white font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Search className="mr-2 h-5 w-5" />
            Commencer ma recherche
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button
            onClick={() => navigate("/signup?type=proprietaire")}
            variant="outline"
            size="lg"
            className="bg-white/90 hover:bg-white text-lokaz-black border-white font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
          >
            <Home className="mr-2 h-5 w-5" />
            Proposer mon logement
          </Button>
        </div>

        {/* Stats ou avantages */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="text-2xl font-bold text-lokaz-orange mb-1">
              500+
            </div>
            <div className="text-sm">Logements disponibles</div>
          </div>
          <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="text-2xl font-bold text-lokaz-orange mb-1">
              24/7
            </div>
            <div className="text-sm">Support client</div>
          </div>
          <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="text-2xl font-bold text-lokaz-orange mb-1">
              100%
            </div>
            <div className="text-sm">Sécurisé</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
