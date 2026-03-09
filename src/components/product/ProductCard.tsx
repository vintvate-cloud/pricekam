import { motion } from "framer-motion";
import { ShoppingCart, Star, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { useState } from "react";

export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  images?: string[];
  category: string;
  brand: string;
  rating: number;
  badge?: string | null;
  description?: string;
  ageGroup?: string;
}

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    setAdded(true);
    toast.success(`${product.title.substring(0, 30)}${product.title.length > 30 ? "…" : ""} added to cart!`, {
      description: `₹${product.price}`,
      duration: 2500,
    });
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="group bg-card rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-border/50 relative"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-muted">
        <img src={product.image} alt={product.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.badge && (
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-display font-black uppercase tracking-widest shadow-lg ${product.badge === "Sale" ? "bg-accent text-accent-foreground" :
              product.badge === "New" ? "bg-success text-success-foreground" :
                product.badge === "Hot" ? "bg-toy-red text-accent-foreground" :
                  "bg-primary text-primary-foreground"
              }`}>
              {product.badge}
            </span>
          )}
          {discount && (
            <span className="px-3 py-1 rounded-full text-[10px] font-display font-black bg-secondary text-secondary-foreground shadow-lg uppercase tracking-widest">
              SAVE {discount}%
            </span>
          )}
        </div>
      </Link>

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest opacity-60">{product.brand}</span>
          <div className="flex items-center gap-1 bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
            <Star className="h-3 w-3 fill-secondary" />
            <span className="text-[10px] font-display font-black">{product.rating}</span>
          </div>
        </div>

        <Link to={`/product/${product.id}`}>
          <h3 className="font-display font-black text-base text-card-foreground leading-tight mb-4 hover:text-primary transition-colors line-clamp-2 h-10">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-auto pt-2 gap-3">
          <div className="flex flex-col shrink-0">
            <span className="text-2xl font-display font-black text-primary">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through font-body font-bold opacity-40">₹{product.originalPrice}</span>
            )}
          </div>

          <motion.button
            onClick={handleAddToCart}
            whileTap={{ scale: 0.92 }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-display font-bold text-xs transition-all shadow-lg shrink-0 ${added
              ? "bg-emerald-500 text-white shadow-emerald-500/25"
              : "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20"
              }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
