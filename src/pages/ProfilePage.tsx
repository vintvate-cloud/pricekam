import { useState, useEffect } from "react";
import { User, Mail, MapPin, Package, Heart, Settings, LogOut, Loader2, Calendar, X, AlertTriangle, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from '@/lib/api-config';



const ProfilePage = () => {
  const { user, isLoading, logout } = useAuth();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const initialTab = queryParams.get("tab") || "profile";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [returnTargetId, setReturnTargetId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const currentTab = queryParams.get("tab");
    if (currentTab) setActiveTab(currentTab);
  }, [search]);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading, navigate]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
  };

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/orders`, { credentials: 'include' });
      if (!res.ok) throw new Error('Order fetch failed');
      return res.json();
    },
    enabled: !!user
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: 'POST', credentials: 'include'
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success("Order cancelled successfully.");
      setCancelTargetId(null);
    },
    onError: (err: any) => toast.error(err.message || "Cancellation failed"),
  });

  const returnMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const res = await fetch(`${API_URL}/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Return request submitted! We'll contact you within 2 business days.");
      setReturnTargetId(null);
      setReturnReason("");
    },
    onError: (err: any) => toast.error(err.message || "Return request failed"),
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-display text-2xl animate-pulse text-primary">Loading...</div>;
  if (!user) return null;

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "orders", label: "Orders", icon: Package },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const statusColors: any = {
    PENDING: "bg-amber-500/10 text-amber-500",
    PROCESSING: "bg-blue-500/10 text-blue-500",
    SHIPPED: "bg-purple-500/10 text-purple-500",
    DELIVERED: "bg-emerald-500/10 text-emerald-500",
    CANCELLED: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />

      {/* Cancel Confirm Modal */}
      <AnimatePresence>
        {cancelTargetId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="font-display font-black text-lg">Cancel Order?</h3>
              </div>
              <p className="text-sm font-body text-muted-foreground mb-6">
                This action is permanent. Your order will be marked as cancelled.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCancelTargetId(null)}
                  className="flex-1 py-3 rounded-2xl bg-muted text-sm font-display font-black hover:bg-muted/80">
                  Keep Order
                </button>
                <button
                  onClick={() => cancelMutation.mutate(cancelTargetId)}
                  disabled={cancelMutation.isPending}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-display font-black hover:bg-red-600 disabled:opacity-50">
                  {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Yes, Cancel"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Request Modal */}
      <AnimatePresence>
        {returnTargetId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-display font-black text-lg">Request Return</h3>
              </div>
              <textarea
                placeholder="Describe the reason for return (e.g. defective, wrong item…)"
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                rows={3}
                className="w-full p-4 rounded-2xl bg-muted border border-border outline-none text-sm font-body resize-none focus:border-primary/50 mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => { setReturnTargetId(null); setReturnReason(""); }}
                  className="flex-1 py-3 rounded-2xl bg-muted text-sm font-display font-black">
                  Cancel
                </button>
                <button
                  onClick={() => returnMutation.mutate({ orderId: returnTargetId, reason: returnReason })}
                  disabled={returnMutation.isPending || !returnReason.trim()}
                  className="flex-1 py-3 rounded-2xl bg-blue-500 text-white text-sm font-display font-black hover:bg-blue-600 disabled:opacity-50">
                  {returnMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="bg-card rounded-3xl border border-border p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl">👤</div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-display font-bold text-foreground capitalize">{user.name || "Happy Shopper"}</h1>
                <p className="text-muted-foreground font-body text-sm flex items-center justify-center md:justify-start gap-1 mt-1">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
                <p className="text-muted-foreground font-body text-sm flex items-center justify-center md:justify-start gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" /> Planet Joy
                </p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-destructive/10 text-destructive rounded-2xl font-display font-semibold text-sm hover:bg-destructive hover:text-white transition-all">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-body font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:bg-muted"}`}>
                <tab.icon className="h-4 w-4" />{tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: user.name || "Happy Shopper", icon: User },
                  { label: "Email", value: user.email, icon: Mail },
                  { label: "Account Type", value: user.role, icon: Settings },
                ].map((field) => (
                  <div key={field.label} className="space-y-1">
                    <label className="text-xs font-body text-muted-foreground">{field.label}</label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                      <field.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-body text-foreground">{field.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {ordersLoading ? (
                <div className="flex flex-col items-center py-12 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="font-display font-bold">Unboxing your history...</p>
                </div>
              ) : orders.map((order: any) => (
                <div key={order.id} className="bg-card rounded-3xl border border-border p-5 group hover:border-primary/30 transition-all">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-xl">📦</div>
                      <div>
                        <p className="font-display font-black text-foreground">#{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3 w-3" /> {format(new Date(order.createdAt), "MMM d, yyyy")}
                        </p>
                        {order.paymentMethod === 'cod' && order.advancePaid && (
                          <p className="text-[10px] font-body text-orange-500 mt-0.5">
                            COD — Balance ₹{(order.total - order.advancePaid).toFixed(2)} due
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <div className="text-right hidden sm:block">
                        <p className="font-display font-black text-foreground">₹{order.total.toFixed(2)}</p>
                        <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${statusColors[order.status] || 'bg-muted text-muted-foreground'}`}>
                        {order.status}
                      </div>
                      {/* Action Buttons */}
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => setCancelTargetId(order.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-display font-bold hover:bg-red-500/20 transition-all">
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      )}
                      {order.status === 'DELIVERED' && (
                        <button
                          onClick={() => setReturnTargetId(order.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-500 text-xs font-display font-bold hover:bg-blue-500/20 transition-all">
                          <RotateCcw className="h-3.5 w-3.5" /> Return
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!ordersLoading && orders.length === 0 && (
                <div className="bg-card rounded-[2.5rem] border border-border p-16 text-center">
                  <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-3xl opacity-50">📭</div>
                  <h3 className="text-xl font-display font-black text-foreground mb-2">No Orders Yet</h3>
                  <button onClick={() => navigate('/shop')} className="px-8 py-3 bg-primary text-white rounded-2xl font-display font-black text-sm hover:scale-105 transition-all shadow-lg shadow-primary/20">
                    Explore Shop
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="bg-card rounded-3xl border border-border p-8 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-muted-foreground">Your wishlist is empty</p>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground">Account Settings</h2>
              {["Email Notifications", "SMS Alerts", "Newsletter"].map((setting) => (
                <div key={setting} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <span className="text-sm font-body text-foreground">{setting}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
