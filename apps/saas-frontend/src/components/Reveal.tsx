import { CSSProperties, ReactNode } from "react";
import { useInView } from "../hooks/useInView";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms. */
  delay?: number;
  as?: "div" | "li" | "section";
}

export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const Tag = as as "div";
  const style: CSSProperties = {
    transition: "opacity 500ms ease, transform 500ms ease",
    transitionDelay: `${delay}ms`,
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(12px)",
  };
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
