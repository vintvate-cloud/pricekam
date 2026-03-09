import { ReactNode } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  emoji: string;
}

const AuthLayout = ({ children, title, subtitle, emoji }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px] -z-10" />

      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md relative"
        >
          {/* Subtle glow effect behind the card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-[32px] blur-xl opacity-50" />
          
          <div className="bg-card/80 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-2xl p-8 relative overflow-hidden">
            <div className="text-center mb-8">
              <motion.div
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                 className="text-5xl mb-4 inline-block drop-shadow-lg"
              >
                {emoji}
              </motion.div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">{title}</h1>
              <p className="text-muted-foreground font-body text-sm mt-2 font-medium">{subtitle}</p>
            </div>
            
            {children}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default AuthLayout;
