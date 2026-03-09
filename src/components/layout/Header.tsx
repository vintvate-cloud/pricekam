import { useState } from "react";
import { Search, ShoppingCart, User, Menu, X, Moon, Sun, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from '@/lib/api-config';



const Header = () => {
  const { setIsOpen, itemCount } = useCart();
  const { user, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  const staticNavItems = [
    { label: "Home", to: "/" },
    { label: "Shop All", to: "/shop" },
  ];

  const dynamicNavItems = categories?.map((cat: any) => ({
    label: cat.name,
    to: `/shop?category=${encodeURIComponent(cat.name)}`
  })) || [];

  const navItems = [...staticNavItems, ...dynamicNavItems];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <span className="text-3xl transition-transform group-hover:rotate-12">🛍️</span>
          <span className="text-2xl font-display font-black tracking-tight text-primary">
            Price<span className="text-secondary">kam</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Search Pricekam for toys, clothes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-muted border-transparent border-2 outline-none text-sm font-body focus:bg-card focus:border-primary/20 transition-all font-medium"
          />
        </form>

        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={toggleTheme} className="p-2.5 rounded-2xl hover:bg-muted transition-colors" title="Toggle Theme">
            {theme === "dark" ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
          </button>

          <AnimatePresence mode="wait">
            {!isLoading && user ? (
              <Link
                to={user.role === 'ADMIN' ? "/admin/dashboard" : "/profile"}
                key="user-profile"
                className="flex items-center gap-2 p-1.5 pr-3 md:p-2.5 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-all border border-primary/20"
              >
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-display font-bold text-xs uppercase">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden md:inline text-sm font-display font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[80px]">
                  {user.name?.split(' ')[0]}
                </span>
              </Link>
            ) : !isLoading && (
              <Link to="/login" key="login-link" className="p-2.5 rounded-2xl hover:bg-muted transition-colors flex items-center gap-2">
                <LogIn className="h-5 w-5 text-foreground" />
                <span className="hidden md:inline text-sm font-display font-bold">Login</span>
              </Link>
            )}
          </AnimatePresence>

          <button onClick={() => setIsOpen(true)} className="p-2.5 rounded-2xl hover:bg-muted transition-colors relative">
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 bg-secondary text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-card"
              >
                {itemCount}
              </motion.span>
            )}
          </button>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2.5 rounded-2xl hover:bg-muted transition-colors md:hidden">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <nav className="hidden md:block border-t border-border/50">
        <div className="container mx-auto px-4 flex items-center gap-1 py-1 overflow-x-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to} className="whitespace-nowrap px-4 py-2.5 text-xs lg:text-sm font-display font-bold text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all uppercase tracking-wider">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden border-t border-border overflow-hidden bg-card">
            <div className="p-4 space-y-2">
              <form onSubmit={handleSearch} className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted text-sm font-body outline-none" />
              </form>
              {navItems.map((item) => (
                <Link key={item.label} to={item.to} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-base font-display font-bold text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all">
                  {item.label}
                </Link>
              ))}
              {user ? (
                user.role === 'ADMIN' ? (
                  <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-base font-display font-bold text-primary bg-primary/5 rounded-2xl transition-all">
                    Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-base font-display font-bold text-primary bg-primary/5 rounded-2xl transition-all">
                      My Profile
                    </Link>
                    <Link to="/profile?tab=orders" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-base font-display font-bold text-primary bg-primary/5 rounded-2xl transition-all">
                      My Orders
                    </Link>
                  </>
                )
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-base font-display font-bold text-primary bg-primary/5 rounded-2xl transition-all">
                  Login / Sign Up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
