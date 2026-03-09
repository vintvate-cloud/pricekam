import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "@/components/auth/AuthLayout";

// Password strength rules
const rules = [
    { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { id: "upper", label: "One uppercase letter (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
    { id: "lower", label: "One lowercase letter (a–z)", test: (p: string) => /[a-z]/.test(p) },
    { id: "num", label: "One number (0–9)", test: (p: string) => /[0-9]/.test(p) },
    { id: "sym", label: "One special character (!@#…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const getStrength = (p: string) => rules.filter(r => r.test(p)).length;
const strengthLabel = ["", "Weak", "Fair", "Moderate", "Strong", "Very Strong"];
const strengthColor = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-400", "bg-emerald-500"];

const SetPasswordPage = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const strength = getStrength(password);
    const isStrongEnough = strength >= 3;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        if (!password || !confirmPassword) {
            setError("Please fill in both fields");
            return;
        }
        if (!isStrongEnough) {
            setError("Please create a stronger password");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/set-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to set password");

            setSuccess(true);
            setTimeout(() => navigate("/"), 2000);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout title="Password Set!" subtitle="You're all set" emoji="🎉">
                <div className="text-center space-y-4 py-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"
                    >
                        <ShieldCheck className="h-10 w-10 text-emerald-600" />
                    </motion.div>
                    <p className="text-muted-foreground font-body">Password saved! Redirecting...</p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Set Your Password" subtitle="Create a password to also sign in with email" emoji="🔐">
            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-destructive/10 text-destructive text-sm font-body p-4 rounded-2xl mb-6 flex items-center gap-3 border border-destructive/20"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-6 p-4 rounded-2xl bg-[#3C83F6]/8 border border-[#3C83F6]/20">
                <p className="text-sm font-body text-muted-foreground">
                    🔑 You signed up with Google. Setting a password lets you also log in with your email address in the future.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password field */}
                <div className="space-y-2">
                    <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-muted/50 border border-transparent outline-none text-sm font-body hover:bg-muted focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Strength bar + rules */}
                    {password && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-1">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div
                                        key={i}
                                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : "bg-muted"}`}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs font-body text-muted-foreground">{strengthLabel[strength]}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1 pt-1">
                                {rules.map(r => {
                                    const pass = r.test(password);
                                    return (
                                        <div key={r.id} className="flex items-center gap-2">
                                            {pass
                                                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                : <XCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
                                            <span className={`text-xs font-body transition-colors ${pass ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                                                {r.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                    <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted/50 border border-transparent outline-none text-sm font-body hover:bg-muted focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
                        />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-500 ml-1 font-body">Passwords don't match</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !isStrongEnough || password !== confirmPassword}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-display font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:active:scale-100"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Saving...</span>
                        </div>
                    ) : "Save Password"}
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full py-3 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                >
                    Skip for now
                </button>
            </form>
        </AuthLayout>
    );
};

export default SetPasswordPage;
