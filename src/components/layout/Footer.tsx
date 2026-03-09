import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Instagram, Mail, MapPin, Phone, Send, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { name: "Toys", href: "/shop?category=Toys" },
      { name: "Clothes", href: "/shop?category=Clothes" },
      { name: "RC Cars", href: "/shop?category=RC Cars" },
      { name: "Gifts", href: "/shop?category=Gifts" },
      { name: "Books", href: "/shop?category=Books" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "My Account", href: user?.role === 'ADMIN' ? "/admin/dashboard" : "/profile" },
      { name: "Login", href: "/login" },
    ],
    legal: [
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Shipping Info", href: "/shipping" },
      { name: "Returns", href: "/returns" },
    ]
  };

  const socialLinks = [
    { icon: Instagram, color: "hover:bg-pink-500", href: "https://www.instagram.com/littlefy_toys", label: "Instagram" },
    { icon: Mail, color: "hover:bg-primary", href: "mailto:support@pricekam.com", label: "Email" },
  ];

  return (
    <footer className="relative bg-card border-t border-border mt-24 pt-20 pb-10 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-primary/10 rounded-[1.25rem] flex items-center justify-center group-hover:bg-primary/20 transition-all duration-500 group-hover:rotate-12">
                <span className="text-3xl">🧸</span>
              </div>
              <span className="text-3xl font-display font-black tracking-tight text-primary">
                Price<span className="text-secondary">kam</span>
              </span>
            </Link>
            <p className="text-muted-foreground font-body leading-relaxed max-w-sm">
              We believe every toy has a magical story to tell. Join us in creating unforgettable childhood memories with our curated collection of treasures.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, i) => (
                <motion.a
                  key={i}
                  whileHover={{ y: -5 }}
                  href={social.href}
                  className={`w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-foreground/60 transition-all duration-300 ${social.color} hover:text-white hover:shadow-lg`}
                >
                  <social.icon size={20} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:pl-10">
            <h4 className="text-lg font-display font-black text-foreground mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              Magical Shop
            </h4>
            <ul className="space-y-4">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary font-body font-medium transition-colors flex items-center group">
                    <ArrowRight size={14} className="mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg font-display font-black text-foreground mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full" />
              Adventure
            </h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-secondary font-body font-medium transition-colors flex items-center group">
                    <ArrowRight size={14} className="mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-display font-black text-foreground mb-4">Join the Magic!</h4>
              <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
                Subscribe for exclusive offers, new arrivals, and a touch of magic in your inbox.
              </p>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-background border-2 border-transparent focus:border-primary/20 rounded-[1.25rem] py-4 pl-12 pr-12 text-foreground font-body font-medium outline-none transition-all placeholder:text-muted-foreground/30 shadow-none ring-0"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                  <Send size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  <Phone size={14} className="text-primary" />
                </div>
                <a href="tel:+917489781720" className="font-body font-medium hover:text-primary transition-colors">+91 74897 81720</a>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground group">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 group-hover:bg-secondary/5 transition-colors mt-0.5">
                  <MapPin size={14} className="text-secondary" />
                </div>
                <span className="font-body font-medium leading-snug">22, near State Bank Of India, Awadhpuri, Bhopal, MP 462022</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  <Mail size={14} className="text-primary" />
                </div>
                <a href="mailto:support@pricekam.com" className="font-body font-medium hover:text-primary transition-colors">support@pricekam.com</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center group-hover:bg-pink-500/10 transition-colors">
                  <Instagram size={14} className="text-pink-500" />
                </div>
                <a href="https://www.instagram.com/littlefy_toys" target="_blank" rel="noopener noreferrer" className="font-body font-medium hover:text-pink-500 transition-colors">@littlefy_toys</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground font-body text-sm font-medium">
            © {currentYear} <span className="font-black text-foreground">Pricekam</span>. Crafted with ✨ and 🛍️
          </p>
          <div className="flex gap-8">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-[10px] font-display font-black text-muted-foreground/40 uppercase tracking-widest hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
