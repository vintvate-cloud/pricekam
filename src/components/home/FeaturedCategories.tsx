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
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="block p-8 h-full rounded-[2.5rem] border transition-all active:scale-[0.98] group hover:shadow-xl hover:-translate-y-1"
                style={{ 
                  backgroundColor: `${cat.color}15`, 
                  borderColor: `${cat.color}30` 
                }}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-6"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  {cat.icon || "🧸"}
                </div>
                <h3 className="font-display font-black text-foreground text-xl mb-1 uppercase tracking-tight">{cat.name}</h3>
                <div className="flex items-center gap-2 text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mt-2">
                  EXPLORE {cat.name}
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
