import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { API_URL } from '@/lib/api-config';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  _count?: { products: number };
}

const colorMap: Record<string, string> = {
  "toy-orange": "bg-toy-orange/10 hover:bg-toy-orange/20 border-toy-orange/20",
  "toy-cyan": "bg-toy-cyan/10 hover:bg-toy-cyan/20 border-toy-cyan/20",
  "toy-purple": "bg-toy-purple/10 hover:bg-toy-purple/20 border-toy-purple/20",
  "toy-red": "bg-toy-red/10 hover:bg-toy-red/20 border-toy-red/20",
};



const FeaturedCategories = () => {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-display font-bold text-foreground mb-4 tracking-tight">Shop by Category</h2>
        <p className="text-muted-foreground font-body max-w-lg mx-auto">Explore our worlds of imagination, one world at a time!</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {categories.slice(0, 4).map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/shop?category=${cat.name}`}
                className={`block p-8 h-full rounded-3xl border transition-all active:scale-[0.98] ${colorMap[cat.color || ""] || "bg-muted hover:bg-muted/80 border-border"}`}
              >
                <span className="text-5xl mb-4 block drop-shadow-sm">{cat.icon || "🧸"}</span>
                <h3 className="font-display font-bold text-foreground text-xl mb-1">{cat.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-body font-semibold group">
                  Explore Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedCategories;
