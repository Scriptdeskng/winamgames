"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  delayMs?: number;
  className?: string;
  as?: "div" | "article" | "section";
}

const motionByTag = {
  div: motion.div,
  article: motion.article,
  section: motion.section,
} as const;

export function RevealOnScroll({
  children,
  delayMs = 0,
  className,
  as = "div",
}: RevealOnScrollProps) {
  const MotionComponent = motionByTag[as];

  return (
    <MotionComponent
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.45,
        ease: "easeOut",
        delay: delayMs / 1000,
      }}
    >
      {children}
    </MotionComponent>
  );
}
