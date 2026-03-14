import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "@/components/auth/AuthLayout";

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
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP" | "SIGNUP">("EMAIL");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const strength = getStrength(password);
  const isStrongEnough = strength >= 3;

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Email is required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = data.message || 'Failed to send verification code';
        if (data.detail) msg += `: ${data.detail}`;
        if (data.hint) msg += ` (${data.hint})`;
        throw new Error(msg);
      }

      setStep("OTP");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = data.message || 'Invalid or expired code';
        if (data.detail) msg += `: ${data.detail}`;
        if (data.hint) msg += ` (${data.hint})`;
        throw new Error(msg);
      }

      setStep("SIGNUP");
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the Terms and Conditions");
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      await refetchUser();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === "EMAIL" ? "Get Started" : step === "OTP" ? "Verify Email" : "Create Account"}
      subtitle={step === "EMAIL" ? "Join Pricekam for the best kids products" : step === "OTP" ? `Enter the code sent to ${email}` : "Choose your name and a secure password"}
      emoji={step === "EMAIL" ? "🎉" : step === "OTP" ? "📩" : "🛡️"}
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

      {step === "EMAIL" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
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
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-display font-semibold text-base hover:opacity-90 transition-all shadow-lg"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Continue"}
          </button>
        </form>
      )}

      {step === "OTP" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest ml-1">Verification Code</label>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={isLoading}
              className="w-full px-4 py-4 rounded-2xl bg-muted/50 border border-transparent outline-none text-2xl font-display font-bold text-center tracking-[1rem] hover:bg-muted focus:bg-card focus:border-primary/30 transition-all disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-display font-semibold text-base hover:opacity-90 transition-all shadow-lg"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verify Code"}
          </button>
          <button
            type="button"
            onClick={() => setStep("EMAIL")}
            className="w-full text-sm font-display font-bold text-muted-foreground hover:text-primary transition-colors py-2"
          >
            Change Email
          </button>
        </form>
      )}

      {step === "SIGNUP" && (
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
          </div>

          <div className="flex items-start gap-3 py-2 cursor-pointer group" onClick={() => setAgreedToTerms(!agreedToTerms)}>
            <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-primary border-primary' : 'border-muted-foreground/30 group-hover:border-primary/50'}`}>
              {agreedToTerms && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
            </div>
            <p className="text-xs font-body text-muted-foreground leading-relaxed">
              I agree to Pricekam's{" "}
              <Link to="/terms" onClick={(e) => e.stopPropagation()} className="text-primary font-bold hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/privacy" onClick={(e) => e.stopPropagation()} className="text-primary font-bold hover:underline">Privacy Policy</Link>
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isStrongEnough || password !== confirmPassword || !agreedToTerms}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-display font-semibold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Complete Registration"}
          </button>
        </form>
      )}



      <div className="mt-6 text-center text-sm font-body text-muted-foreground font-medium">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-bold hover:underline decoration-2 underline-offset-4 transition-all hover:text-primary/80">Sign In</Link>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
