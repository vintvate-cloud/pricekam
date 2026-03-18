import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
    return (
        <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-toy-cyan/5">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-toy-orange/10 blur-3xl"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, -45, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] rounded-full bg-toy-purple/10 blur-3xl"
                />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center text-center max-w-3xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3C83F6]/10 border border-[#3C83F6]/20 text-[#3C83F6] font-display font-bold text-sm mb-6">
                        <Sparkles className="h-4 w-4" />
                        <span>Unwrap the Magic of Play</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground leading-[1.1] mb-6">
                        Price Kam, <span className="text-[#3C83F6]">Khushi Jyada :)</span>, Quality ka Wada
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground font-body mb-8 max-w-xl leading-relaxed">
                        Discover a world of wonder with our curated collection of toys that inspire creativity,
                        learning, and endless joy for children of all ages.
                    </p>

                    <div className="mt-12 flex items-center gap-6">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-toy-cyan/20 flex items-center justify-center text-xl shadow-sm">
                                    {["🧸", "🎨", "🚀", "🎮"][i - 1]}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
