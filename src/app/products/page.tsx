"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    categoryId: searchParams.get("categoryId") || "",
    minPrice: 0,
    maxPrice: 5000,
    sort: "createdAt",
    order: "desc",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters, searchParams]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?isActive=true");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.categoryId) params.append("categoryId", filters.categoryId);
      params.append("minPrice", filters.minPrice.toString());
      params.append("maxPrice", filters.maxPrice.toString());
      params.append("sort", filters.sort);
      params.append("order", filters.order);
      params.append("isActive", "true");

      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      categoryId: "",
      minPrice: 0,
      maxPrice: 5000,
      sort: "createdAt",
      order: "desc",
    });
  };

  const FilterPanel = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm md:text-base bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs hover:scale-105 transition-all">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Category Filter */}
      <div className="animate-slideIn">
        <Label className="mb-2 block text-xs md:text-sm font-medium">Category</Label>
        <Select
          value={filters.categoryId}
          onValueChange={(value) => handleFilterChange("categoryId", value === "all" ? "" : value)}
        >
          <SelectTrigger className="text-xs md:text-sm border-primary/20 focus:border-primary transition-all">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
        <Label className="mb-2 block text-xs md:text-sm font-medium">
          Price Range: <span className="text-primary font-bold">₹{filters.minPrice} - ₹{filters.maxPrice}</span>
        </Label>
        <Slider
          value={[filters.minPrice, filters.maxPrice]}
          max={5000}
          step={100}
          onValueChange={([min, max]) => {
            handleFilterChange("minPrice", min);
            handleFilterChange("maxPrice", max);
          }}
          className="mt-2"
        />
      </div>

      {/* Sort */}
      <div className="animate-slideIn" style={{ animationDelay: '0.2s' }}>
        <Label className="mb-2 block text-xs md:text-sm font-medium">Sort By</Label>
        <Select
          value={`${filters.sort}-${filters.order}`}
          onValueChange={(value) => {
            const [sort, order] = value.split("-");
            handleFilterChange("sort", sort);
            handleFilterChange("order", order);
          }}
        >
          <SelectTrigger className="text-xs md:text-sm border-primary/20 focus:border-primary transition-all">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="basePrice-asc">Price: Low to High</SelectItem>
            <SelectItem value="basePrice-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
            <SelectItem value="name-desc">Name: Z to A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div className="animate-slideIn">
            <h1 className="text-xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Products 🛍️</h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              {loading ? "Loading..." : `${products.length} products found`}
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="sm" className="text-xs hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105">
                <SlidersHorizontal className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] md:w-[300px] animate-slideIn">
              <div className="mt-8">
                <FilterPanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-gradient-to-br from-card to-primary/5 p-6 rounded-2xl border-2 border-primary/20 shadow-lg">
              <FilterPanel />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="mb-4 md:mb-6 animate-slideIn">
              <Input
                type="search"
                placeholder="Search products... 🔍"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="text-sm border-primary/20 focus:border-primary transition-all"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2 md:space-y-3 animate-pulse">
                    <Skeleton className="aspect-square rounded-lg bg-primary/10" />
                    <Skeleton className="h-3 md:h-4 w-3/4 bg-primary/10" />
                    <Skeleton className="h-3 md:h-4 w-1/2 bg-primary/10" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12 animate-scaleIn">
                <p className="text-muted-foreground text-sm md:text-base mb-4">No products found 😔</p>
                <Button variant="outline" className="text-xs md:text-sm hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}