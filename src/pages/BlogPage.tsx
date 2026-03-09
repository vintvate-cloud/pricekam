import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

const blogPosts = [
  {
    id: 1,
    title: "Top 10 Educational Toys for Toddlers in 2024",
    excerpt: "Discover the best educational toys that make learning fun and engaging for your little ones.",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=400&fit=crop",
    date: "Jan 15, 2024",
    readTime: "5 min read",
    category: "Toys",
  },
  {
    id: 2,
    title: "How to Choose the Right RC Car for Your Kid",
    excerpt: "A complete guide to selecting the perfect remote control car based on age and skill level.",
    image: "https://images.unsplash.com/photo-1581235707960-35f13de9805f?w=600&h=400&fit=crop",
    date: "Jan 22, 2024",
    readTime: "4 min read",
    category: "RC Cars",
  },
  {
    id: 3,
    title: "Kids Fashion Trends: Spring/Summer Collection",
    excerpt: "The cutest and most comfortable clothing trends for kids this season.",
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&h=400&fit=crop",
    date: "Feb 01, 2024",
    readTime: "6 min read",
    category: "Clothes",
  },
  {
    id: 4,
    title: "Gift Guide: Perfect Presents for Every Age",
    excerpt: "Stuck on what to gift? Our age-wise gift guide has you covered for every occasion.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop",
    date: "Feb 10, 2024",
    readTime: "7 min read",
    category: "Gifts",
  },
  {
    id: 5,
    title: "The Importance of Reading: Best Books for Kids",
    excerpt: "Why reading matters and our top picks for children's books across different age groups.",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop",
    date: "Feb 18, 2024",
    readTime: "5 min read",
    category: "Books",
  },
  {
    id: 6,
    title: "DIY Craft Ideas to Do With Your Kids",
    excerpt: "Fun and easy craft projects that bring the whole family together for creative play.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop",
    date: "Mar 01, 2024",
    readTime: "4 min read",
    category: "Activities",
  },
];

const BlogPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main>
      <section className="bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 py-12">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-display font-bold text-foreground mb-3">ToyBox Blog</h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto">Tips, guides, and inspiration for parents and kids</p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[3/2] overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-5">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-body font-semibold mb-3">{post.category}</span>
                <h2 className="font-display font-bold text-foreground mb-2 line-clamp-2">{post.title}</h2>
                <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                  </div>
                  <Link to="#" className="text-primary font-semibold flex items-center gap-1 hover:underline">
                    Read <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default BlogPage;
