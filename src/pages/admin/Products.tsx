import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, Edit, Trash2, X, Search, Loader2, ArrowUpDown, Filter, Sparkles, Check, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { API_URL } from '@/lib/api-config';

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    originalPrice: number | null;
    image: string;
    images: string[];
    category: { id: string; name: string };
    categoryId: string;
    brand: string;
    ageGroup: string;
    stock: number;
    rating: number;
    isFeatured: boolean;
    sizes: string[];
    gst: number;
}

interface Category {
    id: string;
    name: string;
}



const Products = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [additionalImages, setAdditionalImages] = useState<string[]>([]);
    const [uploadingExtra, setUploadingExtra] = useState(false);
    
    // Size States
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

    const queryClient = useQueryClient();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setPreviewUrl(data.url);
            toast.success("Main image updated! 📸");
        } catch (error) {
            toast.error("Upload failed");
            setPreviewUrl(editingProduct?.image || null);
        } finally {
            setUploading(false);
        }
    };

    const handleExtraImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingExtra(true);
        const newImages = [...additionalImages];

        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('image', files[i]);

                const res = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (res.ok) {
                    const data = await res.json();
                    newImages.push(data.url);
                }
            }
            setAdditionalImages(newImages);
            toast.success("Additional views added! ✨");
        } catch (error) {
            toast.error("Extra image upload failed");
        } finally {
            setUploadingExtra(false);
        }
    };

    const removeExtraImage = (url: string) => {
        setAdditionalImages(prev => prev.filter(img => img !== url));
    };

    // Fetch Products
    const { data: products = [], isLoading } = useQuery<Product[]>({
        queryKey: ['admin-products'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/products`, { credentials: 'include' });
            return res.json();
        }
    });

    // Fetch Categories
    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/categories`);
            return res.json();
        }
    });

    // Delete Product
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) throw new Error('Failed to delete');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success("Toy removed from catalog!");
        }
    });

    // Create/Update Product
    const upsertMutation = useMutation({
        mutationFn: async (data: any) => {
            const method = editingProduct ? 'PUT' : 'POST';
            const url = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products`;
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
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            setShowModal(false);
            setEditingProduct(null);
            toast.success(editingProduct ? "Toy updated!" : "New toy added to catalog! ✨");
        }
    });

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setPreviewUrl(product.image);
        setAdditionalImages(product.images || []);
        setSelectedSizes(product.sizes || []);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setPreviewUrl(null);
        setAdditionalImages([]);
        setSelectedSizes([]);
        setUploading(false);
        setUploadingExtra(false);
    };

    return (
        <AdminLayout>
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-2 text-center md:text-left">Toy Catalog</h1>
                        <p className="text-muted-foreground font-body font-medium text-center md:text-left">Manage every piece of joy in your warehouse 🧸</p>
                    </div>
                    <button
                        onClick={() => { setEditingProduct(null); setPreviewUrl(null); setAdditionalImages([]); setShowModal(true); }}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-3xl font-display font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/30"
                    >
                        <Plus className="h-5 w-5" /> Add New Toy
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-card p-4 rounded-[2rem] border border-border shadow-sm flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, brand or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-background border-none outline-none font-body font-medium focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-3.5 rounded-2xl bg-background text-muted-foreground font-display font-bold text-sm flex items-center gap-2 hover:bg-accent hover:text-accent-foreground"><Filter className="h-4 w-4" /> Filter</button>
                        <button className="px-5 py-3.5 rounded-2xl bg-background text-muted-foreground font-display font-bold text-sm flex items-center gap-2 hover:bg-accent hover:text-accent-foreground"><ArrowUpDown className="h-4 w-4" /> Sort</button>
                    </div>
                </div>

                {/* Product Table */}
                <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-20 flex flex-col items-center gap-4">
                                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                <p className="font-display font-bold text-muted-foreground">Inventory scan in progress...</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-accent/30 border-b border-border">
                                        <th className="text-left p-6 text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">Inventory Detail</th>
                                        <th className="text-left p-6 text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">Category</th>
                                        <th className="text-left p-6 text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">Price & Profit</th>
                                        <th className="text-left p-6 text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">Stock Level</th>
                                        <th className="text-right p-6 text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">Magic Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredProducts.map((p) => (
                                        <tr key={p.id} className="hover:bg-accent/20 transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-accent flex-shrink-0 relative group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                                        <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                                                        {p.isFeatured && <div className="absolute top-1 right-1 bg-yellow-400 p-0.5 rounded-full"><Sparkles className="h-2 w-2 text-white" /></div>}
                                                    </div>
                                                    <div>
                                                        <p className="font-display font-black text-foreground leading-tight mb-1">{p.title}</p>
                                                        <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">{p.brand} • {p.ageGroup} yrs</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-[10px] font-display font-black text-primary uppercase tracking-widest">
                                                    {p.category.name}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col">
                                                    <span className="font-display font-black text-foreground">₹{p.price}</span>
                                                    {p.originalPrice && <span className="text-[10px] text-muted-foreground line-through">₹{p.originalPrice}</span>}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 10 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                                                    <span className={`text-sm font-display font-bold ${p.stock > 10 ? 'text-muted-foreground' : 'text-red-500'}`}>
                                                        {p.stock} units
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center justify-end gap-2 translate-x-2 group-hover:translate-x-0 transition-transform">
                                                    <button onClick={() => window.open(`/product/${p.id}`, '_blank')} className="p-3 rounded-2xl bg-accent hover:bg-card hover:text-blue-500 hover:shadow-md transition-all text-muted-foreground/60"><Eye className="h-4 w-4" /></button>
                                                    <button onClick={() => handleEdit(p)} className="p-3 rounded-2xl bg-accent hover:bg-card hover:text-primary hover:shadow-md transition-all text-muted-foreground/60"><Edit className="h-4 w-4" /></button>
                                                    <button onClick={() => deleteMutation.mutate(p.id)} className="p-3 rounded-2xl bg-accent hover:bg-card hover:text-red-500 hover:shadow-md transition-all text-muted-foreground/60"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!isLoading && filteredProducts.length === 0 && (
                            <div className="p-20 text-center">
                                <div className="w-20 h-20 bg-accent rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-3xl">🧩</div>
                                <h3 className="text-xl font-display font-black text-foreground mb-2">No Toys Found</h3>
                                <p className="text-muted-foreground font-body max-w-xs mx-auto">Try searching for something else or add a new treasure to your catalog!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upsert Product Modal */}
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
                            className="relative w-full max-w-2xl bg-card rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-border max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-display font-black text-foreground tracking-tight">{editingProduct ? "Refine Treasure ✨" : "New Treasure 🎁"}</h2>
                                    <p className="text-muted-foreground font-body text-sm font-medium">Every toy has a magical story to tell.</p>
                                </div>
                                <button onClick={handleCloseModal} className="p-4 bg-accent rounded-2xl hover:bg-red-400/10 hover:text-red-400 transition-all active:scale-90"><X className="h-6 w-6" /></button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const entries = Object.fromEntries(formData.entries());

                                const data = {
                                    ...entries,
                                    image: previewUrl || entries.image as string,
                                    images: additionalImages,
                                    price: parseFloat(entries.price as string),
                                    originalPrice: entries.originalPrice ? parseFloat(entries.originalPrice as string) : null,
                                    stock: parseInt(entries.stock as string) || 0,
                                    gst: parseFloat(entries.gst as string) || 0,
                                    isFeatured: formData.get("isFeatured") === "on",
                                    sizes: selectedSizes,
                                };

                                upsertMutation.mutate(data);
                            }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Toy Name</label>
                                        <input name="title" required defaultValue={editingProduct?.title} type="text" placeholder="e.g. Magical Unicorn Plus" className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-display font-bold text-foreground transition-all placeholder:text-muted-foreground/30" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Main Image</label>
                                        <div className="flex flex-col gap-4">
                                            {previewUrl && (
                                                <div className="relative w-full h-48 rounded-3xl overflow-hidden bg-accent border-2 border-border group/img">
                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <label htmlFor="imageUpload" className="cursor-pointer px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white font-display font-bold text-xs hover:bg-white/30 transition-all">CHANGE IMAGE</label>
                                                    </div>
                                                    {uploading && (
                                                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                                                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                            <p className="text-[10px] font-display font-black text-primary uppercase tracking-widest">Uploading...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {!previewUrl && (
                                                <label htmlFor="imageUpload" className={`w-full h-48 rounded-3xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                                                    <div className="p-4 bg-muted rounded-2xl">
                                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-display font-bold text-sm text-foreground">Click to Upload Main Image</p>
                                                        <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">PNG, JPG up to 5MB</p>
                                                    </div>
                                                </label>
                                            )}
                                            <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Additional Views (Gallery)</label>
                                        <div className="grid grid-cols-4 gap-4">
                                            {additionalImages.map((url, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-border group/extra">
                                                    <img src={url} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExtraImage(url)}
                                                        className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover/extra:opacity-100 transition-all scale-75 group-hover:scale-100"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {additionalImages.length < 10 && (
                                                <label htmlFor="extraImagesUpload" className={`aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${uploadingExtra ? 'pointer-events-none opacity-50' : ''}`}>
                                                    {uploadingExtra ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">Add View</span>
                                                </label>
                                            )}
                                            <input id="extraImagesUpload" type="file" accept="image/*" multiple className="hidden" onChange={handleExtraImagesUpload} disabled={uploadingExtra} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Price (₹)</label>
                                        <input name="price" required defaultValue={editingProduct?.price} type="number" step="0.01" placeholder="29.99" className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-display font-bold text-foreground transition-all placeholder:text-muted-foreground/30" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Old Price (Optional)</label>
                                        <input name="originalPrice" defaultValue={editingProduct?.originalPrice || ""} type="number" step="0.01" placeholder="39.99" className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-display font-bold text-foreground transition-all placeholder:text-muted-foreground/30" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Category</label>
                                        <select name="categoryId" required defaultValue={editingProduct?.categoryId} className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-display font-bold text-foreground transition-all appearance-none cursor-pointer">
                                            {categories.map(c => <option key={c.id} value={c.id} className="bg-card">{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Brand</label>
                                        <input name="brand" required defaultValue={editingProduct?.brand} type="text" placeholder="e.g. Lego" className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-display font-bold text-foreground transition-all placeholder:text-muted-foreground/30" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Age Group</label>
                                        <input name="ageGroup" required defaultValue={editingProduct?.ageGroup} type="text" placeholder="e.g. 5-7" className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-display font-bold text-foreground transition-all placeholder:text-muted-foreground/30" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Stock Quantity</label>
                                        <input name="stock" required defaultValue={editingProduct?.stock} type="number" placeholder="50" className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-display font-bold text-foreground transition-all placeholder:text-muted-foreground/30" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">GST Value (%)</label>
                                        <select 
                                            name="gst" 
                                            required 
                                            defaultValue={editingProduct?.gst || 0} 
                                            className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-display font-bold text-foreground transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="0" className="bg-card">0% (GST Free)</option>
                                            <option value="5" className="bg-card">5% GST</option>
                                            <option value="12" className="bg-card">12% GST</option>
                                            <option value="18" className="bg-card">18% GST</option>
                                            <option value="28" className="bg-card">28% GST</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Story (Description)</label>
                                        <textarea name="description" required defaultValue={editingProduct?.description} rows={3} placeholder="Tell the magic about this toy..." className="w-full px-6 py-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary/20 outline-none font-body font-medium text-foreground transition-all resize-none placeholder:text-muted-foreground/30" />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-4 bg-accent p-6 rounded-3xl border-2 border-dashed border-border">
                                        <div className="flex-1">
                                            <p className="font-display font-black text-foreground text-sm">Feature on Frontpage?</p>
                                            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">Give this toy special visibility!</p>
                                        </div>
                                        <input name="isFeatured" defaultChecked={editingProduct?.isFeatured} type="checkbox" className="w-6 h-6 rounded-lg accent-primary cursor-pointer" />
                                    </div>
                                    <div className="col-span-2 space-y-4">
                                        <label className="block text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest ml-1">Available Sizes</label>
                                        
                                        {/* Quick Add Presets */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {[
                                                "0-3m", "3-6m", "6-12m", 
                                                "1-2y", "2-3y", "3-4y", "4-5y", "5-6y", "6-7y", "7-8y", "8-9y", "9-10y", 
                                                "10-11y", "11-12y", "12-13y", "13-14y", "14-15y",
                                                "Free Size"
                                            ].map(size => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => !selectedSizes.includes(size) && setSelectedSizes([...selectedSizes, size])}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                                        selectedSizes.includes(size) 
                                                        ? 'bg-primary border-primary text-white scale-95 opacity-50' 
                                                        : 'border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Tag Input */}
                                        <div className="flex flex-wrap gap-2 p-4 bg-background border-2 border-border rounded-3xl min-h-[64px]">
                                            {selectedSizes.map(size => (
                                                <span key={size} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest animate-in zoom-in-95 duration-200">
                                                    {size}
                                                    <button type="button" onClick={() => setSelectedSizes(selectedSizes.filter(s => s !== size))} className="hover:text-red-500 transition-colors">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                            <input 
                                                type="text" 
                                                placeholder="Type and press Enter..." 
                                                className="flex-1 bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest placeholder:text-muted-foreground/30 min-w-[120px]"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = e.currentTarget.value.trim();
                                                        if (val && !selectedSizes.includes(val)) {
                                                            setSelectedSizes([...selectedSizes, val]);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    </div>

                                <button
                                    disabled={upsertMutation.isPending}
                                    type="submit"
                                    className="w-full py-5 bg-primary text-white rounded-[2rem] font-display font-black text-xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-2"
                                >
                                    {upsertMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Check className="h-6 w-6" /> {editingProduct ? "CAST UPDATE SPELL ✨" : "ADD TO CATALOG 🚀"}</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default Products;
