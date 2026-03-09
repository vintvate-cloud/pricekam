import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import AuthLayout from "@/components/auth/AuthLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { API_URL } from '@/lib/api-config';



// Password strength rules (same as signup)
const RULES = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "Number", test: (p: string) => /[0-9]/.test(p) },
    { label: "Special character (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const ResetPasswordPage = () => {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [done, setDone] = useState(false);
    const navigate = useNavigate();

    const passed = RULES.filter(r => r.test(password)).length;
    const isStrong = passed >= 4;
    const isValid = isStrong && password === confirm;

    // Supabase sends the token in the URL hash — we need to exchange it
    useEffect(() => {
        supabase.auth.getSession(); // triggers session from hash
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setIsLoading(true);
        try {
            const { error: sbError } = await supabase.auth.updateUser({ password });
            if (sbError) throw sbError;

            // Also update in our own DB
            const session = (await supabase.auth.getSession()).data.session;
            if (session) {
                await fetch(`${API_URL}/auth/supabase`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: session.access_token, password }),
                    credentials: 'include',
                });
            }
            setDone(true);
            toast.success("Password updated successfully!");
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            toast.error(err.message || "Password reset failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (done) {
        return (
            <AuthLayout title="Password Reset!" subtitle="Redirecting you to login..." emoji="✅">
                <div className="text-center py-6">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <p className="font-body text-muted-foreground text-sm">Taking you to login…</p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Set New Password" subtitle="Choose a strong password for your account" emoji="🔐">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-2">
                    <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-muted/50 border border-transparent outline-none text-sm font-body focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all" />
                        <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Strength Indicators */}
                {password && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 p-4 bg-muted/50 rounded-2xl">
                        <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < passed ? passed <= 2 ? "bg-red-400" : passed <= 3 ? "bg-amber-400" : "bg-emerald-400" : "bg-border"}`} />
                            ))}
                        </div>
                        {RULES.map(r => (
                            <div key={r.label} className={`flex items-center gap-2 text-xs font-body transition-colors ${r.test(password) ? "text-emerald-500" : "text-muted-foreground"}`}>
                                <span>{r.test(password) ? "✓" : "○"}</span>{r.label}
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Confirm Password */}
                <div className="space-y-2">
                    <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input type={showPw ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted/50 border outline-none text-sm font-body transition-all ${confirm && password !== confirm ? "border-red-400/50 bg-red-50/30" : "border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/10 focus:bg-card"}`} />
                    </div>
                    {confirm && password !== confirm && <p className="text-xs text-red-500 font-body ml-1">Passwords don't match</p>}
                </div>

                <button type="submit" disabled={!isValid || isLoading}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-display font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-50">
                    {isLoading ? <div className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Saving...</div> : "Set New Password"}
                </button>
            </form>
        </AuthLayout>
    );
};

export default ResetPasswordPage;
