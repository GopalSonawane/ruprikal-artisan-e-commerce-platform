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
    e.stopPropagation();
    
    if (isAddingToCart) return;
    
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.slug}`)}`);
      return;
    }

    setIsAddingToCart(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
          quantity: 1,
        }),
      });

      if (res.ok) {
        toast({
          title: "✅ Added to Cart",
          description: `${product.name} has been added`,
        });
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        throw new Error('Failed to add to cart');
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
    e.stopPropagation();
    
    if (isAddingToCart) return;
    
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.slug}`)}`);
      return;
    }

    setIsAddingToCart(true);
    try {
      const token = localStorage.getItem("bearer_token");
      await fetch("/api/cart", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
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
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAddingToWishlist) return;
    
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.slug}`)}`);
      return;
    }

    setIsAddingToWishlist(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
        }),
      });

      if (res.ok) {
        toast({
          title: "💖 Added to Wishlist",
          description: `${product.name} saved for later`,
        });
      } else {
        throw new Error('Failed to add to wishlist');
      }
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to add to wishlist",
        variant: "destructive",
      });
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="block animate-fadeIn">
      <Card className="group overflow-hidden hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 h-full border-2 hover:border-primary/50 hover:-translate-y-1">
        <CardContent className="p-0 relative">
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImageError(true)}
              unoptimized
            />
            {product.featured && (
              <Badge className="absolute top-2 left-2 text-xs px-2 py-1 bg-gradient-to-r from-primary to-secondary animate-pulse">
                ⭐ Featured
              </Badge>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 bg-white/90 backdrop-blur-sm"
              onClick={handleAddToWishlist}
              disabled={isAddingToWishlist}
            >
              <Heart className={`h-4 w-4 ${isAddingToWishlist ? 'fill-red-500 text-red-500' : ''} transition-all`} />
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-3 bg-gradient-to-b from-transparent to-primary/5">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-center justify-between w-full">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ₹{product.basePrice.toFixed(0)}
            </span>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex-1 gap-1.5 h-9 text-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 font-medium"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add</span>
            </Button>
            <Button
              size="sm"
              onClick={handleBuyNow}
              disabled={isAddingToCart}
              className="flex-1 gap-1.5 h-9 text-sm bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 hover:scale-105 font-medium"
            >
              <Zap className="h-4 w-4" />
              <span>Buy</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}