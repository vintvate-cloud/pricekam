import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

const ShippingPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-display font-bold mb-8">Shipping Information</h1>
      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground font-body">
        <p>We aim to deliver your magical treasures as quickly and safely as possible.</p>
        
        <h2 className="text-xl font-display font-bold text-foreground">1. Shipping Rates</h2>
        <p>We offer free shipping on all orders above ₹500. For orders below ₹500, a flat shipping fee may apply.</p>

        <h2 className="text-xl font-display font-bold text-foreground">2. Delivery Time</h2>
        <p>Orders are typically processed within 24-48 hours. Delivery usually takes 3-5 business days depending on your location.</p>

        <h2 className="text-xl font-display font-bold text-foreground">3. Tracking Your Order</h2>
        <p>Once your order is shipped, you will receive an email with the tracking information.</p>

        <h2 className="text-xl font-display font-bold text-foreground">4. International Shipping</h2>
        <p>Currently, we only ship within India. We are looking forward to expanding our magic worldwide soon!</p>

        <h2 className="text-xl font-display font-bold text-foreground">5. Shipping Partners</h2>
        <p>We partner with leading courier services to ensure your products reach you in perfect condition.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default ShippingPage;
