import { motion } from "framer-motion";
import { Heart, Shield, Truck, Award } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

const values = [
  { icon: Heart, title: "Made with Love", desc: "Every product is curated with care for your little ones." },
  { icon: Shield, title: "Safe & Certified", desc: "All toys meet the highest safety standards and certifications." },
  { icon: Truck, title: "Fast Delivery", desc: "Free shipping on orders above ₹499. Delivered in 3-5 days." },
  { icon: Award, title: "Quality First", desc: "Premium quality products that last through years of play." },
];

const team = [
  { name: "Priya Sharma", role: "Founder & CEO", emoji: "👩‍💼" },
  { name: "Rahul Patel", role: "Head of Products", emoji: "👨‍💻" },
  { name: "Anita Desai", role: "Creative Director", emoji: "🎨" },
  { name: "Vikram Singh", role: "Operations Lead", emoji: "📦" },
];

const AboutPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-5xl mb-4 block">🧸</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">About ToyBox</h1>
            <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
              We believe every child deserves the magic of play. Since 2024, we've been bringing joy to families with hand-picked toys, stylish kids' clothing, and gifts that spark imagination.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-10">What We Stand For</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl border border-border p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <v.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-10">Meet Our Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {team.map((t) => (
              <div key={t.name} className="bg-card rounded-2xl border border-border p-5 text-center">
                <span className="text-4xl block mb-3">{t.emoji}</span>
                <h3 className="font-display font-bold text-sm text-foreground">{t.name}</h3>
                <p className="text-xs text-muted-foreground font-body">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "10K+", label: "Happy Families" },
            { value: "500+", label: "Products" },
            { value: "50+", label: "Brands" },
            { value: "4.8★", label: "Avg Rating" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-display font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground font-body mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default AboutPage;
