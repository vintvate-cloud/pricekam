import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "@/components/auth/AuthLayout";
import { supabase } from "@/lib/supabase";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setIsLoading(true);
    try {
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (sbError) throw sbError;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? "Check Email" : "Forgot Password?"}
      subtitle={sent ? "We've sent a magic link to your inbox" : "Enter your email to receive a reset link"}
      emoji={sent ? "📧" : "🔑"}
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-success/10 text-success p-6 rounded-[24px] border border-success/20 mb-8 inline-block">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <p className="text-muted-foreground font-body text-sm mb-8 leading-relaxed">
              We've sent a password reset link to <br />
              <strong className="text-foreground">{email}</strong>. <br />
              Please check your spam folder if you don't see it.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary font-display font-bold hover:gap-3 transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-display font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 relative overflow-hidden group disabled:opacity-50 disabled:active:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Send Reset Link</span>
                    <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </form>
            <div className="mt-8 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground font-body font-semibold hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
