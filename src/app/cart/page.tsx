"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (session?.user) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchCart = async () => {
    if (!session?.user?.id) return;
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/cart?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1 || updatingItems.has(itemId)) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/cart?id=${itemId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      
      if (res.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const removeItem = async (itemId: number) => {
    if (updatingItems.has(itemId)) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      const token = localStorage.getItem("bearer_token");
      await fetch(`/api/cart?id=${itemId}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: "✅ Item Removed",
        description: "Item removed from cart",
      });
      await fetchCart();
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/discounts?code=${discountCode.toUpperCase()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data || !data.isActive) {
        toast({
          title: "❌ Invalid Code",
          description: "This discount code is not valid",
          variant: "destructive",
        });
        return;
      }

      const now = new Date();
      const validFrom = new Date(data.validFrom);
      const validUntil = new Date(data.validUntil);

      if (now < validFrom || now > validUntil) {
        toast({
          title: "❌ Expired Code",
          description: "This discount code has expired",
          variant: "destructive",
        });
        return;
      }

      if (subtotal < data.minOrderAmount) {
        toast({
          title: "❌ Minimum Order Not Met",
          description: `Minimum order amount is ₹${data.minOrderAmount}`,
          variant: "destructive",
        });
        return;
      }

      setAppliedDiscount(data);
      toast({
        title: "✅ Discount Applied",
        description: `${data.code} applied successfully`,
      });
    } catch (error) {
      console.error("Failed to apply discount:", error);
    }
  };

  if (!session?.user) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-16 text-center animate-fadeIn">
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Please Sign In</h1>
          <p className="text-muted-foreground mb-8">
            You need to sign in to view your cart
          </p>
          <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 hover:scale-105">
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
        <div className="container mx-auto px-4 py-8 text-center animate-pulse">
          <div className="h-8 w-48 bg-primary/20 rounded mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded mx-auto"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-16 text-center animate-fadeIn">
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some products to get started ✨
          </p>
          <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 hover:scale-105">
            <Link href="/products">Browse Products 🛍️</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.price || item.product?.basePrice || 0;
    return sum + price * item.quantity;
  }, 0);

  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === "percentage") {
      discountAmount = (subtotal * appliedDiscount.value) / 100;
      if (appliedDiscount.maxDiscount) {
        discountAmount = Math.min(discountAmount, appliedDiscount.maxDiscount);
      }
    } else {
      discountAmount = appliedDiscount.value;
    }
  }

  const total = subtotal - discountAmount;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 animate-fadeIn">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Shopping Cart 🛒</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => {
              const imageUrl = !imageErrors[item.id] && item.product?.images?.[0]
                ? item.product.images[0]
                : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop";
              const price = item.variant?.price || item.product?.basePrice || 0;
              const isUpdating = updatingItems.has(item.id);

              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gradient-to-br from-card to-primary/5 rounded-xl border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-slideIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={imageUrl}
                      alt={item.product?.name || "Product"}
                      fill
                      className="object-cover"
                      onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
                      unoptimized
                    />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product?.slug}`}
                      className="font-semibold hover:text-primary transition-all"
                    >
                      {item.product?.name}
                    </Link>
                    {item.variant && (
                      <p className="text-sm text-muted-foreground">
                        {item.variant.variantName}
                      </p>
                    )}
                    <p className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-2">
                      ₹{price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={isUpdating}
                      className="hover:bg-destructive/10 hover:text-destructive transition-all hover:scale-110"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-gradient-to-br from-card to-primary/5 p-6 rounded-2xl border-2 border-primary/20 sticky top-24 shadow-xl">
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Order Summary</h2>

              {/* Discount Code */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="border-primary/20 focus:border-primary transition-all"
                  />
                  <Button onClick={applyDiscount} className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all">Apply</Button>
                </div>
                {appliedDiscount && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    ✓ {appliedDiscount.code} applied
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">₹{total.toFixed(2)}</span>
              </div>

              <Button className="w-full mb-2 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 hover:scale-105 font-semibold shadow-lg" size="lg" asChild>
                <Link href="/checkout">Proceed to Checkout 🚀</Link>
              </Button>

              <Button variant="outline" className="w-full hover:bg-primary/10 transition-all" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}