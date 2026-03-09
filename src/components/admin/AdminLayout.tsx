import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { BarChart3, Package, ShoppingCart, Users, TrendingUp, LogOut, Menu, X, Home, Sun, Moon, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    const { user, isLoading: authLoading, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== "ADMIN")) {
            navigate("/admin");
        }
    }, [user, authLoading, navigate]);

    if (authLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || user.role !== "ADMIN") {
        return null;
    }

    const menuItems = [
        { icon: BarChart3, label: "Dashboard", href: "/admin/dashboard" },
        { icon: Package, label: "Products", href: "/admin/products" },
        { icon: LayoutGrid, label: "Categories", href: "/admin/categories" },
        { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
        { icon: Users, label: "Customers", href: "/admin/customers" },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 bg-card border-r border-border flex-col sticky top-0 h-screen">
                <div className="p-8">
                    <Link to="/" className="flex items-center gap-3 mb-10 group">
                        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <span className="text-2xl">🧸</span>
                        </div>
                        <span className="text-2xl font-display font-black tracking-tight text-primary">
                            Price<span className="text-secondary">Kam</span>
                        </span>
                    </Link>

                    <nav className="space-y-1.5">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.label}
                                    to={item.href}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-display font-bold transition-all ${isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                >
                                    <item.icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground/60"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-border space-y-2">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-display font-bold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                    >
                        {theme === "dark" ? (
                            <>
                                <Sun className="h-5 w-5" /> Light Mode
                            </>
                        ) : (
                            <>
                                <Moon className="h-5 w-5" /> Dark Mode
                            </>
                        )}
                    </button>
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-display font-bold text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                        <Home className="h-5 w-5 text-muted-foreground/60" /> Back to Store
                    </Link>
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-display font-bold text-red-400 hover:bg-red-400/10 transition-all"
                    >
                        <LogOut className="h-5 w-5" /> Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between z-40">
                <span className="text-xl font-display font-black text-primary">Price<span className="text-secondary">Kam</span> <span className="text-[10px] text-primary">Admin</span></span>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className="p-2 text-muted-foreground">
                        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-muted-foreground">
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -300 }}
                        className="md:hidden fixed inset-0 bg-card z-50 p-6 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-2xl font-display font-black text-primary">Price<span className="text-secondary">Kam</span> <span className="text-[10px] text-primary">Admin</span></span>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-foreground"><X /></button>
                        </div>
                        <nav className="space-y-4">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.label}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-4 px-6 py-4 rounded-3xl text-lg font-display font-bold ${location.pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                        }`}
                                >
                                    <item.icon className="h-6 w-6" /> {item.label}
                                </Link>
                            ))}
                        </nav>
                        <button
                            onClick={() => logout()}
                            className="mt-auto flex items-center gap-4 px-6 py-4 rounded-3xl text-lg font-display font-bold text-red-400"
                        >
                            <LogOut className="h-6 w-6" /> Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 w-full pt-16 md:pt-0 overflow-x-hidden bg-background custom-scrollbar scroll-smooth">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
