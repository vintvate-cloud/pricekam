import { motion } from "framer-motion";
import { Download, X, Printer, Mail, Share2, ShieldCheck, IndianRupee } from "lucide-react";
import { format } from "date-fns";

interface OrderItem {
    id: string;
    product: { title: string; image: string; price: number };
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    total: number;
    status: string;
    items: OrderItem[];
    createdAt: string;
    customerName?: string | null;
    customerPhone?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    paymentMethod?: string | null;
    razorpayPaymentId?: string | null;
    deliveryCharge?: number | null;
    advancePaid?: number | null;
}

interface OrderInvoiceProps {
    order: Order;
    onClose: () => void;
}

const OrderInvoice = ({ order, onClose }: OrderInvoiceProps) => {
    const handlePrint = () => {
        window.print();
    };

    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const delivery = order.deliveryCharge ?? 100;
    const isCoD = order.paymentMethod === 'cod';
    const advancePaid = order.advancePaid ?? null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-none print:rounded-none"
            >
                {/* Header Actions */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30 print:hidden">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-xl">📄</div>
                        <h2 className="font-display font-black text-sm uppercase tracking-widest">Digital Invoice</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="p-3 bg-accent hover:bg-primary hover:text-white rounded-2xl transition-all group">
                            <Printer className="h-5 w-5 group-active:scale-95 transition-transform" />
                        </button>
                        <button onClick={onClose} className="p-3 bg-accent hover:bg-destructive hover:text-white rounded-2xl transition-all">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div id="invoice-content" className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-white text-slate-900 print:overflow-visible">
                    <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-3xl">🛒</span>
                                <h1 className="text-3xl font-display font-black tracking-tighter">PRICEKAM</h1>
                            </div>
                            <div className="space-y-1 text-sm font-body text-slate-500">
                                <p>Magic Warehouse Avenue, Suite 777</p>
                                <p>Imagination City, TS 12345</p>
                                <p>support@pricekam.com</p>
                                <p>+91 74897 81720</p>
                            </div>
                        </div>

                        <div className="text-left md:text-right">
                            <h2 className="text-6xl font-display font-black text-slate-200 mb-4 print:text-slate-100">INVOICE</h2>
                            <div className="space-y-2">
                                <p className="text-xs font-display font-black text-slate-400 uppercase tracking-widest">Order Reference</p>
                                <p className="text-xl font-display font-black text-primary">#{order.id.slice(-12).toUpperCase()}</p>
                                <div className="pt-2">
                                    <p className="text-xs font-display font-black text-slate-400 uppercase tracking-widest">Date of Joy</p>
                                    <p className="font-body font-bold text-slate-700">{format(new Date(order.createdAt), "MMMM dd, yyyy")}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 pb-12 border-b border-slate-100">
                        <div>
                            <h3 className="text-xs font-display font-black text-primary uppercase tracking-[0.2em] mb-4">Ship To</h3>
                            <div className="space-y-1 font-body">
                                <p className="font-black text-lg text-slate-800">{order.customerName}</p>
                                <p className="text-slate-500">{order.streetAddress}</p>
                                <p className="text-slate-500">{order.city}, {order.state} {order.pincode}</p>
                                <p className="text-slate-500 pt-2 font-bold">{order.customerPhone}</p>
                            </div>
                        </div>
                        <div className="md:text-right">
                            <h3 className="text-xs font-display font-black text-primary uppercase tracking-[0.2em] mb-4">Payment Intelligence</h3>
                            <div className="space-y-1 font-body">
                                <p className="text-slate-500 uppercase tracking-widest text-[10px] font-black">Method</p>
                                <p className="font-black text-slate-800 uppercase tracking-widest">{order.paymentMethod === 'cod' ? 'Partial COD' : order.paymentMethod === 'upi' ? 'UPI' : order.paymentMethod === 'card' ? 'Card' : 'Prepaid'}</p>
                                {order.razorpayPaymentId && (
                                    <p className="text-[10px] text-slate-400 font-mono mt-1 break-all">ID: {order.razorpayPaymentId}</p>
                                )}
                                <div className="pt-4 flex items-center md:justify-end gap-2 text-emerald-600">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Razorpay Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-12">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="py-4 text-left text-xs font-display font-black uppercase tracking-widest text-slate-400">Description</th>
                                    <th className="py-4 text-center text-xs font-display font-black uppercase tracking-widest text-slate-400">Qty</th>
                                    <th className="py-4 text-right text-xs font-display font-black uppercase tracking-widest text-slate-400">Unit</th>
                                    <th className="py-4 text-right text-xs font-display font-black uppercase tracking-widest text-slate-400">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 print:hidden">
                                                    <img src={item.product.image} className="w-full h-full object-cover" />
                                                </div>
                                                <p className="font-display font-bold text-slate-800">{item.product.title}</p>
                                            </div>
                                        </td>
                                        <td className="py-6 text-center font-body font-bold text-slate-600">x{item.quantity}</td>
                                        <td className="py-6 text-right font-body font-bold text-slate-600">₹{item.price.toFixed(2)}</td>
                                        <td className="py-6 text-right font-display font-black text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-xs space-y-4">
                            <div className="flex justify-between items-center text-sm font-body text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-body text-slate-500">
                                <span>Delivery Charge</span>
                                <span className={`font-bold ${delivery === 0 ? 'text-emerald-500' : ''}`}>{delivery === 0 ? 'FREE ✓' : `₹${delivery.toFixed(2)}`}</span>
                            </div>
                            {isCoD && advancePaid ? (
                                <>
                                    <div className="flex justify-between items-center text-sm font-body text-slate-500">
                                        <span>Advance Paid (Razorpay)</span>
                                        <span className="font-bold text-emerald-600">₹{advancePaid.toFixed(2)} ✓</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-body text-slate-500">
                                        <span>Balance Due on Delivery</span>
                                        <span className="font-bold text-orange-500">₹{(order.total - advancePaid).toFixed(2)}</span>
                                    </div>
                                </>
                            ) : null}
                            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                                <span className="font-display font-black text-slate-900 uppercase tracking-widest text-xs">Grand Total</span>
                                <span className="text-3xl font-display font-black text-primary flex items-center gap-1">
                                    <IndianRupee className="h-6 w-6" />
                                    {order.total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-20 pt-12 border-t border-slate-100 text-center">
                        <p className="text-sm font-display font-black text-slate-800 mb-2 uppercase tracking-[0.3em]">Thank You for Trading!</p>
                        <p className="text-xs font-body text-slate-400">Values are inclusive of all taxes. This is a computer-generated document.</p>
                        <div className="flex items-center justify-center gap-1 mt-8 text-primary/30">
                            {[...Array(5)].map((_, i) => <span key={i} className="text-lg">★</span>)}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default OrderInvoice;
