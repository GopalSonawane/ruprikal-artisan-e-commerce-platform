"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ImageIcon,
  Tag,
  Truck,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/admin");
    } else if (session?.user) {
      checkAdminStatus();
    }
  }, [session, isPending, router]);

  const checkAdminStatus = async () => {
    setIsCheckingAdmin(true);
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
        } else {
          setIsAdmin(false);
        }
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
    } finally {
      setIsCheckingAdmin(false);
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

  if (isPending || isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>Access Denied</strong>
              <p className="mt-2">You don't have permission to access the admin dashboard.</p>
              <p className="text-sm mt-2">Current user: {session.user.email}</p>
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => router.push("/")} className="flex-1">
              Go to Home
            </Button>
            <Button variant="default" onClick={handleSignOut} className="flex-1">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/admin/slides", icon: ImageIcon, label: "Homepage Slides" },
    { href: "/admin/discounts", icon: Tag, label: "Discounts" },
    { href: "/admin/shipping", icon: Truck, label: "Shipping Rules" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <Link href="/">
            <div className="relative h-12 w-32">
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/website-logo-1761483463156.jpeg?width=400&height=400&resize=contain"
                alt="Ruprikal Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">{session.user.name}</p>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Admin</span>
            </div>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          <Button variant="ghost" className="w-full mt-2" asChild>
            <Link href="/">View Store</Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}