import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

const PrivacyPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-display font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground font-body">
        <p>At Pricekam, accessible from pricekam.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Pricekam and how we use it.</p>
        
        <h2 className="text-xl font-display font-bold text-foreground">1. Log Files</h2>
        <p>Pricekam follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics.</p>

        <h2 className="text-xl font-display font-bold text-foreground">2. Cookies and Web Beacons</h2>
        <p>Like any other website, Pricekam uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited.</p>

        <h2 className="text-xl font-display font-bold text-foreground">3. Privacy Policies</h2>
        <p>You may consult this list to find the Privacy Policy for each of the advertising partners of Pricekam.</p>

        <h2 className="text-xl font-display font-bold text-foreground">4. Online Privacy Policy Only</h2>
        <p>This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in Pricekam.</p>

        <h2 className="text-xl font-display font-bold text-foreground">5. Consent</h2>
        <p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default PrivacyPage;
