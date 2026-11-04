"use client";
import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  // Con "reducir movimiento" NO apagamos del todo: mostramos una version suave
  // (solo fundido + leve desplazamiento). Sin esa opcion, el efecto completo.
  const initial = reduce
    ? { opacity: 0, y: 8 }
    : { opacity: 0, y: 20, filter: "blur(8px)", scale: 0.99 };
  const animate = reduce
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 };
  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={{ duration: reduce ? 0.32 : 0.5, ease: [0.2, 0.7, 0.3, 1] }}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  );
}
