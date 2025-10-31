"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  images: string[] | null;
  featured: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = !imageError && product.images && product.images.length > 0
    ? product.images[0]
    : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.slug}`)}`);
      return;
    }

    setIsAddingToCart(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
          quantity: 1,
        }),
      });

      if (res.ok) {
        toast({
          title: "Added to Cart",
          description: `${product.name} has been added to your cart`,
        });
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.slug}`)}`);
      return;
    }

    setIsAddingToCart(true);
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
          quantity: 1,
        }),
      });
      router.push("/checkout");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast({
        title: "Error",
        description: "Failed to proceed to checkout",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.slug}`)}`);
      return;
    }

    setIsAddingToWishlist(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
        }),
      });

      if (res.ok) {
        toast({
          title: "Added to Wishlist",
          description: `${product.name} has been added to your wishlist`,
        });
      }
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow h-full">
        <CardContent className="p-0 relative">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImageError(true)}
              unoptimized
            />
            {product.featured && (
              <Badge className="absolute top-1.5 left-1.5 text-[10px] md:text-xs px-1.5 py-0.5">
                Featured
              </Badge>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-1.5 right-1.5 h-7 w-7 md:h-8 md:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleAddToWishlist}
              disabled={isAddingToWishlist}
            >
              <Heart className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-1.5 md:gap-2 p-2 md:p-3">
          <h3 className="font-medium text-xs md:text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {product.name}
          </h3>
          <div className="flex items-center justify-between w-full">
            <span className="text-base md:text-lg font-bold text-primary">
              ₹{product.basePrice.toFixed(0)}
            </span>
          </div>
          <div className="flex gap-1.5 md:gap-2 w-full">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex-1 gap-1 h-8 md:h-9 text-xs md:text-sm px-2"
            >
              <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
            <Button
              size="sm"
              onClick={handleBuyNow}
              disabled={isAddingToCart}
              className="flex-1 gap-1 h-8 md:h-9 text-xs md:text-sm px-2"
            >
              <Zap className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Buy</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}