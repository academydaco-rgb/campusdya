"use client";
import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  // Navegar es una accion del usuario: aun con "reducir movimiento" mostramos un
  // deslizamiento + fundido claramente visible. Sin esa opcion, el efecto completo.
  const initial = reduce
    ? { opacity: 0, y: 16 }
    : { opacity: 0, y: 24, filter: "blur(10px)", scale: 0.985 };
  const animate = reduce
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 };
  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={{ duration: reduce ? 0.4 : 0.52, ease: [0.22, 0.61, 0.26, 1] }}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  );
}
