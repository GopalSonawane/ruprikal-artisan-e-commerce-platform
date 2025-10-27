"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSession } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "cod",
  });

  useEffect(() => {
    if (session?.user) {
      fetchCart();
      setFormData((prev) => ({
        ...prev,
        fullName: session.user.name || "",
        email: session.user.email || "",
      }));
    } else {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (formData.pincode.length === 6) {
      checkShipping();
    }
  }, [formData.pincode]);

  const fetchCart = async () => {
    try {
      const res = await fetch(`/api/cart?userId=${session?.user?.id}`);
      const data = await res.json();
      setCartItems(data);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkShipping = async () => {
    try {
      const res = await fetch(`/api/shipping-rules?pincode=${formData.pincode}`);
      const data = await res.json();
      if (data.length > 0) {
        setShippingInfo(data[0]);
      } else {
        setShippingInfo(null);
        toast({
          title: "Service Not Available",
          description: "We don't deliver to this pincode yet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to check shipping:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingInfo) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid pincode",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const subtotal = cartItems.reduce((sum, item) => {
        const price = item.variant?.price || item.product?.basePrice || 0;
        return sum + price * item.quantity;
      }, 0);

      const shippingCharge = shippingInfo.shippingCharge || 0;
      const taxAmount = (subtotal * 0.18); // 18% GST
      const totalAmount = subtotal + shippingCharge + taxAmount;

      const shippingAddress = {
        line1: formData.addressLine1,
        line2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      };

      // Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          subtotal,
          shippingCharge,
          taxAmount,
          totalAmount,
          paymentMethod: formData.paymentMethod,
          shippingAddress,
          billingAddress: shippingAddress,
          pincode: formData.pincode,
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
        }),
      });

      const order = await orderRes.json();

      // Create order items
      for (const item of cartItems) {
        const price = item.variant?.price || item.product?.basePrice || 0;
        await fetch("/api/order-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product?.name,
            variantName: item.variant?.variantName,
            quantity: item.quantity,
            unitPrice: price,
            totalPrice: price * item.quantity,
          }),
        });
      }

      // Clear cart
      await fetch(`/api/cart?userId=${session?.user?.id}`, {
        method: "DELETE",
      });

      toast({
        title: "Order Placed",
        description: "Your order has been placed successfully",
      });

      router.push(`/order-confirmation?orderId=${order.id}`);
    } catch (error) {
      console.error("Failed to place order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-8">
            You need to sign in to checkout
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

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some products to checkout
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
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

  const shippingCharge = shippingInfo?.shippingCharge || 0;
  const taxAmount = subtotal * 0.18; // 18% GST
  const totalAmount = subtotal + shippingCharge + taxAmount;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      required
                    />
                    {shippingInfo && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Delivery in {shippingInfo.deliveryDays} days
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={formData.addressLine2}
                      onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="cursor-pointer">
                      Cash on Delivery
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="razorpay" id="razorpay" />
                    <Label htmlFor="razorpay" className="cursor-pointer">
                      Online Payment (Razorpay)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-card p-6 rounded-lg border sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>₹{shippingCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST (18%)</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Total</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting || !shippingInfo}
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
