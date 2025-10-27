"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";

export default function WishlistPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`/api/wishlist?userId=${session?.user?.id}`);
      const data = await res.json();
      setWishlistItems(data);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await fetch(`/api/wishlist?id=${itemId}`, { method: "DELETE" });
      toast({
        title: "Removed",
        description: "Item removed from wishlist",
      });
      fetchWishlist();
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const addToCart = async (productId: number) => {
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          productId,
          quantity: 1,
        }),
      });
      toast({
        title: "Added to Cart",
        description: "Product added to your cart",
      });
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  if (!session?.user) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-8">
            You need to sign in to view your wishlist
          </p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">Loading...</div>
        <Footer />
      </>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Save your favorite products for later
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            const imageUrl =
              item.product?.images?.[0] ||
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";

            return (
              <div key={item.id} className="bg-card rounded-lg border overflow-hidden">
                <Link href={`/products/${item.product?.slug}`}>
                  <div className="relative aspect-square">
                    <Image
                      src={imageUrl}
                      alt={item.product?.name || "Product"}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/products/${item.product?.slug}`}>
                    <h3 className="font-semibold mb-2 hover:text-primary line-clamp-2">
                      {item.product?.name}
                    </h3>
                  </Link>
                  <p className="text-lg font-bold text-primary mb-4">
                    ₹{item.product?.basePrice?.toFixed(2)}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => addToCart(item.productId)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
