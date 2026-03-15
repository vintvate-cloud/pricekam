import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

const TermsPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-display font-bold mb-8">Terms and Conditions</h1>
      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground font-body">
        
        <h2 className="text-2xl font-display font-bold text-foreground">Introduction</h2>
        <p>Welcome to pricekam.com ("we", "us", "our", or "the Company"). By accessing or purchasing from our website, you ("you", "customer", "buyer", "user") agree to the following Terms and Conditions. Please read them carefully.</p>
        
        <h2 className="text-2xl font-display font-bold text-foreground mt-8">Products & Orders</h2>
        <p>We sell a range of children's products, including toys, clothes for kids, books, gifts, RC cars, and similar items. Some products may be replicas and are not original branded items.</p>
        <p>Product descriptions, images, and specifications are provided for reference. Actual product may vary slightly due to ongoing improvements or batch changes.</p>

        <h2 className="text-2xl font-display font-bold text-foreground mt-8">Pricing & Payments</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>All prices are in INR (₹) and include applicable taxes unless stated otherwise.</li>
          <li>Payment can be made via Cash on Delivery (COD), UPI, debit/credit card, or other methods as displayed at checkout.</li>
          <li>We reserve the right to change prices or discontinue products without prior notice.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-foreground mt-8">Shipping & Delivery</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Orders are processed within 1–2 business days and shipped via reputed courier partners.</li>
          <li>Delivery typically takes 3–7 working days depending on location.</li>
          <li>Delays due to natural calamities, courier issues, or unforeseen circumstances are not our responsibility.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-foreground mt-8">Returns, Replacements & Store Credits</h2>
        
        <h3 className="text-xl font-display font-bold text-foreground mt-6">No Refund Policy</h3>
        <p className="font-bold text-destructive">We do not offer cash/bank refunds under any circumstances.</p>

        <h3 className="text-xl font-display font-bold text-foreground mt-6">Return Eligibility</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Returns are only accepted if the product is received in a faulty or damaged condition.</li>
          <li>To claim, you must provide an unboxing video starting from opening the parcel seal, clearly showing the issue.</li>
          <li>The claim must be raised within 24 hours of delivery.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-foreground mt-6">Replacement</h3>
        <p>Eligible returns will be replaced with the same or a similar item, subject to stock availability.</p>

        <h3 className="text-xl font-display font-bold text-foreground mt-6">Store Credit</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>If replacement is not possible, you will receive store credits only.</li>
          <li>Store credits are valid for 90 days and can be redeemed on any product on our website.</li>
          <li>Store credits are non-transferable and non-refundable.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-foreground mt-6">Return Shipping</h3>
        <p>Customer is responsible for return shipping costs unless otherwise agreed by the Company.</p>

        <h3 className="text-xl font-display font-bold text-foreground mt-6">Physical Damage/Used Products</h3>
        <p>Returns/claims for products with physical damage, signs of use, or missing accessories will not be accepted.</p>

        <h2 className="text-2xl font-display font-bold text-foreground mt-8">Warranty</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Unless specified, products carry a limited warranty (typically 7–30 days) only for manufacturing defects.</li>
          <li>Damage due to mishandling, water, electrical faults, or unauthorized repairs voids warranty.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-foreground mt-8">Limitation of Liability</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>The Company is not liable for any indirect, incidental, or consequential damages resulting from use of our products.</li>
          <li>Our liability is limited to the value of the purchased product.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-foreground mt-8">Intellectual Property</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>All website content (text, images, designs, logos) is property of pricekam.com and cannot be used without permission.</li>
          <li>Product names or logos used on this site are for identification only; we disclaim any ownership of third-party trademarks.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-foreground mt-8">Account & Privacy</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You are responsible for maintaining confidentiality of your account details and passwords.</li>
          <li>We respect your privacy and will not share your personal data except as needed for order processing and as per our Privacy Policy.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-foreground mt-8">Governing Law & Jurisdiction</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>These Terms shall be governed by the laws of India.</li>
          <li>Any disputes will be subject to exclusive jurisdiction of the courts in Bhopal, India.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-foreground mt-8">Amendments</h2>
        <p>We reserve the right to update these Terms & Conditions at any time. Continued use of the site implies acceptance of the latest terms.</p>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm">For any questions or concerns regarding these Terms and Conditions, please contact us at <a href="mailto:support@pricekam.com" className="text-primary hover:underline font-semibold">support@pricekam.com</a></p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsPage;
