import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import ProductGridSection from "@/components/home/ProductGridSection";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <CartDrawer />
    <main>
      <HeroSection />
      <FeaturedCategories />
      <ProductGridSection />
    </main>
    <Footer />
  </div>
);

export default Index;
