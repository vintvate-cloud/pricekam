import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Package, User, Calendar, Loader2, CheckCircle2, Truck, Clock, AlertCircle, ChevronRight, Download, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import OrderInvoice from "@/components/orders/OrderInvoice";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { API_URL } from '@/lib/api-config';

interface OrderItem {
    id: string;
    product: { title: string; image: string; price: number };
    quantity: number;
    price: number;
    gst?: number | null;
    selectedSize?: string | null;
}

interface Order {
    id: string;
    user: { name: string; email: string };
    total: number;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    items: OrderItem[];
    createdAt: string;
    customerName?: string;
    customerPhone?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    paymentMethod?: string | null;
    advancePaid?: number | null;
    deliveryCharge?: number | null;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
}



const statusConfigs = {
    PENDING: { color: "bg-amber-500/10 text-amber-500", icon: Clock },
    PROCESSING: { color: "bg-blue-500/10 text-blue-500", icon: Package },
    SHIPPED: { color: "bg-purple-500/10 text-purple-500", icon: Truck },
    DELIVERED: { color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
    CANCELLED: { color: "bg-muted text-muted-foreground", icon: AlertCircle },
};

const Orders = () => {
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

    const { data: orders = [], isLoading } = useQuery<Order[]>({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/admin/orders`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json();
        },
        refetchInterval: 30000 // Real-time order queue tracking
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const res = await fetch(`${API_URL}/admin/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to update status');
            return res.json();
        },
        onSuccess: (updatedOrder) => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            setSelectedOrder(updatedOrder); // Update detail panel immediately
            toast.success(`Order status changed to ${updatedOrder.status}! ✨`);
        }
    });

    return (
        <AdminLayout>
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-2">Order Queue</h1>
                    <p className="text-muted-foreground font-body font-medium">Tracking the path of toys to their new homes 🚚</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Orders List */}
                    <div className="lg:col-span-2 space-y-4">
                        {isLoading ? (
                            <div className="p-20 flex flex-col items-center gap-4">
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                <p className="font-display font-bold text-muted-foreground">Tracking packages...</p>
                            </div>
                        ) : orders.map((order) => {
                            const StatusIcon = statusConfigs[order.status].icon;
                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => setSelectedOrder(order)}
                                    className={`bg-card p-6 rounded-[2.5rem] border transition-all cursor-pointer group ${selectedOrder?.id === order.id ? 'border-primary shadow-xl shadow-primary/5' : 'border-border hover:border-primary/30 shadow-sm'
                                        }`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center relative">
                                                <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                                                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                                                    {order.items.reduce((acc, curr) => acc + curr.quantity, 0)}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-display font-black text-foreground leading-tight">Order #{order.id.slice(-6).toUpperCase()}</p>
                                                <p className="text-[10px] font-display font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3" /> {format(new Date(order.createdAt), "MMM d, h:mm a")}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-4">
                                            <div className="text-right">
                                                <p className="font-display font-black text-foreground">₹{order.total.toFixed(2)}</p>
                                                <p className="text-[10px] font-display font-black text-muted-foreground/60 uppercase tracking-widest">{order.customerName || order.user.name.split(' ')[0]}</p>
                                                {order.paymentMethod === 'cod' && order.advancePaid && (
                                                    <p className="text-[10px] font-display font-black text-orange-500 uppercase tracking-widest mt-0.5">
                                                        COD — ₹{(order.total - order.advancePaid).toFixed(0)} due
                                                    </p>
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${statusConfigs[order.status].color}`}>
                                                <StatusIcon className="h-4 w-4" />
                                                {order.status}
                                            </div>
                                            <ChevronRight className={`h-5 w-5 transition-transform ${selectedOrder?.id === order.id ? 'translate-x-1 text-primary' : 'text-muted-foreground/30 group-hover:translate-x-2'}`} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {!isLoading && orders.length === 0 && (
                            <div className="bg-card rounded-[2.5rem] border border-border p-20 text-center">
                                <div className="w-20 h-20 bg-background rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-3xl">📭</div>
                                <h2 className="text-2xl font-display font-black text-foreground mb-2">The Queue is Empty</h2>
                                <p className="text-muted-foreground font-body max-w-sm mx-auto">Once the kids start their shopping adventure, their orders will appear here like magic!</p>
                            </div>
                        )}
                    </div>

                    {/* Order Details Panel */}
                    <div className="lg:col-span-1">
                        <AnimatePresence mode="wait">
                            {selectedOrder ? (
                                <motion.div
                                    key={selectedOrder.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="bg-card rounded-[2.5rem] border border-border p-8 shadow-2xl shadow-primary/5 h-fit sticky top-10"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex flex-col">
                                            <h2 className="text-2xl font-display font-black text-foreground">Order Detail</h2>
                                            <button
                                                onClick={() => setInvoiceOrder(selectedOrder)}
                                                className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors mt-1"
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-display font-black uppercase tracking-widest">Download Invoice</span>
                                            </button>
                                        </div>
                                        <button onClick={() => setSelectedOrder(null)} className="p-3 bg-accent rounded-xl hover:bg-accent/80 transition-colors"><ChevronRight className="h-5 w-5" /></button>
                                    </div>

                                    <div className="space-y-6 mb-8">
                                        <div className="flex items-center gap-4 p-4 bg-accent/20 rounded-3xl">
                                            <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center border border-border">
                                                <User className="h-5 w-5 text-muted-foreground/60" />
                                            </div>
                                            <div>
                                                <p className="font-display font-black text-foreground text-sm">{selectedOrder.customerName || selectedOrder.user.name}</p>
                                                <p className="text-[10px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">{selectedOrder.user.email}</p>
                                            </div>
                                        </div>

                                        {(selectedOrder.customerPhone || selectedOrder.streetAddress) && (
                                            <div className="p-5 bg-card border border-border rounded-3xl space-y-4 shadow-sm">
                                                <p className="text-[10px] font-display font-black text-primary uppercase tracking-widest">Shipping Detail</p>
                                                {selectedOrder.customerPhone && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                                                            <Truck className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <p className="text-sm font-display font-bold text-foreground">{selectedOrder.customerPhone}</p>
                                                    </div>
                                                )}
                                                {selectedOrder.streetAddress && (
                                                    <div className="flex gap-3">
                                                        <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                                                            <Package className="h-4 w-4 text-emerald-600" />
                                                        </div>
                                                        <div className="text-xs font-body text-muted-foreground leading-relaxed">
                                                            <p className="font-bold text-foreground mb-0.5">{selectedOrder.streetAddress}</p>
                                                            <p>{selectedOrder.city}, {selectedOrder.state}</p>
                                                            <p className="font-black text-[10px] tracking-widest uppercase mt-1">{selectedOrder.pincode}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-[10px] font-display font-black text-muted-foreground/60 uppercase tracking-widest mb-4">Toy Items</p>
                                            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                                {selectedOrder.items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <img src={item.product.image} className="w-10 h-10 rounded-xl object-cover bg-accent" />
                                                            <div>
                                                                <p className="text-xs font-display font-black text-foreground line-clamp-1">{item.product.title}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-[10px] font-display font-bold text-muted-foreground/60">Qty: {item.quantity}</p>
                                                                    {item.selectedSize && (
                                                                        <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                                                                            Size: {item.selectedSize}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-display font-black text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-border pt-6 space-y-4">
                                        {/* Payment Breakdown */}
                                        <div className="p-5 bg-card border border-border rounded-3xl space-y-3">
                                            <p className="text-[10px] font-display font-black text-primary uppercase tracking-widest">Payment</p>
                                            <div className="flex justify-between text-sm">
                                                <span className="font-body text-muted-foreground">Method</span>
                                                <span className="font-display font-black text-foreground capitalize">
                                                    {selectedOrder.paymentMethod === 'cod' ? 'Partial COD' : selectedOrder.paymentMethod?.toUpperCase() || '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="font-body text-muted-foreground">Order Total</span>
                                                <span className="font-display font-black text-foreground">₹{selectedOrder.total.toFixed(2)}</span>
                                            </div>
                                            {selectedOrder.paymentMethod === 'cod' && selectedOrder.advancePaid ? (
                                                <>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-body text-muted-foreground">Advance Paid (10%)</span>
                                                        <span className="font-display font-black text-emerald-500">₹{selectedOrder.advancePaid.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm border-t border-border pt-3">
                                                        <span className="font-display font-black text-orange-500">Balance Due on Delivery</span>
                                                        <span className="font-display font-black text-orange-500 text-base">₹{(selectedOrder.total - selectedOrder.advancePaid).toFixed(2)}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex justify-between text-sm border-t border-border pt-3">
                                                    <span className="font-display font-black text-foreground">Paid in Full</span>
                                                    <span className="font-display font-black text-emerald-500">₹{selectedOrder.total.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center bg-primary p-6 rounded-3xl text-primary-foreground">
                                            <span className="text-[10px] font-display font-black uppercase tracking-widest opacity-60">Grand Total</span>
                                            <span className="text-2xl font-display font-black">₹{selectedOrder.total.toFixed(2)}</span>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-display font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Magic Status</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => statusMutation.mutate({ id: selectedOrder.id, status })}
                                                        disabled={statusMutation.isPending || selectedOrder.status === status}
                                                        className={`px-3 py-3 rounded-2xl text-[10px] font-display font-black transition-all ${selectedOrder.status === status
                                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                            : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                                                            }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="hidden lg:block bg-accent/20 border-2 border-dashed border-border rounded-[2.5rem] p-10 text-center h-[500px] flex items-center justify-center">
                                    <div>
                                        <p className="font-display font-black text-muted-foreground/30 text-lg uppercase tracking-widest">Select an order <br /> to view details</p>
                                        <div className="mt-4 flex justify-center"><ChevronRight className="h-10 w-10 text-muted-foreground/20 animate-pulse" /></div>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {invoiceOrder && (
                    <OrderInvoice
                        order={invoiceOrder}
                        onClose={() => setInvoiceOrder(null)}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default Orders;
