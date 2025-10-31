import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles, Truck, Shield, HeadphonesIcon } from "lucide-react";
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
                    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] bg-muted">
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
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                              {slide.title}
                            </h1>
                            {slide.subtitle && (
                              <p className="text-lg md:text-xl mb-8 text-gray-200">
                                {slide.subtitle}
                              </p>
                            )}
                            {slide.buttonText && slide.linkUrl && (
                              <Button size="lg" asChild>
                                <Link href={slide.linkUrl}>
                                  {slide.buttonText}
                                  <ArrowRight className="ml-2 h-5 w-5" />
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
                  <div className="relative h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-r from-primary/20 to-accent/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                          Welcome to Ruprikal
                        </h1>
                        <p className="text-lg md:text-xl mb-8 text-muted-foreground">
                          Discover unique handmade products
                        </p>
                        <Button size="lg" asChild>
                          <Link href="/products">
                            Shop Now
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </section>

        {/* Features */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Unique Products</h3>
                <p className="text-sm text-muted-foreground">
                  Handcrafted with love and care
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Fast Shipping</h3>
                <p className="text-sm text-muted-foreground">
                  Delivered to your doorstep
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">
                  100% secure transactions
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <HeadphonesIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">24/7 Support</h3>
                <p className="text-sm text-muted-foreground">
                  Always here to help
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Shop by Category</h2>
                <Button variant="outline" asChild>
                  <Link href="/products">View All</Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {categories.map((category: any) => (
                  <Link
                    key={category.id}
                    href={`/products?categoryId=${category.id}`}
                    className="group"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2">
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
                    <h3 className="font-semibold text-center group-hover:text-primary transition-colors">
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
          <section className="py-16 bg-muted/50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Featured Products</h2>
                <Button variant="outline" asChild>
                  <Link href="/products?featured=true">View All</Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start Shopping Today
              </h2>
              <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
                Discover unique handmade gifts, stylish t-shirts, beautiful paintings, and elegant home decor
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/products">
                  Browse All Products
                  <ArrowRight className="ml-2 h-5 w-5" />
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