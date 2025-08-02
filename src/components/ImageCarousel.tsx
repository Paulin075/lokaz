import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ImageCarouselProps {
  images?: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  // Utiliser les images fournies ou un tableau vide si aucune image n'est fournie
  const displayImages = images && images.length > 0 ? images : [];

  // Si aucune image n'est disponible, afficher un message
  if (displayImages.length === 0) {
    return (
      <div className="w-full h-full mx-auto">
        <div className="h-full rounded-lg bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500 text-lg">Aucune image disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full mx-auto">
      <Carousel className="w-full h-full">
        <CarouselContent className="h-full">
          {displayImages.map((image, index) => (
            <CarouselItem key={index} className="h-full">
              <div className="relative h-full rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // En cas d'erreur, masquer l'image et afficher un message
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML =
                        '<div class="w-full h-full flex items-center justify-center bg-gray-100"><p class="text-gray-500">Image non disponible</p></div>';
                    }
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {displayImages.length > 1 && (
          <>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default ImageCarousel;
