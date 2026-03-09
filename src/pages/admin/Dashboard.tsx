import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Package, Users, IndianRupee, Loader2, ArrowUpRight, ArrowDownRight, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { API_URL } from '@/lib/api-config';

interface Stats {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    recentOrders: any[];
    revenueChange: string;
    ordersChange: string;
    productsChange: string;
    customersChange: string;
}



const Dashboard = () => {
    const navigate = useNavigate();
    const { data: stats, isLoading } = useQuery<Stats>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/admin/stats`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
        refetchInterval: 30000 // Poll every 30 seconds for real-time magic
    });

    const displayStats = [
        { label: "Total Revenue", value: `₹${stats?.totalRevenue.toFixed(2) || "0.00"}`, icon: IndianRupee, change: stats?.revenueChange || "0%", color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "up" },
        { label: "Total Orders", value: stats?.totalOrders.toString() || "0", icon: ShoppingCart, change: stats?.ordersChange || "0%", color: "text-blue-500", bg: "bg-blue-500/10", trend: "up" },
        { label: "Toys in Catalog", value: stats?.totalProducts.toString() || "0", icon: Package, change: stats?.productsChange || "0", color: "text-orange-500", bg: "bg-orange-500/10", trend: "up" },
        { label: "Happy Customers", value: stats?.totalUsers.toString() || "0", icon: Users, change: stats?.customersChange || "0%", color: "text-purple-500", bg: "bg-purple-500/10", trend: "up" },
    ];

    return (
        <AdminLayout>
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-2">System Overview</h1>
                    <p className="text-muted-foreground font-body font-medium">Here's what's happening in your toy kingdom today ✨</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {displayStats.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className={`p-4 rounded-2xl ${s.bg} transition-transform group-hover:scale-110 duration-300`}>
                                    <s.icon className={`h-6 w-6 ${s.color}`} />
                                </div>
                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${s.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {s.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {s.change}
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground/60 text-xs font-display font-black uppercase tracking-widest mb-1">{s.label}</p>
                                <p className="text-3xl font-display font-black text-foreground tracking-tight">
                                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" /> : s.value}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm group/sales h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-display font-black text-foreground">Recent Sales</h2>
                            <div className="px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Live Feed</div>
                        </div>
                        <div className="space-y-6">
                            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                                stats.recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform" onClick={() => navigate('/admin/orders')}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:bg-primary/10 transition-colors">🎁</div>
                                            <div>
                                                <p className="font-display font-bold text-foreground line-clamp-1">{order.user?.name || "Guest"}'s Order</p>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                                    #{order.id.slice(0, 8)} • ₹{order.total.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-primary opacity-30 group-hover:opacity-100 transition-all">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center space-y-3">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-2xl">💤</div>
                                    <p className="font-display font-bold text-muted-foreground text-sm">Waiting for the first sale...</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => navigate('/admin/orders')} className="w-full mt-10 py-4 text-[10px] font-display font-black text-primary bg-primary/5 rounded-2xl hover:bg-primary/10 transition-all uppercase tracking-widest border border-primary/10">
                            View Every Treasure Sold
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-primary rounded-[2.5rem] p-8 shadow-xl shadow-primary/20 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-display font-black mb-2">Magic Actions 🚀</h2>
                            <p className="text-white/70 font-display font-bold text-sm mb-8">What would you like to build next?</p>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Products", icon: Package, href: "/admin/products" },
                                    { label: "Categories", icon: LayoutGrid, href: "/admin/categories" },
                                    { label: "Customers", icon: Users, href: "/admin/customers" },
                                    { label: "Orders", icon: ShoppingCart, href: "/admin/orders" },
                                ].map((action) => (
                                    <button
                                        key={action.label}
                                        onClick={() => navigate(action.href)}
                                        className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl text-left hover:bg-white/20 transition-all group active:scale-95"
                                    >
                                        <action.icon className="h-5 w-5 text-white/60 mb-3 group-hover:text-white transition-colors" />
                                        <p className="text-[10px] font-display font-black uppercase tracking-widest leading-tight">{action.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Decorative Sparkles */}
                        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
