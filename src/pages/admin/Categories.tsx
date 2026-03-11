import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, X, Search, Loader2, Check, LayoutGrid, Palette, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { API_URL } from '@/lib/api-config';

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    _count?: {
        products: number;
    };
}



const Categories = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const queryClient = useQueryClient();

    // Fetch Categories
    const { data: categories = [], isLoading } = useQuery<Category[]>({
        queryKey: ['admin-categories'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/categories`, { credentials: 'include' });
            return res.json();
        }
    });

    // Delete Category
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success("Category vanished! 🪄");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    // Create/Update Category
    const upsertMutation = useMutation({
        mutationFn: async (data: any) => {
            const method = editingCategory ? 'PUT' : 'POST';
            const url = editingCategory ? `${API_URL}/categories/${editingCategory.id}` : `${API_URL}/categories`;
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            setShowModal(false);
            setEditingCategory(null);
            toast.success(editingCategory ? "Category refined!" : "New world created! ✨");
        }
    });

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
    };

    return (
        <AdminLayout>
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-2 text-center md:text-left">Toy Kingdoms</h1>
                        <p className="text-muted-foreground font-body font-medium text-center md:text-left">Organize your magical collection into Categorys 🏰</p>
                    </div>
                    <button
                        onClick={() => { setEditingCategory(null); setShowModal(true); }}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-3xl font-display font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/30"
                    >
                        <Plus className="h-5 w-5" /> Build New Category
                    </button>
                </div>

                {/* Search */}
                <div className="bg-card p-4 rounded-[2rem] border border-border shadow-sm mb-8">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Find a kingdom..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-background border-none outline-none font-body font-medium focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                        />
                    </div>
                </div>

                {/* Categories Grid */}
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        <p className="font-display font-bold text-muted-foreground">Mapping the kingdoms...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCategories.map((c) => (
                            <motion.div
                                key={c.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm group hover:shadow-xl hover:shadow-primary/5 transition-all"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div
                                        className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner"
                                        style={{ backgroundColor: `${c.color}20`, color: c.color }}
                                    >
                                        {c.icon || "📦"}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(c)} className="p-3 rounded-2xl bg-accent hover:bg-card hover:text-primary transition-all text-muted-foreground/60"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => deleteMutation.mutate(c.id)} className="p-3 rounded-2xl bg-accent hover:bg-card hover:text-red-500 transition-all text-muted-foreground/60"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-display font-black text-foreground mb-1">{c.name}</h3>
                                <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                                    {c._count?.products || 0} Magical Toys
                                </p>
                            </motion.div>
                        ))}
                        {filteredCategories.length === 0 && (
                            <div className="col-span-full p-20 text-center">
                                <div className="w-20 h-20 bg-accent rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-3xl">🏜️</div>
                                <h3 className="text-xl font-display font-black text-foreground mb-2">No Categorys Found</h3>
                                <p className="text-muted-foreground font-body max-w-xs mx-auto">Build a new kingdom to start organizing your magical collection!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Upsert Category Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 md:p-6 z-[60]">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-card rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-border"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-display font-black text-foreground tracking-tight">{editingCategory ? "Refine Category ✨" : "New Category 🏰"}</h2>
                                    <p className="text-muted-foreground font-body text-sm font-medium text-wrap">Give your toys a beautiful home.</p>
                                </div>
                                <button onClick={handleCloseModal} className="p-4 bg-accent rounded-2xl hover:bg-red-400/10 hover:text-red-400 transition-all"><X className="h-6 w-6" /></button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const entries = Object.fromEntries(formData.entries());
                                upsertMutation.mutate(entries);
                            }} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                                            <Type className="h-3 w-3" /> Category Name
                                        </label>
                                        <input name="name" required defaultValue={editingCategory?.name} type="text" placeholder="e.g. Action Heroes" className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-display font-bold text-foreground transition-all placeholder:text-muted-foreground/30" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                                                <LayoutGrid className="h-3 w-3" /> Category Emoji
                                            </label>
                                            <input name="icon" defaultValue={editingCategory?.icon} type="text" placeholder="🚀" className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-display font-bold text-foreground transition-all text-center text-xl" />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                                                <Palette className="h-3 w-3" /> Category Aura
                                            </label>
                                            <input name="color" defaultValue={editingCategory?.color || "#ff0000"} type="color" className="w-full h-[60px] p-1 rounded-2xl bg-background border-2 border-transparent hover:border-primary/20 cursor-pointer overflow-hidden" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={upsertMutation.isPending}
                                    type="submit"
                                    className="w-full py-5 bg-primary text-white rounded-[2rem] font-display font-black text-xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-2"
                                >
                                    {upsertMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Check className="h-6 w-6" /> {editingCategory ? "CAST REFINEMENT ✨" : "MANIFEST Category 🏰"}</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default Categories;
