import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "@/components/auth/AuthLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

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

const SignupPage = () => {
  const { refetchUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"SIGNUP" | "EMAIL_VERIFY">("SIGNUP");
  const navigate = useNavigate();

  const strength = getStrength(password);
  const isStrongEnough = strength >= 3;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (!isStrongEnough) {
      setError("Please create a stronger password (at least 3 requirements met)");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (signupError) throw signupError;

      if (data.session) {
        // Auto-login enabled in Supabase — sync with backend immediately
        await syncWithBackend(data.session.access_token, password);
      } else {
        // Email verification required
        sessionStorage.setItem('pending_password', password);
        setStep("EMAIL_VERIFY");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithBackend = async (access_token: string, pass?: string) => {
    const res = await fetch(`/api/auth/supabase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ access_token, password: pass }),
    });

    if (!res.ok) throw new Error("Could not sync profile with server");
    await refetchUser();
    navigate("/");
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join Pricekam for the best kids products"
      emoji="🎉"
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

      {step === "SIGNUP" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Your full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted/50 border border-transparent outline-none text-sm font-body hover:bg-muted focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="email"
                placeholder="you@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted/50 border border-transparent outline-none text-sm font-body hover:bg-muted focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-muted/50 border border-transparent outline-none text-sm font-body hover:bg-muted focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength bar */}
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
                <div className="flex justify-between items-center">
                  <span className="text-xs font-body text-muted-foreground">{strengthLabel[strength]}</span>
                </div>
                {/* Rules checklist */}
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

          {/* Confirm Password */}
          <div className="space-y-2 pb-2">
            <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest ml-1">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                required
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
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-display font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 relative overflow-hidden group disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </button>
        </form>
      ) : (
        /* Email verification sent */
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/5 border border-primary/20 rounded-[2rem] p-8 text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-primary animate-bounce" />
          </div>
          <h2 className="text-2xl font-display font-black text-foreground mb-4">Check Your Email 📬</h2>
          <p className="font-body text-muted-foreground mb-8 leading-relaxed">
            We've sent a verification link to <span className="text-primary font-bold">{email}</span>. Click it to activate your account.
          </p>
          <button
            onClick={() => setStep("SIGNUP")}
            className="text-sm font-display font-black text-primary uppercase tracking-widest hover:underline"
          >
            Wrong email? Go back
          </button>
        </motion.div>
      )}

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-body text-muted-foreground font-semibold uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <GoogleButton label="Sign up with Google" />

      <div className="mt-6 text-center text-sm font-body text-muted-foreground font-medium">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-bold hover:underline decoration-2 underline-offset-4 transition-all hover:text-primary/80">Sign In</Link>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
