
import React from 'react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

interface ImageCarouselProps {
  images?: string[]
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const defaultImages = [
    '/lovable-uploads/7d3be4b1-8ad5-479c-b3c8-ecd363f64ce3.png',
    'https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80'
  ]

  const displayImages = images && images.length > 0 ? images : defaultImages

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <Carousel className="w-full">
        <CarouselContent>
          {displayImages.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative h-96 rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt={`Logement ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold font-baloo">
                    Logement de qualité au Togo
                  </h3>
                  <p className="text-sm opacity-90">
                    Découvrez nos espaces modernes et confortables
                  </p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </div>
  )
}

export default ImageCarousel
