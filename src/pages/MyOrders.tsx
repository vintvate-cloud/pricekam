import { useQuery } from "@tanstack/react-query";
import { Package, Clock, CheckCircle2, Truck, AlertCircle, ShoppingBag, ArrowLeft, Loader2, IndianRupee, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import OrderInvoice from "@/components/orders/OrderInvoice";
import { API_URL } from '@/lib/api-config';

interface OrderItem {
    id: string;
    product: { title: string; image: string; price: number };
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    total: number;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    items: OrderItem[];
    createdAt: string;
    customerName?: string | null;
    customerPhone?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    paymentMethod?: string | null;
}

const statusConfigs = {
    PENDING: { color: "bg-amber-500/10 text-amber-500", icon: Clock, label: "Awating Confirmation" },
    PROCESSING: { color: "bg-blue-500/10 text-blue-500", icon: Package, label: "Preparing Magic" },
    SHIPPED: { color: "bg-purple-500/10 text-purple-500", icon: Truck, label: "On the Way" },
    DELIVERED: { color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2, label: "Joy Delivered" },
    CANCELLED: { color: "bg-muted text-muted-foreground", icon: AlertCircle, label: "Cancelled" },
};



const MyOrders = () => {
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (!authLoading && !user) navigate("/login");
    }, [user, authLoading, navigate]);

    const { data: orders = [], isLoading } = useQuery<Order[]>({
        queryKey: ['my-orders'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/orders`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json();
        }
    });

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <CartDrawer />

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back to Profile
                        </Link>
                        <h1 className="text-4xl font-display font-black text-foreground tracking-tight">My Treasure Map 🗺️</h1>
                        <p className="text-muted-foreground font-body font-medium mt-2">Track the journey of your magical toys!</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="font-display font-bold text-muted-foreground">Consulting the crystal ball...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        orders.map((order, idx) => {
                            const config = statusConfigs[order.status];
                            const StatusIcon = config.icon;

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group"
                                >
                                    <div className="p-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                                                    🎁
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Order Identifier</p>
                                                    <h3 className="text-xl font-display font-black text-foreground">#{order.id.slice(-8).toUpperCase()}</h3>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${config.color}`}>
                                                    <StatusIcon className="h-4 w-4" />
                                                    {config.label}
                                                </div>
                                                <div className="px-4 py-2 bg-accent rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between group/item">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-accent border border-border flex-shrink-0">
                                                            <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-display font-bold text-foreground line-clamp-1">{item.product.title}</p>
                                                            <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">Qty: {item.quantity} • ₹{item.price.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-display font-black text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-border">
                                            <div>
                                                <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-1">Investment in Joy</p>
                                                <p className="text-2xl font-display font-black text-primary flex items-center gap-1">
                                                    <IndianRupee className="h-5 w-5" />
                                                    {order.total.toFixed(2)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="px-6 py-3 bg-accent hover:bg-primary hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                            >
                                                <FileText className="h-4 w-4" /> View Invoice
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="bg-card rounded-[3rem] border-2 border-dashed border-border p-20 text-center">
                            <div className="w-24 h-24 bg-accent rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-4xl">🌵</div>
                            <h2 className="text-2xl font-display font-black text-foreground mb-4">No Magic Dispatched Yet</h2>
                            <p className="text-muted-foreground font-body max-w-sm mx-auto mb-10">Your order history is currently as empty as a playground on a school day. Let's fix that!</p>
                            <Link to="/shop" className="inline-flex items-center gap-2 px-10 py-5 bg-primary text-white rounded-[2rem] font-display font-black text-sm hover:scale-[1.05] transition-all shadow-xl shadow-primary/20">
                                <ShoppingBag className="h-5 w-5" /> Start Shopping
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {selectedOrder && (
                    <OrderInvoice
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                    />
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
};

export default MyOrders;
