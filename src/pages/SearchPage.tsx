import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ProductCard from "@/components/product/ProductCard";
import { API_URL } from '@/lib/api-config';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  category: { name: string };
  brand: string;
  rating: number;
  description: string;
}



const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/products`, { credentials: 'include' });
      return res.json();
    }
  });

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [query, products]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-display font-black text-foreground mb-8 tracking-tight">Search JoyLand</h1>

          <div className="relative max-w-2xl mb-12 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search for toys, clothes, gifts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full pl-14 pr-6 py-5 rounded-3xl bg-card border-2 border-transparent focus:border-primary/20 outline-none text-xl font-display font-bold shadow-xl shadow-primary/5 transition-all"
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="font-display font-bold text-muted-foreground">Searching the toy box...</p>
            </div>
          ) : (
            <>
              {query.trim() && (
                <p className="text-lg text-muted-foreground font-display font-bold mb-8 uppercase tracking-widest opacity-60">
                  {results.length} result{results.length !== 1 ? "s" : ""} for "<strong>{query}</strong>"
                </p>
              )}

              {results.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
                  {results.map((product) => (
                    <ProductCard key={product.id} product={{ ...product, category: product.category.name }} />
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border">
                  <span className="text-6xl block mb-6">🕵️‍♂️</span>
                  <p className="font-display font-black text-2xl text-foreground">No treasures found</p>
                  <p className="text-muted-foreground font-body font-medium mt-2 max-w-sm mx-auto leading-relaxed">Try a different magic word or use broader terms like "Toy" or "Red".</p>
                </div>
              ) : (
                <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border">
                  <span className="text-6xl block mb-6">✨</span>
                  <p className="font-display font-black text-2xl text-foreground">Start your treasure hunt</p>
                  <p className="text-muted-foreground font-body font-medium mt-2 max-w-sm mx-auto leading-relaxed">Find amazing toys, outfits, and magical gifts for your little ones!</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
