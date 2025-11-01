import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles, Truck, Shield, HeadphonesIcon, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

// Enable static generation with revalidation every 5 minutes
export const revalidate = 300;

async function getHomepageSlides() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/homepage-slides?isActive=true`, {
      next: { revalidate: 300 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Failed to fetch slides:', error);
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/products?featured=true&limit=8`, {
      next: { revalidate: 300 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/categories?isActive=true&limit=5`, {
      next: { revalidate: 600 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export default async function HomePage() {
  const [slides, featuredProducts, categories] = await Promise.all([
    getHomepageSlides(),
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <>
      <Header />
      <main>
        {/* Hero Carousel */}
        <section className="w-full">
          <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
              {slides.length > 0 ? (
                slides.map((slide: any, index: number) => (
                  <CarouselItem key={slide.id}>
                    <div className="relative h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-primary/20 to-accent/20">
                      {slide.imageUrl && (
                        <Image
                          src={slide.imageUrl}
                          alt={slide.title}
                          fill
                          className="object-cover"
                          priority={index === 0}
                          sizes="100vw"
                          quality={85}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-secondary/50 to-transparent" />
                      <div className="absolute inset-0 flex items-center">
                        <div className="container mx-auto px-4">
                          <div className="max-w-2xl text-white animate-slideIn">
                            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 drop-shadow-lg">
                              {slide.title}
                            </h1>
                            {slide.subtitle && (
                              <p className="text-sm md:text-lg mb-4 md:mb-6 text-white/90 drop-shadow">
                                {slide.subtitle}
                              </p>
                            )}
                            {slide.buttonText && slide.linkUrl && (
                              <Button size="sm" asChild className="md:text-base bg-gradient-to-r from-white to-white/90 text-primary hover:scale-105 transition-all duration-300 shadow-xl">
                                <Link href={slide.linkUrl}>
                                  {slide.buttonText}
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem>
                  <div className="relative h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4 animate-scaleIn">
                        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          Welcome to Ruprikal ✨
                        </h1>
                        <p className="text-sm md:text-lg mb-4 md:mb-6 text-foreground/80">
                          Discover unique handmade products
                        </p>
                        <Button size="sm" asChild className="md:text-base bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 hover:scale-105 shadow-lg">
                          <Link href="/products">
                            Shop Now 🛍️
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:left-4 h-8 w-8 md:h-10 md:w-10 hover:scale-110 transition-all" />
            <CarouselNext className="right-2 md:right-4 h-8 w-8 md:h-10 md:w-10 hover:scale-110 transition-all" />
          </Carousel>
        </section>

        {/* Features */}
        <section className="py-6 md:py-10 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Sparkles, title: "Unique Products", desc: "Handcrafted with love", delay: "0s" },
                { icon: Truck, title: "Fast Shipping", desc: "Quick delivery", delay: "0.1s" },
                { icon: Shield, title: "Secure Payment", desc: "100% secure", delay: "0.2s" },
                { icon: HeadphonesIcon, title: "24/7 Support", desc: "Always here", delay: "0.3s" }
              ].map((feature, index) => (
                <div key={index} className="flex flex-col items-center text-center group animate-fadeIn" style={{ animationDelay: feature.delay }}>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-all duration-300 group-hover:shadow-lg">
                    <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-base mb-1 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-6 md:py-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-4 md:mb-6 animate-slideIn">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Shop by Category</h2>
                <Button variant="ghost" size="sm" asChild className="text-primary hover:scale-105 transition-all">
                  <Link href="/products">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {categories.map((category: any, index: number) => (
                  <Link
                    key={category.id}
                    href={`/products?categoryId=${category.id}`}
                    className="group animate-fadeIn"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 mb-2 shadow-md border-2 border-transparent group-hover:border-primary/50 transition-all duration-300">
                      {category.imageUrl && (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          quality={75}
                        />
                      )}
                    </div>
                    <h3 className="font-semibold text-xs md:text-sm text-center group-hover:text-primary transition-colors line-clamp-2">
                      {category.name}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-6 md:py-12 bg-gradient-to-b from-background to-primary/5">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-4 md:mb-6 animate-slideIn">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Featured Products ⭐</h2>
                <Button variant="ghost" size="sm" asChild className="text-primary hover:scale-105 transition-all">
                  <Link href="/products?featured=true">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                {featuredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl md:rounded-3xl p-6 md:p-10 text-center text-white shadow-2xl animate-scaleIn">
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 drop-shadow-lg">
                Start Shopping Today 🎉
              </h2>
              <p className="text-sm md:text-base lg:text-lg mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto drop-shadow">
                Discover unique handmade gifts, stylish t-shirts, beautiful paintings, and elegant home decor
              </p>
              <Button size="sm" variant="secondary" asChild className="md:text-base bg-white text-primary hover:scale-110 transition-all duration-300 shadow-xl font-semibold">
                <Link href="/products">
                  Browse All Products 🛍️
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}