"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Password Mismatch", {
        description: "Passwords do not match",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Weak Password", {
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    setLoading(true);

    try {
      const { error, data } = await authClient.signUp.email({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      });

      if (error?.code) {
        const errorMessage =
          error.code === "USER_ALREADY_EXISTS"
            ? "User already registered"
            : "Registration failed";
        toast.error("Registration Failed", {
          description: errorMessage,
        });
        setLoading(false);
        return;
      }

      // Create user profile with actual user ID
      const token = localStorage.getItem("bearer_token");
      if (data?.user?.id) {
        await fetch("/api/user-profiles", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: data.user.id,
            fullName: formData.name,
            isAdmin: false,
          }),
        });
      }

      toast.success("Registration Successful", {
        description: "Your account has been created successfully!",
      });

      router.push("/login?registered=true");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Error", {
        description: "An error occurred during registration",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 px-4 animate-fadeIn">
      <div className="w-full max-w-md">
        {/* Back to Website Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-all duration-300 hover:scale-105 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Website
        </Link>

        <div className="bg-card/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border-2 border-primary/20 animate-scaleIn">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:scale-110 transition-transform duration-300">
              Ruprikal
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Create Account</h1>
          <p className="text-center text-muted-foreground mb-8">
            Join Ruprikal today ✨
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-slideIn">
              <Label htmlFor="name" className="font-medium">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
                className="mt-1.5 border-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
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

            <div className="animate-slideIn" style={{ animationDelay: '0.2s' }}>
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
              <p className="text-xs text-muted-foreground mt-1">
                At least 6 characters
              </p>
            </div>

            <div className="animate-slideIn" style={{ animationDelay: '0.3s' }}>
              <Label htmlFor="confirmPassword" className="font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                disabled={loading}
                autoComplete="off"
                className="mt-1.5 border-primary/20 focus:border-primary transition-all"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 hover:scale-105 font-semibold shadow-lg hover:shadow-xl" 
              disabled={loading}
            >
              {loading ? "Creating account... ⏳" : "Create Account 🚀"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-secondary font-semibold hover:underline transition-all">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}