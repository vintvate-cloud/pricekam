import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, IndianRupee, ShoppingCart, Loader2, Sparkles, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_URL } from '@/lib/api-config';



const COLORS = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D'];

const Analytics = () => {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['admin-analytics'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/admin/analytics`, { credentials: 'include' });
            return res.json();
        }
    });

    return (
        <AdminLayout>
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-2">Market Insights</h1>
                        <p className="text-muted-foreground font-body font-medium">Visualizing the magic growth of your toy store ✨</p>
                    </div>
                    <div className="bg-card px-6 py-4 rounded-3xl border border-border shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                            <Zap className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-display font-black text-muted-foreground/60 uppercase tracking-widest">Growth Rate</p>
                            <p className="font-display font-black text-foreground leading-none">+24.8% <span className="text-[10px] text-emerald-500 font-bold ml-1">↑</span></p>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="font-display font-bold text-muted-foreground">Scanning data points...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        {/* Revenue Area Chart */}
                        <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-display font-black text-foreground">Revenue Growth</h2>
                                    <p className="text-[10px] text-muted-foreground/60 font-display font-bold uppercase tracking-widest">Monthly sales performance</p>
                                </div>
                                <div className="p-4 bg-primary/10 rounded-2xl">
                                    <IndianRupee className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.revenueChart}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4D96FF" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4D96FF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 'bold' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 'bold' }}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                            contentStyle={{
                                                borderRadius: '24px',
                                                border: 'none',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                fontFamily: 'Fredoka, sans-serif'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#4D96FF" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Category Distribution Pie */}
                            <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm flex flex-col items-center">
                                <div className="w-full mb-8">
                                    <h2 className="text-xl font-display font-black text-foreground">Category Power</h2>
                                    <p className="text-[10px] text-muted-foreground/60 font-display font-bold uppercase tracking-widest">Sales by toy category</p>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics.categoryDistribution}
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                cornerRadius={8}
                                            >
                                                {analytics.categoryDistribution.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '20px', border: 'none', fontFamily: 'Outfit, sans-serif' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full px-10">
                                    {analytics.categoryDistribution.map((entry: any, index: number) => (
                                        <div key={entry.name} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-xs font-display font-bold text-muted-foreground">{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Targets/Conversion Stats */}
                            <div className="space-y-8">
                                <div className="bg-primary p-8 rounded-[3rem] text-white relative overflow-hidden shadow-xl shadow-primary/20">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                                <Target className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-xl font-display font-black">Conversion Goal</h3>
                                        </div>
                                        <div className="mb-8">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-4xl font-display font-black tracking-tighter">8.4%</span>
                                                <span className="text-xs font-display font-bold text-white/60 uppercase tracking-widest mb-1">Target: 10%</span>
                                            </div>
                                            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: "84%" }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-primary-foreground/80 font-display font-bold text-xs uppercase tracking-widest">
                                            <TrendingUp className="h-4 w-4" /> Near critical target hit ✨
                                        </div>
                                    </div>
                                    <Sparkles className="absolute top-1/2 right-[-20px] h-40 w-40 text-white/5" />
                                </div>

                                <div className="bg-primary/5 p-8 rounded-[3rem] border border-primary/20 text-foreground h-full relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col justify-center h-full">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                                <ShoppingCart className="h-6 w-6 text-primary" />
                                            </div>
                                            <h3 className="text-xl font-display font-black">Retention Funnel</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { label: "New Users", val: "1.2k", p: "100%" },
                                                { label: "Added to Cart", val: "840", p: "70%" },
                                                { label: "Purchased", val: "312", p: "26%" },
                                            ].map((item, idx) => (
                                                <div key={item.label} className="relative">
                                                    <div className="flex justify-between items-center mb-1 pr-1">
                                                        <span className="text-[10px] font-display font-black uppercase tracking-widest text-muted-foreground/60">{item.label}</span>
                                                        <span className="text-xs font-display font-black text-foreground">{item.val}</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-white/5 rounded-full">
                                                        <div className="h-full bg-primary rounded-full" style={{ width: item.p, opacity: 1 - (idx * 0.2) }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Analytics;
