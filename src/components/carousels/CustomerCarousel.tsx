import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";

const CustomerCarousel = () => {
  const testimonials = [
    {
      id: 1,
      name: "María González",
      rating: 5,
      comment: "Excelente calidad y servicio. Los lentes son perfectos y el proceso de compra fue muy fácil.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      rating: 5,
      comment: "Muy satisfecho con mi compra. El diseño es moderno y se ajusta perfectamente.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
    },
    {
      id: 3,
      name: "Ana Martínez",
      rating: 5,
      comment: "Los mejores lentes que he tenido. La protección de luz azul realmente funciona.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
    },
    {
      id: 4,
      name: "Luis Fernández",
      rating: 5,
      comment: "Calidad premium a buen precio. El equipo de atención al cliente es muy profesional.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luis",
    },
    {
      id: 5,
      name: "Elena Torres",
      rating: 5,
      comment: "Me encanta el estilo y la comodidad. Definitivamente volveré a comprar aquí.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
    },
  ];

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Miles de clientes satisfechos confían en nosotros</p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-2">
                  <Card className="hover-lift border-border h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <OptimizedImage
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full bg-secondary"
                          priority={true}
                          quality={80}
                          placeholder="blur"
                        />
                        <div>
                          <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                          <div className="flex gap-1 mt-1">
                            {Array.from({ length: testimonial.rating }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground italic">"{testimonial.comment}"</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default CustomerCarousel;
