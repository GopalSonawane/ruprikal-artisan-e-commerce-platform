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
      next: { revalidate: 300 } // Cache for 5 minutes
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
      next: { revalidate: 300 } // Cache for 5 minutes
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
      next: { revalidate: 600 } // Cache for 10 minutes (categories change less frequently)
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
                    <div className="relative h-[300px] md:h-[400px] lg:h-[500px] bg-muted">
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
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
                      <div className="absolute inset-0 flex items-center">
                        <div className="container mx-auto px-4">
                          <div className="max-w-2xl text-white">
                            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">
                              {slide.title}
                            </h1>
                            {slide.subtitle && (
                              <p className="text-sm md:text-lg mb-4 md:mb-6 text-gray-200">
                                {slide.subtitle}
                              </p>
                            )}
                            {slide.buttonText && slide.linkUrl && (
                              <Button size="sm" asChild className="md:text-base">
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
                  <div className="relative h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-r from-primary/20 to-accent/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4">
                        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">
                          Welcome to Ruprikal
                        </h1>
                        <p className="text-sm md:text-lg mb-4 md:mb-6 text-muted-foreground">
                          Discover unique handmade products
                        </p>
                        <Button size="sm" asChild className="md:text-base">
                          <Link href="/products">
                            Shop Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:left-4 h-8 w-8 md:h-10 md:w-10" />
            <CarouselNext className="right-2 md:right-4 h-8 w-8 md:h-10 md:w-10" />
          </Carousel>
        </section>

        {/* Features */}
        <section className="py-6 md:py-10 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm md:text-base mb-1">Unique Products</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Handcrafted with love
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
                  <Truck className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm md:text-base mb-1">Fast Shipping</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Quick delivery
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
                  <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm md:text-base mb-1">Secure Payment</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  100% secure
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
                  <HeadphonesIcon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm md:text-base mb-1">24/7 Support</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Always here
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories - Mobile Optimized */}
        {categories.length > 0 && (
          <section className="py-6 md:py-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Shop by Category</h2>
                <Button variant="ghost" size="sm" asChild className="text-primary">
                  <Link href="/products">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {categories.map((category: any) => (
                  <Link
                    key={category.id}
                    href={`/products?categoryId=${category.id}`}
                    className="group"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2 shadow-sm">
                      {category.imageUrl && (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
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

        {/* Featured Products - Mobile Optimized */}
        {featuredProducts.length > 0 && (
          <section className="py-6 md:py-12 bg-muted/50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Featured Products</h2>
                <Button variant="ghost" size="sm" asChild className="text-primary">
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

        {/* CTA Section - Mobile Optimized */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl md:rounded-2xl p-6 md:p-10 text-center text-white">
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Start Shopping Today
              </h2>
              <p className="text-sm md:text-base lg:text-lg mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto">
                Discover unique handmade gifts, stylish t-shirts, beautiful paintings, and elegant home decor
              </p>
              <Button size="sm" variant="secondary" asChild className="md:text-base">
                <Link href="/products">
                  Browse All Products
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