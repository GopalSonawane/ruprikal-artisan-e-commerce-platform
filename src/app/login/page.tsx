"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error, data } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (error?.code) {
        toast.error("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      toast.success("Welcome Back! 🎉");

      // Check if user is admin (gracefully handle if user profile doesn't exist)
      const token = localStorage.getItem("bearer_token");
      if (data?.user?.id && token) {
        try {
          const profileRes = await fetch(`/api/user-profiles?userId=${data.user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (profileRes.ok) {
            const profiles = await profileRes.json();
            const userProfile = profiles.find((p: any) => p.userId === data.user.id);
            
            if (userProfile?.isAdmin) {
              router.push("/admin");
              return;
            }
          }
        } catch (err) {
          // Silently fail - user profile might not exist yet, that's ok
          console.log("User profile check skipped");
        }
      }

      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 px-4 animate-fadeIn">
      <div className="w-full max-w-md">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-all duration-300 hover:scale-105 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Website
        </Link>

        <div className="bg-card/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border-2 border-primary/20 animate-scaleIn">
          <div className="flex justify-center mb-8">
            <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:scale-110 transition-transform duration-300">
              Ruprikal
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Welcome Back</h1>
          <p className="text-center text-muted-foreground mb-8">
            Sign in to your account 👋
          </p>

          {searchParams.get("registered") && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6 animate-slideIn">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                ✅ Registration successful! Please sign in.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-slideIn">
              <Label htmlFor="email" className="font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                className="mt-1.5 border-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
              <Label htmlFor="password" className="font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                autoComplete="off"
                className="mt-1.5 border-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex items-center space-x-2 animate-slideIn" style={{ animationDelay: '0.2s' }}>
              <Checkbox
                id="remember"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, rememberMe: checked as boolean })
                }
                disabled={loading}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                Remember me
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 hover:scale-105 font-semibold shadow-lg hover:shadow-xl" 
              disabled={loading}
            >
              {loading ? "Signing in... ⏳" : "Sign In 🚀"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:text-secondary font-semibold hover:underline transition-all">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}