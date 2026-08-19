import { motion } from "framer-motion";

export interface SquiggleArrowProps {
  className?: string;
}

// Hand-drawn-style curved arrow doodle. `stroke="currentColor"` so it inherits
// color from a wrapping `text-*` className. Draws itself in on scroll-into-view.
export function SquiggleArrow({ className }: SquiggleArrowProps) {
  return (
    <motion.svg
      viewBox="0 0 100 60"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <motion.path
        d="M4,10 C20,4 35,45 55,32 C68,24 62,10 50,14 C40,17 46,32 60,36 C74,40 88,32 94,18"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: { duration: 1.1, ease: "easeInOut" } },
        }}
      />
      <motion.path
        d="M86,10 L94,18 L84,24"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: { duration: 0.4, delay: 0.9 } },
        }}
      />
    </motion.svg>
  );
}
