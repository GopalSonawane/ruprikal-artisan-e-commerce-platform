"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, User, Menu, Search, LogOut, Shield, Package, ChevronDown, Sparkles, Shirt, Frame, Home as HomeIcon, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export default function Header() {
  const { data: session, refetch } = useSession();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchCartCount();
      checkAdminStatus();
    }
    
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [session]);

  const fetchCartCount = async () => {
    if (!session?.user?.id) return;
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/cart?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    }
  };

  const checkAdminStatus = async () => {
    if (!session?.user?.id) return;
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/user-profiles?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profiles = await res.json();
        const userProfile = profiles.find((p: any) => p.userId === session.user.id);
        if (userProfile?.isAdmin) {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");
    await authClient.signOut({
      fetchOptions: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    localStorage.removeItem("bearer_token");
    refetch();
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const categories = [
    { id: 1, name: "Handmade Gifts", icon: Gift, href: "/products?categoryId=1", description: "Unique handcrafted presents" },
    { id: 2, name: "T-Shirts", icon: Shirt, href: "/products?categoryId=2", description: "Custom printed apparel" },
    { id: 3, name: "Paintings", icon: Frame, href: "/products?categoryId=3", description: "Beautiful artwork" },
    { id: 4, name: "Home Decor", icon: HomeIcon, href: "/products?categoryId=4", description: "Elegant decorations" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-lg shadow-primary/5">
      <div className="container mx-auto px-4">
        {/* Main Navigation Bar */}
        <div className="flex h-16 md:h-20 items-center gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 hover:scale-110 transition-all duration-300 rounded-xl">
                <Menu className="h-5 w-5 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] sm:w-[380px] bg-gradient-to-br from-background via-primary/5 to-secondary/5 backdrop-blur-xl border-primary/20">
              <nav className="flex flex-col gap-6 mt-8">
                <Link 
                  href="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-semibold py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 transition-all duration-300 hover:translate-x-2 border border-transparent hover:border-primary/30"
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                  Home
                </Link>
                <Link 
                  href="/products" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-semibold py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 transition-all duration-300 hover:translate-x-2 border border-transparent hover:border-primary/30"
                >
                  <Package className="h-5 w-5 text-secondary" />
                  All Products
                </Link>
                
                <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent my-2" />
                
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-4">Categories</p>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 transition-all duration-300 hover:translate-x-2 border border-transparent hover:border-primary/30 group"
                  >
                    <cat.icon className="h-5 w-5 text-accent group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-semibold">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="relative h-10 w-28 md:h-14 md:w-40 transition-transform duration-300 group-hover:scale-105">
              {!imageError ? (
                <Image
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/website-logo-1761483463156.jpeg"
                  alt="Ruprikal Logo"
                  fill
                  className="object-contain"
                  priority
                  onError={() => setImageError(true)}
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <span className="text-xl md:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                    Ruprikal
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Desktop Mega Menu Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            <Link 
              href="/" 
              className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover:scale-105 relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 data-[state=open]:bg-gradient-to-r data-[state=open]:from-primary/20 data-[state=open]:to-secondary/20">
                    <Package className="h-4 w-4 mr-2" />
                    Categories
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-2 gap-3 p-6 w-[500px] bg-gradient-to-br from-background via-primary/5 to-secondary/5 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl">
                      {categories.map((cat) => (
                        <NavigationMenuLink key={cat.id} asChild>
                          <Link
                            href={cat.href}
                            className="flex items-start gap-3 p-4 rounded-xl hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 transition-all duration-300 hover:scale-105 border border-transparent hover:border-primary/30 hover:shadow-lg group"
                          >
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <cat.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm mb-1">{cat.name}</p>
                              <p className="text-xs text-muted-foreground">{cat.description}</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link 
              href="/products" 
              className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover:scale-105 relative group"
            >
              All Products
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[180px] lg:w-[280px] pl-10 bg-background/50 border-primary/20 focus:border-primary transition-all rounded-xl hover:shadow-lg hover:shadow-primary/10 focus:shadow-lg focus:shadow-primary/20"
                />
              </div>
            </form>

            {/* Wishlist */}
            {session?.user && (
              <Button 
                variant="ghost" 
                size="icon" 
                asChild 
                className="h-10 w-10 hover:bg-primary/10 hover:scale-110 transition-all duration-300 rounded-xl relative group"
              >
                <Link href="/wishlist">
                  <Heart className="h-5 w-5 text-primary group-hover:fill-primary transition-all" />
                </Link>
              </Button>
            )}

            {/* Cart */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-10 w-10 hover:bg-primary/10 hover:scale-110 transition-all duration-300 rounded-xl group" 
              asChild
            >
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 px-1 text-xs bg-gradient-to-r from-primary to-secondary border-2 border-background animate-bounce">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* User Menu */}
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 hover:bg-primary/10 hover:scale-110 transition-all duration-300 rounded-xl"
                  >
                    <User className="h-5 w-5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-gradient-to-br from-background via-primary/5 to-secondary/5 backdrop-blur-xl border-primary/20 rounded-xl shadow-2xl animate-scaleIn">
                  <div className="flex items-center gap-3 p-3 border-b border-primary/10">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{session.user.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-primary/10" />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 cursor-pointer rounded-lg mx-1 my-1">
                        <Link href="/admin" className="flex items-center text-primary font-semibold">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-primary/10" />
                    </>
                  )}
                  <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 cursor-pointer rounded-lg mx-1 my-1">
                    <Link href="/orders" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 cursor-pointer rounded-lg mx-1 my-1">
                    <Link href="/wishlist" className="flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/10" />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg mx-1 my-1"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                asChild 
                className="h-10 px-6 bg-gradient-to-r from-primary via-secondary to-accent hover:from-accent hover:via-primary hover:to-secondary transition-all duration-500 hover:scale-105 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30"
              >
                <Link href="/login">Sign In ✨</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-background/50 border-primary/20 focus:border-primary transition-all rounded-xl"
            />
          </div>
        </form>
      </div>
    </header>
  );
}