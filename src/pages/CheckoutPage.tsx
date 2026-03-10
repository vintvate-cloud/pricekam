import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Banknote, Smartphone, ArrowLeft, Check, ShieldCheck, Loader2, Truck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import OrderInvoice from "@/components/orders/OrderInvoice";
import { API_URL } from '@/lib/api-config';

type PaymentMethod = "card" | "upi" | "cod";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const DELIVERY_CHARGE = 100;
const FREE_DELIVERY_THRESHOLD = 2000; // Only for card payments

const CheckoutPage = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const [address, setAddress] = useState({ name: "", phone: "", street: "", city: "", state: "", pincode: "" });

  // Free delivery for ALL methods when subtotal >= ₹2000
  const deliveryCharge = total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const grandTotal = total + deliveryCharge;
  const advanceAmount = paymentMethod === "cod" ? Math.ceil(grandTotal * 0.10) : grandTotal;
  const balanceDueOnDelivery = paymentMethod === "cod" ? grandTotal - advanceAmount : 0;

  // --- Load Razorpay Script ---
  useEffect(() => {
    const scriptId = "razorpay-sdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const validateAddress = () => {
    const { name, phone, street, city, state, pincode } = address;
    if (!name || !phone || !street || !city || !state || !pincode) {
      alert("Please fill all delivery address fields");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.Razorpay) {
      alert("Payment system is loading. Please wait a moment and try again.");
      return;
    }

    setIsPlacing(true);

    try {

      const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

      // Step 1: Create Razorpay order (server verifies prices from DB)
      const createRes = await fetch(`${API_URL}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          items: items.map((item) => ({ 
            productId: item.product.id, 
            quantity: item.quantity,
            selectedSize: item.selectedSize
          })),
        }),
        credentials: "include",
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to initiate payment");
      }
      const orderData = await createRes.json();

      // Step 2: Open Razorpay checkout modal
      await new Promise<void>((resolve, reject) => {
        const options: any = {
          key: RAZORPAY_KEY,
          amount: orderData.amountToCollectNow * 100,
          currency: "INR",
          name: "Pricekam 🛍️",
          description: paymentMethod === "cod"
            ? `10% Advance Payment (₹${orderData.amountToCollectNow})`
            : `Full Payment ₹${orderData.orderTotal}`,
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: address.name || user?.name || "",
            contact: address.phone || "",
          },
          theme: { color: "#7c3aed" },
          handler: async (response: any) => {
            // Step 3: Verify payment and create order in DB
            try {
              const verifyRes = await fetch(`${API_URL}/payment/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  // Use server-returned validatedItems (DB prices) — never send client prices
                  items: orderData.validatedItems,
                  customerAddress: address,
                  paymentMethod,
                }),
                credentials: "include",
              });

              if (!verifyRes.ok) {
                const err = await verifyRes.json().catch(() => ({}));
                let msg = err.message || "Order creation failed after payment";
                if (err.detail) msg += `\nDetail: ${err.detail}`;
                if (err.hint) msg += `\nHint: ${err.hint}`;
                throw new Error(msg);
              }
              const savedOrder = await verifyRes.json();
              setOrderId(savedOrder.id);
              setPlacedOrder(savedOrder);
              setOrderPlaced(true);
              if (typeof clearCart === "function") clearCart();
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled by user"));
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (error: any) {
      if (error?.message !== "Payment cancelled by user") {
        console.error("Checkout Error:", error);
        alert(`Payment failed: ${error.message || "Please try again."}`);
      }
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <span className="text-6xl block mb-6 animate-bounce">🛒</span>
          <h1 className="text-3xl font-display font-black mb-4">Your cart is feeling lonely</h1>
          <p className="text-muted-foreground font-body mb-8 max-w-md mx-auto">Fill it up with some magical toys and treasures before they vanish!</p>
          <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-[2rem] font-display font-black hover:scale-105 transition-all shadow-xl shadow-primary/20">
            Start the Hunt
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }}>
            <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center mx-auto mb-8">
              <Check className="h-12 w-12 text-emerald-500" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-display font-black mb-4">Victory is Yours! 🏆</h1>
          <p className="text-muted-foreground font-body mb-2 text-lg">
            Order #{orderId?.slice(-8).toUpperCase()} placed successfully!
          </p>

          {paymentMethod === "cod" && placedOrder ? (
            <div className="max-w-sm mx-auto mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left">
              <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-2">Partial COD Details</p>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Advance Paid (Razorpay)</span>
                <span className="font-black text-emerald-600">₹{(placedOrder.advancePaid ?? 0).toFixed(2)} ✓</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-black text-foreground">₹{(placedOrder.total ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black border-t border-amber-200 pt-2 mt-2">
                <span className="text-amber-700">Balance Due on Delivery</span>
                <span className="text-amber-600">₹{((placedOrder.total ?? 0) - (placedOrder.advancePaid ?? 0)).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-body mb-8 max-w-md mx-auto">
              Payment Method: <span className="text-foreground font-black uppercase tracking-widest text-[10px]">
                {paymentMethod === "upi" ? "UPI" : "Card"}
              </span> •
              Total Paid: <span className="text-primary font-black">₹{grandTotal.toFixed(2)}</span>
            </p>
          )}

          {/* Expected Delivery */}
          <div className="max-w-sm mx-auto mb-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <span className="text-2xl">🚚</span>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Expected Delivery</p>
              <p className="text-sm font-display font-black text-foreground">7 – 10 Business Days</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/profile?tab=orders" className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-[2rem] font-display font-black text-sm hover:scale-105 transition-all shadow-xl shadow-primary/20">
              Track Order
            </Link>
            <button
              onClick={() => setShowInvoice(true)}
              className="w-full sm:w-auto px-8 py-4 bg-accent text-foreground rounded-[2rem] font-display font-black text-sm hover:scale-105 transition-all"
            >
              View Invoice
            </button>
          </div>

          <p className="mt-12 text-muted-foreground font-body text-sm animate-pulse">
            📧 An invoice has been emailed to your registered email address!
          </p>

          <AnimatePresence>
            {showInvoice && placedOrder && (
              <OrderInvoice
                order={placedOrder}
                onClose={() => setShowInvoice(false)}
              />
            )}
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <Link to="/shop" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary mb-8 transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Keep Exploring
        </Link>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-display font-black transition-all ${step >= s ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground"}`}>
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 ? "Delivery Details" : "Secure Payment"}
              </span>
              {s < 2 && <div className={`w-16 h-[2px] rounded-full transition-all ${step > s ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Form */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="address" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-xl">🏠</div>
                      <div>
                        <h2 className="font-display font-black text-xl">Shipping Details</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Where should we send the magic?</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Full Name*</label>
                        <input required placeholder="Elon Musk" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-accent/50 border border-transparent focus:border-primary/50 outline-none text-sm font-body transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Phone Number*</label>
                        <input required placeholder="+91 98765 43210" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-accent/50 border border-transparent focus:border-primary/50 outline-none text-sm font-body transition-all" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Street Address*</label>
                        <input required placeholder="Apartment, suite, unit, etc." value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-accent/50 border border-transparent focus:border-primary/50 outline-none text-sm font-body transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">City*</label>
                        <input required placeholder="Gotham" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-accent/50 border border-transparent focus:border-primary/50 outline-none text-sm font-body transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">State*</label>
                        <input required placeholder="Metropolis" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-accent/50 border border-transparent focus:border-primary/50 outline-none text-sm font-body transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">PIN Code*</label>
                        <input required placeholder="123456" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-accent/50 border border-transparent focus:border-primary/50 outline-none text-sm font-body transition-all" />
                      </div>
                    </div>
                    <button
                      onClick={() => { if (validateAddress()) setStep(2); }}
                      className="mt-10 w-full md:w-auto px-10 py-4 bg-primary text-white rounded-[2rem] font-display font-black text-sm hover:scale-105 transition-all shadow-xl shadow-primary/20"
                    >
                      Continue to Payment →
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="payment" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-xl">💳</div>
                      <div>
                        <h2 className="font-display font-black text-xl">Secure Checkout</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Powered by Razorpay — Safe & Encrypted</p>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      {([
                        {
                          id: "card" as const,
                          label: "Card",
                          icon: CreditCard,
                          desc: total >= FREE_DELIVERY_THRESHOLD ? "🎉 Free Delivery!" : "Debit / Credit Card",
                          badge: total >= FREE_DELIVERY_THRESHOLD ? "No Delivery Fee" : null,
                        },
                        {
                          id: "upi" as const,
                          label: "UPI",
                          icon: Zap,
                          desc: total >= FREE_DELIVERY_THRESHOLD ? "🎉 Free Delivery!" : "GPay / PhonePe / BHIM",
                          badge: total >= FREE_DELIVERY_THRESHOLD ? "No Delivery Fee" : null,
                        },
                        {
                          id: "cod" as const,
                          label: "Part COD",
                          icon: Banknote,
                          desc: `Pay ₹${Math.ceil((total + (total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE)) * 0.10)} now, rest on delivery`,
                          badge: total >= FREE_DELIVERY_THRESHOLD ? "Free Delivery" : "10% Advance",
                        },
                      ]).map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`p-5 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group ${paymentMethod === pm.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                        >
                          {pm.badge && (
                            <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {pm.badge}
                            </span>
                          )}
                          <pm.icon className={`h-6 w-6 mb-3 ${paymentMethod === pm.id ? "text-primary" : "text-muted-foreground"}`} />
                          <p className="font-display font-black text-xs text-foreground uppercase tracking-widest">{pm.label}</p>
                          <p className="text-[10px] text-muted-foreground font-body font-medium mt-1 pr-10">{pm.desc}</p>
                          {paymentMethod === pm.id && (
                            <motion.div layoutId="activeRule" className="absolute bottom-3 right-3 text-primary">
                              <Check className="h-4 w-4" />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Payment Info Panels */}
                    <AnimatePresence mode="wait">
                      {paymentMethod === "card" && (
                        <motion.div key="card-info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="bg-blue-500/5 border border-blue-500/20 rounded-[2rem] p-6">
                            <p className="text-xs font-display font-black text-blue-600 mb-2 uppercase tracking-widest">💳 Razorpay Secure Card Checkout</p>
                            <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
                              Clicking "Pay Now" will open Razorpay's secure checkout modal where you can enter your card details safely. Supports Visa, Mastercard, Amex, and RuPay.
                            </p>
                            {total >= FREE_DELIVERY_THRESHOLD && (
                              <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 rounded-2xl">
                                <Truck className="h-4 w-4 text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Free delivery unlocked on orders ≥ ₹2000!</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === "upi" && (
                        <motion.div key="upi-info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="bg-violet-500/5 border border-violet-500/20 rounded-[2rem] p-6">
                            <p className="text-xs font-display font-black text-violet-600 mb-2 uppercase tracking-widest">⚡ Instant UPI Payment via Razorpay</p>
                            <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
                              Razorpay will open with all UPI options: GPay, PhonePe, Paytm, BHIM, and any UPI ID. Enter your UPI PIN to complete payment instantly.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-4">
                              {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                                <span key={app} className="px-3 py-1.5 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">{app}</span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === "cod" && (
                        <motion.div key="cod-info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-6">
                            <p className="text-xs font-display font-black text-amber-600 mb-3 uppercase tracking-widest">💰 Partial COD — 10% Advance via Razorpay</p>
                            <p className="text-[10px] text-muted-foreground font-body leading-relaxed mb-4">
                              Pay a small 10% advance securely via Razorpay now. The remaining balance is collected when your order arrives at your door.
                            </p>
                            <div className="space-y-2 pt-4 border-t border-amber-500/10">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pay Now (Advance 10%)</span>
                                <span className="text-sm font-display font-black text-amber-600">₹{advanceAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pay on Delivery (Balance)</span>
                                <span className="text-sm font-display font-black text-foreground">₹{balanceDueOnDelivery.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Razorpay Logo Trust Indicator */}
                    <div className="mt-6 flex items-center gap-3 p-3 bg-muted/30 rounded-2xl">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                        Payments secured by Razorpay · PCI DSS Compliant · 256-bit SSL
                      </p>
                    </div>

                    <form onSubmit={handlePlaceOrder}>
                      <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="w-full sm:w-auto px-8 py-4 bg-accent text-foreground rounded-[2rem] font-display font-black text-sm hover:scale-105 transition-all"
                        >
                          ← Review Address
                        </button>
                        <button
                          disabled={isPlacing}
                          type="submit"
                          className="flex-1 w-full py-4 bg-primary text-white rounded-[2rem] font-display font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-3 disabled:opacity-60"
                        >
                          {isPlacing ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Processing…
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-5 w-5" />
                              {paymentMethod === "cod"
                                ? `Pay Advance ₹${advanceAmount.toFixed(0)} via Razorpay`
                                : `Pay ₹${grandTotal.toFixed(2)} via Razorpay`}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-[2.5rem] border border-border p-8 sticky top-24 shadow-sm">
              <h3 className="font-display font-black text-xl mb-8">Order Summary</h3>
              <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4 group">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-accent shrink-0 border border-border group-hover:scale-105 transition-transform duration-500">
                      <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-display font-bold text-foreground truncate group-hover:text-primary transition-colors">{item.product.title}</p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                        {item.selectedSize ? `Size: ${item.selectedSize} · ` : ""}Qty: {item.quantity} · ₹{item.product.price}
                      </p>
                    </div>
                    <p className="text-sm font-display font-black text-foreground">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Delivery</span>
                  <span className={deliveryCharge === 0 ? "text-emerald-500" : "text-foreground"}>
                    {deliveryCharge === 0 ? "FREE 🎉" : `₹${deliveryCharge}`}
                  </span>
                </div>
                {paymentMethod === "card" && total < FREE_DELIVERY_THRESHOLD && (
                  <div className="text-[10px] text-primary/70 font-body pl-1">
                    Add ₹{(FREE_DELIVERY_THRESHOLD - total).toFixed(0)} more to get free delivery!
                  </div>
                )}
                {paymentMethod === "cod" && (
                  <div className="space-y-2 pt-3 border-t border-dashed border-border">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground">Advance (10%)</span>
                      <span className="text-amber-500">₹{advanceAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground">Balance on Delivery</span>
                      <span className="text-foreground">₹{balanceDueOnDelivery.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center font-display font-black text-foreground text-xl pt-4 border-t border-border">
                  <span>Total Due</span>
                  <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 p-4 bg-muted/50 rounded-2xl">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Razorpay Secured Checkout</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
