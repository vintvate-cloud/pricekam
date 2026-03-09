import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/product/ProductCard";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { API_URL } from '@/lib/api-config';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: { name: string };
  brand: string;
  ageGroup: string;
  rating: number;
  badge?: string;
}



const ProductGridSection = () => {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-display font-bold text-foreground mb-4 tracking-tight">Trending JoyPicks</h2>
        <p className="text-muted-foreground font-body max-w-lg mx-auto leading-relaxed">Our most loved toys, carefully picked for your little ones' happiness!</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
        >
          {products.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={{ ...product, category: product.category.name }}
            />
          ))}
        </motion.div>
      )}
    </section>
  );
};

export default ProductGridSection;
