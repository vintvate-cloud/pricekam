import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ProductCard from "@/components/product/ProductCard";
import { useCart } from "@/context/CartContext";
import { Star, Minus, Plus, ChevronLeft, ShoppingCart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from '@/lib/api-config';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: { id: string; name: string };
  brand: string;
  ageGroup: string;
  rating: number;
  badge?: string;
  description: string;
  sizes?: string[];
  sizeChart?: string;
  sizeChartData?: { headers: string[], rows: string[][] };
}



const ProductPage = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/products/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setActiveImage(data.image);
      return data;
    },
    enabled: !!id
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/products`, { credentials: 'include' });
      return res.json();
    }
  });

  const allImages = useMemo(() => {
    if (!product) return [];
    return [product.image, ...(product.images || [])].filter(Boolean);
  }, [product]);

  const related = useMemo(() => {
    if (!product || !allProducts.length) return [];
    return allProducts
      .filter((p) => p.category.id === product.category.id && p.id !== product.id)
      .slice(0, 4);
  }, [product, allProducts]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center font-display text-2xl animate-pulse text-primary">
      Magic is happening... 🪄
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
      <span className="text-6xl mb-4">😿</span>
      <h1 className="text-3xl font-display font-bold text-foreground">Toy Not Found</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">Oops! It seems this toy is currently playing hide and seek. Try another one!</p>
      <Link to="/" className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl font-display font-bold hover:scale-105 transition-all">Back Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <main className="container mx-auto px-4 py-8">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-display font-bold mb-8 transition-colors">
          <ChevronLeft className="h-4 w-4" /> BACK TO SHOP
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          <div className="space-y-6 w-full max-w-[600px] mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-[2rem] overflow-hidden bg-muted group shadow-2xl border border-border/50 cursor-zoom-in"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              <img
                src={activeImage || product.image}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-200 ease-out"
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: isZoomed ? 'scale(2.5)' : 'scale(1)'
                }}
              />
            </motion.div>

            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-primary ring-4 ring-primary/10' : 'border-transparent hover:border-primary/50'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col py-2 w-full overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-display font-black tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">{product.brand}</span>
              {product.badge && <span className="text-xs font-display font-black tracking-widest text-secondary uppercase bg-secondary/10 px-3 py-1 rounded-full">{product.badge}</span>}
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight leading-none">{product.title}</h1>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-1 bg-secondary/10 text-secondary px-3 py-1.5 rounded-xl">
                <Star className="h-5 w-5 fill-secondary" />
                <span className="text-base font-display font-black">{product.rating}</span>
              </div>
              <span className="text-muted-foreground font-body font-semibold">| Available for ages {product.ageGroup} yrs</span>
            </div>

            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-5xl font-display font-black text-primary">₹{product.price}</span>
              {product.originalPrice && <span className="text-2xl text-muted-foreground line-through font-body font-bold opacity-50">₹{product.originalPrice}</span>}
            </div>

            <p className="text-muted-foreground font-body text-lg mb-8 leading-relaxed max-w-xl">{product.description}</p>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-display font-black tracking-widest text-foreground uppercase">CHOOSE SIZE</span>
                  { (product.sizeChart || product.sizeChartData) && (
                    <button 
                      onClick={() => setShowSizeChart(true)}
                      className="text-xs font-display font-black text-primary hover:underline transition-all"
                    >
                      VIEW SIZE CHART
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[56px] h-14 px-4 rounded-2xl font-display font-black text-lg transition-all border-2 ${
                        selectedSize === size 
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105' 
                        : 'bg-background text-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-6 mt-auto">
              <div className="flex items-center gap-6 bg-muted/50 border border-border p-2 px-4 rounded-3xl w-full sm:w-auto">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-card rounded-2xl transition-all font-black text-xl active:scale-90"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="font-display font-black text-2xl w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-card rounded-2xl transition-all font-black text-xl active:scale-90"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  if (!user) {
                    toast.error("Please login to add items to cart", {
                      description: "You need an account to shop with us!",
                      duration: 3000,
                    });
                    navigate("/login");
                    return;
                  }
                  if (product.sizes && product.sizes.length > 0 && !selectedSize) {
                    toast.error("Please select a size", {
                      description: "Choosing your perfect fit ensures maximum joy! ✨",
                    });
                    return;
                  }
                  addItem({ ...product, category: product.category.name }, selectedSize || undefined);
                  toast.success(`${product.title} added to cart!`, {
                    description: `${selectedSize ? `Size: ${selectedSize} | ` : ''}₹${product.price} × ${qty}`,
                    duration: 2500,
                  });
                }}
                className="flex-1 w-full py-5 bg-primary text-primary-foreground rounded-3xl font-display font-black text-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-primary/30"
              >
                <ShoppingCart className="h-6 w-6" /> ADD TO JOYBAG
              </button>
            </div>
          </motion.div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="text-3xl font-display font-black text-foreground mb-10 tracking-tight">MORE MAGIC DISCOVERIES</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
              {related.map((p) => <ProductCard key={p.id} product={{ ...p, category: p.category.name }} />)}
            </div>
          </section>
        )}
      </main>

      {/* Size Chart Modal */}
      <AnimatePresence>
        {showSizeChart && (product.sizeChart || product.sizeChartData) && (
          <div className="fixed inset-0 flex items-center justify-center p-4 md:p-6 z-[100]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSizeChart(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-card rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-border"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-display font-black text-foreground tracking-tight">Size Guide ✨</h2>
                  <p className="text-muted-foreground font-body text-sm font-medium italic">Find your perfect fit for maximum comfort.</p>
                </div>
                <button 
                  onClick={() => setShowSizeChart(false)} 
                  className="p-4 bg-accent rounded-2xl hover:bg-red-400/10 hover:text-red-400 transition-all"
                >
                  <Plus className="h-6 w-6 rotate-45" />
                </button>
              </div>
              
              <div className="rounded-[2rem] overflow-hidden bg-accent border-2 border-border shadow-inner">
                {product.sizeChartData ? (
                  <div className="overflow-x-auto p-1">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-primary shadow-sm">
                          {product.sizeChartData.headers.map((header, i) => (
                            <th key={i} className="p-4 text-left font-display font-black text-primary-foreground uppercase text-xs tracking-widest first:rounded-tl-2xl last:rounded-tr-2xl">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {product.sizeChartData.rows.map((row, i) => (
                          <tr key={i} className={`transition-colors ${i % 2 === 0 ? 'bg-background' : 'bg-muted/30'} hover:bg-primary/5`}>
                            {row.map((cell, j) => (
                              <td key={j} className={`p-4 font-body font-bold text-foreground border-b border-border/50 ${i === product.sizeChartData!.rows.length - 1 ? (j === 0 ? 'rounded-bl-2xl' : (j === row.length - 1 ? 'rounded-br-2xl' : '')) : ''}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : product.sizeChart ? (
                  <img 
                    src={product.sizeChart} 
                    alt="Size Chart" 
                    className="w-full h-auto object-contain max-h-[60vh]"
                  />
                ) : (
                  <div className="p-20 text-center">
                    <p className="text-muted-foreground font-display font-bold">No size chart available for this treasure yet. 🧩</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-border flex justify-end">
                <button 
                  onClick={() => setShowSizeChart(false)}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-display font-black hover:scale-105 transition-all shadow-xl shadow-primary/20"
                >
                  GOT IT, THANKS!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default ProductPage;
