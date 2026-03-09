import { useQuery } from "@tanstack/react-query";
import { User, Mail, Calendar, Loader2, ArrowUpRight, Search, ShoppingBag, BadgeCheck, ShieldAlert } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { format } from "date-fns";
import { useState } from "react";
import { API_URL } from '@/lib/api-config';

interface Customer {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'CUSTOMER';
    createdAt: string;
    _count: { orders: number };
}



const Customers = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: customers = [], isLoading } = useQuery<Customer[]>({
        queryKey: ['admin-customers'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/admin/users`, { credentials: 'include' });
            return res.json();
        }
    });

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-2">Happiest Customers</h1>
                    <p className="text-muted-foreground font-body font-medium">Monitoring the growing family of Joybox fans 🧸</p>
                </div>

                {/* Search Bar */}
                <div className="bg-card p-4 rounded-[2.5rem] border border-border shadow-sm flex items-center gap-4 mb-10 group">
                    <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-primary transition-transform group-focus-within:scale-[1.15]">
                        <Search className="h-6 w-6" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, email or customer ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none font-display font-bold text-foreground text-lg placeholder:text-muted-foreground/30"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full p-20 flex flex-col items-center gap-4">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            <p className="font-display font-bold text-muted-foreground">Loading members list...</p>
                        </div>
                    ) : filteredCustomers.map((customer) => (
                        <div key={customer.id} className="bg-card p-8 rounded-[3rem] border border-border shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group relative overflow-hidden">
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-20 h-20 bg-background rounded-[2.5rem] flex items-center justify-center text-3xl shadow-inner relative group-hover:bg-primary/5 transition-colors border border-border/50">
                                    {customer.name ? customer.name.charAt(0).toUpperCase() : '👤'}
                                    {customer.role === 'ADMIN' && (
                                        <div className="absolute -top-1 -right-1 bg-rose-500 p-2 rounded-2xl border-4 border-card shadow-md">
                                            <ShieldAlert className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${customer.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                                        {customer.role}
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                                            <ShoppingBag className="h-4 w-4 text-emerald-500" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-display font-black text-foreground">{customer._count.orders}</p>
                                            <p className="text-[10px] text-muted-foreground/60 font-display font-bold uppercase tracking-widest leading-none">Orders</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xl font-display font-black text-foreground leading-tight mb-1">{customer.name || 'Anonymous User'}</h3>
                                <p className="text-sm text-muted-foreground font-body font-medium transition-colors group-hover:text-primary">{customer.email}</p>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-border/50">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground/30" />
                                    <p className="text-xs text-muted-foreground/60 font-display font-bold uppercase tracking-widest">Joined {format(new Date(customer.createdAt), "MMM d, yyyy")}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <BadgeCheck className="h-4 w-4 text-muted-foreground/30" />
                                    <p className="text-xs text-muted-foreground/60 font-display font-bold uppercase tracking-widest">Verified Account</p>
                                </div>
                            </div>

                            <button className="absolute bottom-6 right-6 p-4 bg-background rounded-3xl hover:bg-primary hover:text-white transition-all transform scale-0 group-hover:scale-100 duration-300 shadow-lg">
                                <ArrowUpRight className="h-6 w-6" />
                            </button>
                        </div>
                    ))}

                    {!isLoading && filteredCustomers.length === 0 && (
                        <div className="col-span-full p-20 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-6 text-4xl">👻</div>
                            <h2 className="text-2xl font-display font-black text-slate-900">Where'd they go?</h2>
                            <p className="text-slate-500 font-body max-w-sm mx-auto mt-2">We couldn't find any customers matching your search query. Try another name or email address!</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Customers;
