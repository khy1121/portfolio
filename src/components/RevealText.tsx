"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function RevealText({ text }: { text: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{text}</>;
  const chars = Array.from(text);
  return (
    <span aria-label={text} className="inline-block">
      {chars.map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            aria-hidden
            className="inline-block"
            initial={{ y: "105%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ delay: i * 0.04, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {ch === " " ? " " : ch}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
