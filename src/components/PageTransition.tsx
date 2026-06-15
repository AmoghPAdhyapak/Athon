import { ReactNode } from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useLocation } from "wouter";

type Variant = {
  initial: Record<string, number>;
  animate: Record<string, number>;
  transition: Transition;
};

const ROUTE_VARIANTS: Record<string, Variant> = {
  "/templates": {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  "/create": {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  "/analyze": {
    initial: { opacity: 0, x: 32 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  },
  "/gallery": {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  "/saved": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  "/history": {
    initial: { opacity: 0, x: -28 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  "/stats": {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
  "/settings": {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: "easeOut" },
  },
  "/profile": {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  "/": {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  },
};

const DEFAULT_VARIANT = ROUTE_VARIANTS["/"];

export function PageTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const reduce = useReducedMotion();
  const variant = ROUTE_VARIANTS[location] ?? DEFAULT_VARIANT;

  if (reduce) {
    return (
      <motion.div
        key={location}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="w-full"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      key={location}
      initial={variant.initial}
      animate={variant.animate}
      transition={variant.transition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
