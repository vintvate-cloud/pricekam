import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ProductCard from "@/components/product/ProductCard";
import { SlidersHorizontal, X, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { API_URL } from '@/lib/api-config';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: { name: string };
  brand: string;
  ageGroup: string;
  rating: number;
  badge?: string;
  description: string;
}


const PAGE_SIZE = 12;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const ShopPage = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("category") || "All";

  const [category, setCategory] = useState(initialCat);
  const [brand, setBrand] = useState("All");
  const [ageGroup, setAgeGroup] = useState("All");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const searchQuery = useDebounce(searchInput, 300);

  useEffect(() => {
    const cat = searchParams.get("category");
    setCategory(cat || "All");
    setPage(1);
  }, [searchParams]);

  // Reset to page 1 whenever filters/search change
  useEffect(() => { setPage(1); }, [category, brand, ageGroup, priceRange, searchQuery]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/products`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
    staleTime: 60_000
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  const allCategories = useMemo(() => ["All", ...categories.map((c) => c.name)], [categories]);
  const allBrands = useMemo(() => [...new Set(products.map((p) => p.brand))], [products]);
  const ageGroups = ["0-2", "2-4", "4-6", "6-8", "8+"];
  const maxPrice = useMemo(() => Math.max(10000, ...products.map(p => p.price)), [products]);

  const filtered = useMemo(() => products.filter((p) => {
    if (category !== "All" && p.category.name !== category) return false;
    if (brand !== "All" && p.brand !== brand) return false;
    if (ageGroup !== "All" && p.ageGroup !== ageGroup) return false;
    if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.brand.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [products, category, brand, ageGroup, priceRange, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() =>
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const clearFilters = useCallback(() => {
    setCategory("All"); setBrand("All"); setAgeGroup("All");
    setPriceRange([0, maxPrice]); setSearchInput(""); setPage(1);
  }, [maxPrice]);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-all ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-3">Brand</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setBrand("All")} className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-all ${brand === "All" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>All</button>
          {allBrands.map((b) => (
            <button key={b} onClick={() => setBrand(b)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-all ${brand === b ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {b}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-3">Age Group</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAgeGroup("All")} className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-all ${ageGroup === "All" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>All</button>
          {ageGroups.map((a) => (
            <button key={a} onClick={() => setAgeGroup(a)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-all ${ageGroup === a ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {a} yrs
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-3">
          Price: Up to ₹{priceRange[1].toLocaleString()}
        </h3>
        <input type="range" min="0" max={maxPrice} step="100" value={priceRange[1]}
          onChange={(e) => setPriceRange([0, Number(e.target.value)])}
          className="w-full accent-primary" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>₹0</span><span>₹{maxPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <main className="container mx-auto px-4 py-8">

        {/* Header + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Shop</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border text-sm font-body w-56 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              {searchInput && (
                <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-sm font-semibold font-body">
              {showFilters ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
              Filters
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-64 shrink-0`}>
            <div className="sticky top-32 bg-card p-5 rounded-2xl border border-border shadow-sm">
              <FilterPanel />
            </div>
          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="font-display font-semibold text-muted-foreground animate-pulse">Fetching the best toys...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
                <span className="text-4xl">🔎</span>
                <p className="text-xl font-display font-bold text-foreground mt-4">No products found</p>
                <button onClick={clearFilters} className="mt-4 text-primary font-bold hover:underline">Clear all filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {paginated.map((p) => <ProductCard key={p.id} product={{ ...p, category: p.category.name }} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2.5 rounded-xl bg-card border border-border disabled:opacity-30 hover:bg-muted transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                      .reduce<(number | "...")[]>((acc, n, i, arr) => {
                        if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("...");
                        acc.push(n); return acc;
                      }, [])
                      .map((n, i) =>
                        n === "..." ? (
                          <span key={`dots-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => setPage(n as number)}
                            className={`w-10 h-10 rounded-xl text-sm font-display font-bold transition-all ${page === n ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-card border border-border hover:bg-muted"}`}
                          >
                            {n}
                          </button>
                        )
                      )}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2.5 rounded-xl bg-card border border-border disabled:opacity-30 hover:bg-muted transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShopPage;
