import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, total } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-xl font-display font-bold text-card-foreground">Your Cart</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="font-display font-semibold text-lg text-card-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground font-body mt-1">Add some fun items!</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="flex gap-4 bg-muted/50 rounded-2xl p-3"
                    >
                      <img src={item.product.image} alt={item.product.title} className="w-20 h-20 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-semibold text-sm text-card-foreground truncate">{item.product.title}</h4>
                        <p className="text-primary font-bold font-display mt-1">₹{item.product.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 rounded-lg bg-card hover:bg-border transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-bold font-body w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 rounded-lg bg-card hover:bg-border transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                          <button onClick={() => removeItem(item.product.id)} className="ml-auto text-xs text-muted-foreground hover:text-destructive font-body transition-colors">
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="p-5 border-t border-border space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-body font-semibold text-card-foreground">Total</span>
                    <span className="text-2xl font-display font-bold text-primary">₹{total.toFixed(2)}</span>
                  </div>
                  <Link to="/checkout" onClick={() => setIsOpen(false)} className="block w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-display font-semibold text-lg hover:opacity-90 transition-opacity text-center">
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
