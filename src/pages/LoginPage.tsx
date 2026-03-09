import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "@/components/auth/AuthLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { refetchUser } = useAuth(); // Destructured refetchUser
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. First try Supabase (Modern Auth Flow)
      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!sbError && sbData.session) {
        // Successful Supabase login, now sync with our backend
        await syncWithBackend(sbData.session.access_token);
        return;
      }

      // 2. If Supabase fails, try Local Server (Fallback for legacy/admin accounts)
      // We only fallback if Supabase gives an error (like user not found in Supabase)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (sbError ? sbError.message : "Invalid credentials"));
      }

      // Successful local login
      refetchUser();
      navigateByRole(data.user.role);

    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithBackend = async (access_token: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/supabase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ access_token }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Session sync failed");

    await refetchUser();
    navigateByRole(data.user.role);
  };

  const navigateByRole = (role: string) => {
    if (role === "ADMIN") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <AuthLayout
      title="Welcome Back!"
      subtitle="Sign in to your Pricekam account"
      emoji="🧸"
    >
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted/50 border border-transparent outline-none text-sm font-body hover:bg-muted focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline transition-all">Forgot password?</Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
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
        </div>

        <div className="flex items-center gap-2 px-1">
          <input type="checkbox" id="remember" className="rounded-lg w-4 h-4 text-primary bg-muted border-transparent focus:ring-primary/20 accent-primary" />
          <label htmlFor="remember" className="text-sm font-body text-muted-foreground font-medium cursor-pointer select-none">Remember this device</label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-display font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 relative overflow-hidden group disabled:opacity-70 disabled:active:scale-100"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Checking Details...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Sign In</span>
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce-custom group-hover:bg-accent transition-colors" />
            </div>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-body text-muted-foreground font-semibold uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <GoogleButton label="Continue with Google" />

      <div className="mt-6 text-center text-sm font-body text-muted-foreground font-medium">
        New to Pricekam?{" "}
        <Link to="/signup" className="text-primary font-bold hover:underline decoration-2 underline-offset-4 transition-all hover:text-primary/80">Create Account</Link>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
