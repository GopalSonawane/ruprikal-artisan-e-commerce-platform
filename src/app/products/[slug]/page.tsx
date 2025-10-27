"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, ShoppingCart, Truck, Check, Zap } from "lucide-react";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [shippingInfo, setShippingInfo] = useState<any>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (params.slug) {
      fetchProduct();
    }
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products?slug=${params.slug}`);
      const data = await res.json();
      setProduct(data);

      // Fetch variants
      const variantsRes = await fetch(`/api/product-variants?productId=${data.id}`);
      const variantsData = await variantsRes.json();
      setVariants(variantsData);
      if (variantsData.length > 0) {
        setSelectedVariant(variantsData[0]);
      }

      // Fetch related products
      if (data.categoryId) {
        const relatedRes = await fetch(`/api/products?categoryId=${data.categoryId}&limit=4`);
        const relatedData = await relatedRes.json();
        setRelatedProducts(relatedData.filter((p: any) => p.id !== data.id));
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPincode = async () => {
    if (!pincode || pincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }

    setCheckingPincode(true);
    try {
      const res = await fetch(`/api/shipping-rules?pincode=${pincode}`);
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
      console.error("Failed to check pincode:", error);
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleAddToCart = async () => {
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${params.slug}`)}`);
      return;
    }

    setAddingToCart(true);
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
          variantId: selectedVariant?.id,
          quantity,
        }),
      });
      toast({
        title: "Added to Cart",
        description: "Product added to your cart successfully",
      });
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${params.slug}`)}`);
      return;
    }

    setAddingToCart(true);
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
          variantId: selectedVariant?.id,
          quantity,
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
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${params.slug}`)}`);
      return;
    }

    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
        }),
      });
      toast({
        title: "Added to Wishlist",
        description: "Product added to your wishlist successfully",
      });
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">Loading...</div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button asChild>
            <a href="/products">Browse Products</a>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  const currentPrice = selectedVariant?.price || product.basePrice;
  const imageUrl = !imageError && product.images && product.images.length > 0
      ? product.images[0]
      : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop";

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Product Images */}
          <div>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
              <Image 
                src={imageUrl} 
                alt={product.name} 
                fill 
                className="object-cover" 
                onError={() => setImageError(true)}
                unoptimized
              />
              {product.featured && (
                <Badge className="absolute top-4 left-4">Featured</Badge>
              )}
            </div>
            {!imageError && product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((img: string, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                    <Image 
                      src={img} 
                      alt={`${product.name} ${idx + 2}`} 
                      fill 
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl font-bold text-primary">₹{currentPrice.toFixed(2)}</span>
              {product.featured && <Badge variant="secondary">Featured</Badge>}
            </div>

            <Separator className="my-4" />

            {/* Variants */}
            {variants.length > 0 && (
              <div className="mb-6">
                <Label className="mb-2 block">Select Variant</Label>
                <Select
                  value={selectedVariant?.id.toString()}
                  onValueChange={(value) => {
                    const variant = variants.find((v) => v.id.toString() === value);
                    setSelectedVariant(variant);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id.toString()}>
                        {variant.variantName} - ₹{variant.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <Label className="mb-2 block">Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                  +
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-6">
              <Button 
                size="lg" 
                variant="outline"
                className="flex-1" 
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button 
                size="lg" 
                className="flex-1" 
                onClick={handleBuyNow}
                disabled={addingToCart}
              >
                <Zap className="mr-2 h-5 w-5" />
                Buy Now
              </Button>
              <Button size="lg" variant="outline" onClick={handleAddToWishlist}>
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Pincode Checker */}
            <div>
              <Label className="mb-2 block">Check Delivery</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                />
                <Button onClick={checkPincode} disabled={checkingPincode}>
                  Check
                </Button>
              </div>
              {shippingInfo && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Delivery Available</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <Truck className="inline h-4 w-4 mr-1" />
                    Estimated delivery: {shippingInfo.deliveryDays} days
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Shipping charge: ₹{shippingInfo.shippingCharge.toFixed(2)}
                  </p>
                  {shippingInfo.isCodAvailable && (
                    <p className="text-sm text-muted-foreground">
                      <Check className="inline h-4 w-4 mr-1" />
                      Cash on Delivery available
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}