"use client";
import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  // Navegar es una accion del usuario: siempre mostramos un deslizamiento + fundido
  // claramente visible (aun con "Reducir movimiento" del sistema: MotionConfig lo fuerza).
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, filter: "blur(8px)", scale: 0.975 }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 0.61, 0.26, 1] }}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  );
}
