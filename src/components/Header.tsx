"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, User, Menu, Search, LogOut, Shield } from "lucide-react";
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

export default function Header() {
  const { data: session, refetch } = useSession();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchCartCount();
      checkAdminStatus();
    }
  }, [session]);

  const fetchCartCount = async () => {
    try {
      const res = await fetch(`/api/cart?userId=${session?.user?.id}`);
      const data = await res.json();
      setCartCount(data.length || 0);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/user-profiles?userId=${session?.user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const profiles = await res.json();
        const userProfile = profiles.find((p: any) => p.userId === session?.user?.id);
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    }
  };

  const NavLinks = () => (
    <>
      <Link href="/" className="hover:text-primary transition-colors py-2">
        Home
      </Link>
      <Link href="/products" className="hover:text-primary transition-colors py-2">
        Products
      </Link>
      <Link href="/products?categoryId=1" className="hover:text-primary transition-colors py-2">
        Handmade Gifts
      </Link>
      <Link href="/products?categoryId=2" className="hover:text-primary transition-colors py-2">
        T-Shirts
      </Link>
      <Link href="/products?categoryId=3" className="hover:text-primary transition-colors py-2">
        Paintings
      </Link>
      <Link href="/products?categoryId=4" className="hover:text-primary transition-colors py-2">
        Home Decor
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-blue-500/10 backdrop-blur-md supports-[backdrop-filter]:bg-blue-500/10">
      <div className="container mx-auto px-3 md:px-4">
        {/* Top Bar */}
        <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4">
          {/* Mobile Menu - Left Side */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="relative h-8 w-20 sm:h-10 sm:w-28 md:h-12 md:w-36">
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
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                    Ruprikal
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium flex-1 justify-center">
            <NavLinks />
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 md:gap-2 ml-auto">
            {/* Search - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] lg:w-[300px]"
              />
            </form>

            {/* Wishlist */}
            {session?.user && (
              <Button variant="ghost" size="icon" asChild className="h-9 w-9 md:h-10 md:w-10">
                <Link href="/wishlist">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-[10px] md:text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* User Menu */}
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="text-primary font-medium">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist">Wishlist</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" asChild className="text-xs md:text-sm h-8 md:h-9 px-3 md:px-4">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </form>
      </div>
    </header>
  );
}