import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

const ShippingPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-display font-bold mb-8">Shipping & Return Policy</h1>
      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground font-body">
        
        <h2 className="text-xl font-display font-bold text-foreground">Shipping Information</h2>
        <p className="font-semibold text-foreground">Free shipping on orders ₹2000 and above</p>
        <p>Delivery takes 7-8 business days from the date of dispatch.</p>

        <h2 className="text-xl font-display font-bold text-foreground mt-8">Return Policy</h2>
        <p className="font-bold text-destructive">Strict No Return, No Refund Policy</p>
        
        <h3 className="text-lg font-display font-bold text-foreground mt-6">Quality Assurance</h3>
        <p>All products undergo rigorous double quality checks before dispatch. We stand by our commitment to excellence—defective items are not shipped.</p>

        <h3 className="text-lg font-display font-bold text-foreground mt-6">Exceptions (Extremely Rare)</h3>
        <p>Exceptions are only considered with strict proof. To submit a claim:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Submit an uncut video (maximum 5 minutes) within 48 hours of delivery</li>
          <li>Send via email to <a href="mailto:support@pricekam.com" className="text-primary hover:underline">support@pricekam.com</a> or through our portal</li>
        </ul>

        <h3 className="text-lg font-display font-bold text-foreground mt-6">Video Requirements</h3>
        <p>The video must clearly show:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Timestamped unboxing (from sealed package)</li>
          <li>Live demonstration of the alleged issue (no edits, pauses, or fast-forwards)</li>
          <li>Product serial number/QR code visible</li>
        </ul>

        <h3 className="text-lg font-display font-bold text-foreground mt-6">Important Notes</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Incomplete or late submissions will be rejected</li>
          <li>Approved cases may qualify for replacement only (shipping at your cost)</li>
          <li className="font-bold text-destructive">No refunds under any circumstances</li>
        </ul>
      </div>
    </main>
    <Footer />
  </div>
);

export default ShippingPage;
