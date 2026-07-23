import React from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; }

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse", ease: "easeInOut" }}
      className={cn("bg-white/10 rounded-md", className)}
      {...props}
    />
  );
}
