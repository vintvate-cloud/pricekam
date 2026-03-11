import { motion } from "framer-motion";
import { Download, X, ShieldCheck, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { createPortal } from "react-dom";

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
        const originalTitle = document.title;
        const customerName = (order.customerName || "Order").replace(/[^a-z0-9]/gi, '_');
        const orderId = order.id.slice(-8).toUpperCase();

        document.title = `Invoice_${customerName}_${orderId}`;
        window.print();

        // Restore title after a short delay to ensure print dialog picks it up
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    };

    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const delivery = order.deliveryCharge ?? 100;
    const isCoD = order.paymentMethod === 'cod';
    const advancePaid = order.advancePaid ?? null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-0 md:p-4 bg-background/80 backdrop-blur-xl print:bg-white print:p-0 print:static invoice-print-wrapper"
        >
            <style>
                {`
                    @media print {
                        @page {
                            size: portrait;
                            margin: 0;
                        }
                        
                        /* COMPLETELY HIDE THE APP ROOT */
                        #root {
                            display: none !important;
                            height: 0 !important;
                            overflow: hidden !important;
                        }

                        html, body {
                            height: auto !important;
                            overflow: visible !important;
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }

                        body * {
                            visibility: hidden !important;
                        }

                        .invoice-print-wrapper, 
                        .invoice-print-wrapper * {
                            visibility: visible !important;
                        }

                        /* Force the wrapper to be the only thing the browser sees */
                        .invoice-print-wrapper {
                            position: static !important;
                            display: block !important;
                            width: 100% !important;
                            min-height: 100vh !important;
                            background: white !important;
                            padding: 15mm !important;
                            margin: 0 !important;
                            overflow: visible !important;
                        }

                        .invoice-card {
                            width: 100% !important;
                            max-width: 100% !important;
                            height: auto !important;
                            border: none !important;
                            box-shadow: none !important;
                            background: white !important;
                            border-radius: 0 !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }

                        #invoice-content {
                            padding: 0 !important;
                            overflow: visible !important;
                            height: auto !important;
                            display: block !important;
                        }

                        .print-image-visible {
                            display: block !important;
                            visibility: visible !important;
                        }

                        .print\\:hidden {
                            display: none !important;
                        }

                        /* Re-enable colors/bg for print */
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                `}
            </style>
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-none print:rounded-none print:max-h-none print:w-full print:h-auto print:static invoice-card"
            >
                {/* Header Actions */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30 print:hidden">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-xl">📄</div>
                        <h2 className="font-display font-black text-sm uppercase tracking-widest">Digital Invoice</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                        >
                            <Download className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Download PDF</span>
                        </button>
                        <button onClick={onClose} className="p-3 bg-accent hover:bg-destructive hover:text-white rounded-2xl transition-all">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div id="invoice-content" className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-white text-slate-900 print:overflow-visible print:p-0">
                    <div className="flex flex-col md:flex-row justify-between gap-12 mb-8 print:mb-6 print:gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-6 print:mb-4">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <span className="text-2xl">🛒</span>
                                </div>
                                <h1 className="text-3xl font-display font-black tracking-tight text-slate-900">PRICEKAM</h1>
                            </div>
                            <div className="space-y-1 text-sm font-body text-slate-500">
                                <p>22, near State Bank Of India</p>
                                <p>Awadhpuri, Bhopal, MP 462022</p>
                                <p>support@pricekam.com</p>
                                <p>+91 74897 81720</p>
                            </div>
                        </div>

                        <div className="text-left md:text-right relative">
                            <h2 className="text-7xl font-display font-black text-slate-900/5 mb-4 print:text-6xl print:text-black print:mb-2 text-nowrap uppercase tracking-tighter">INVOICE</h2>
                            <div className="space-y-2 print:space-y-1">
                                <p className="text-[10px] font-display font-black text-slate-400 uppercase tracking-widest">Order Reference</p>
                                <p className="text-xl font-display font-black text-primary">#{order.id.slice(-12).toUpperCase()}</p>
                                <div className="pt-2 print:pt-1">
                                    <p className="text-[10px] font-display font-black text-slate-400 uppercase tracking-widest">Date of Joy</p>
                                    <p className="font-body font-bold text-slate-700">{format(new Date(order.createdAt), "MMMM dd, yyyy")}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8 pb-8 border-b border-slate-100 print:mb-4 print:pb-4 print:gap-6">
                        <div>
                            <h3 className="text-[10px] font-display font-black text-primary uppercase tracking-[0.2em] mb-4 print:mb-2 italic">SHIP TO</h3>
                            <div className="space-y-1 font-body">
                                <p className="font-black text-lg text-slate-800 print:text-base">{order.customerName}</p>
                                <p className="text-slate-500 text-sm">{order.streetAddress}</p>
                                <p className="text-slate-500 text-sm">{order.city}, {order.state} {order.pincode}</p>
                                <p className="text-slate-500 pt-2 font-bold text-sm print:pt-1">{order.customerPhone}</p>
                            </div>
                        </div>
                        <div className="md:text-right">
                            <h3 className="text-[10px] font-display font-black text-primary uppercase tracking-[0.2em] mb-4 print:mb-2 italic">PAYMENT INFO</h3>
                            <div className="space-y-1 font-body">
                                <p className="text-slate-500 uppercase tracking-widest text-[8px] font-black">METHOD</p>
                                <p className="font-black text-slate-800 uppercase tracking-widest text-sm">{order.paymentMethod === 'cod' ? 'PARTIAL COD' : order.paymentMethod?.toUpperCase() || 'PREPAID'}</p>
                                {order.razorpayPaymentId && (
                                    <p className="text-[10px] text-slate-400 font-mono mt-1 break-all">ID: {order.razorpayPaymentId}</p>
                                )}
                                <div className="pt-4 flex items-center md:justify-end gap-2 text-emerald-600 print:pt-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">VERIFIED PAYMENT</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-8 print:mb-4">
                        <table className="w-full text-nowrap">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="py-4 text-left text-[10px] font-display font-black uppercase tracking-widest text-slate-400 print:py-2">DESCRIPTION</th>
                                    <th className="py-4 text-center text-[10px] font-display font-black uppercase tracking-widest text-slate-400 print:py-2">QTY</th>
                                    <th className="py-4 text-right text-[10px] font-display font-black uppercase tracking-widest text-slate-400 print:py-2">UNIT</th>
                                    <th className="py-4 text-right text-[10px] font-display font-black uppercase tracking-widest text-slate-400 print:py-2">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-4 print:py-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 print-image-visible">
                                                    <img src={item.product.image} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="font-display font-bold text-slate-800 text-sm whitespace-normal">{item.product.title}</p>
                                                    {item.selectedSize && (
                                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-0.5">Size: {item.selectedSize}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center font-body font-bold text-slate-600 text-sm print:py-2">x{item.quantity}</td>
                                        <td className="py-4 text-right font-body font-bold text-slate-600 text-sm print:py-2">₹{item.price.toFixed(2)}</td>
                                        <td className="py-4 text-right font-display font-black text-slate-900 text-sm print:py-2">₹{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-end mt-4 print:mt-2">
                        <div className="w-full max-w-xs space-y-4 print:space-y-2">
                            <div className="flex justify-between items-center text-sm font-body text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                            </div>
                            
                            {/* GST Breakdown */}
                            {order.items.some(item => item.gst && item.gst > 0) && (
                                <div className="space-y-1 pt-2 border-t border-slate-100 mt-2">
                                    <p className="text-[10px] font-display font-black text-slate-400 uppercase tracking-widest mb-1">Tax Breakdown (Inclusive)</p>
                                    {Array.from(new Set(order.items.map(i => i.gst || 0).filter(g => g > 0))).sort((a, b) => a - b).map(rate => {
                                        const itemsAtRate = order.items.filter(i => (i.gst || 0) === rate);
                                        const amountAtRate = itemsAtRate.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                                        const taxableAmount = amountAtRate / (1 + rate / 100);
                                        const gstAmount = amountAtRate - taxableAmount;
                                        return (
                                            <div key={rate} className="flex justify-between items-center text-[10px] font-body text-slate-400">
                                                <span>GST ({rate}%)</span>
                                                <span>₹{gstAmount.toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex justify-between items-center text-[10px] font-display font-bold text-slate-500 pt-1">
                                        <span>Total GST</span>
                                        <span>₹{order.items.reduce((acc, i) => {
                                            const rate = i.gst || 0;
                                            const amount = i.price * i.quantity;
                                            const taxable = amount / (1 + rate / 100);
                                            return acc + (amount - taxable);
                                        }, 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-sm font-body text-slate-500">
                                <span>Delivery</span>
                                <span className={`font-bold ${delivery === 0 ? 'text-emerald-500' : ''}`}>{delivery === 0 ? 'FREE ✓' : `₹${delivery.toFixed(2)}`}</span>
                            </div>
                            {isCoD && advancePaid ? (
                                <div className="space-y-2 print:space-y-1">
                                    <div className="flex justify-between items-center text-[10px] font-body text-slate-500">
                                        <span>Advance Paid</span>
                                        <span className="font-bold text-emerald-600">₹{advancePaid.toFixed(2)} ✓</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-body text-slate-500">
                                        <span>Balance Due</span>
                                        <span className="font-bold text-orange-500">₹{(order.total - advancePaid).toFixed(2)}</span>
                                    </div>
                                </div>
                            ) : null}
                            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center print:pt-2">
                                <span className="font-display font-black text-slate-900 uppercase tracking-widest text-xs">Total</span>
                                <span className="text-3xl font-display font-black text-primary flex items-center gap-1 print:text-xl">
                                    <IndianRupee className="h-6 w-6 print:h-4 print:w-4" />
                                    {order.total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-12 pt-8 border-t border-slate-100 text-center print:mt-6 print:pt-4">
                        <p className="text-sm font-display font-black text-slate-800 mb-2 uppercase tracking-[0.3em] print:text-xs">Thank You!</p>
                        <p className="text-[10px] font-body text-slate-400">Computer-generated document. Inclusive of all taxes.</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

export default OrderInvoice;
