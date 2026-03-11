import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

const TermsPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-display font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground font-body">
        <p>Welcome to Pricekam. By using our website, you agree to comply with and be bound by the following terms and conditions of use.</p>
        
        <h2 className="text-xl font-display font-bold text-foreground">1. Acceptance of Terms</h2>
        <p>The services that Pricekam provides to you are subject to the following Terms of Use. Pricekam reserves the right to update the TOU at any time without notice to you.</p>

        <h2 className="text-xl font-display font-bold text-foreground">2. Description of Services</h2>
        <p>Pricekam provides you with access to a variety of resources, including shopping services, product information, and communication tools.</p>

        <h2 className="text-xl font-display font-bold text-foreground">3. Privacy and Protection of Personal Information</h2>
        <p>See the Privacy Policy disclosures relating to the collection and use of your information.</p>

        <h2 className="text-xl font-display font-bold text-foreground">4. User Account, Password, and Security</h2>
        <p>If any of the Services requires you to open an account, you must complete the registration process by providing us with current, complete and accurate information as prompted by the applicable registration form.</p>

        <h2 className="text-xl font-display font-bold text-foreground">5. Disclaimers</h2>
        <p>The materials on Pricekam's website are provided on an 'as is' basis. Pricekam makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsPage;
