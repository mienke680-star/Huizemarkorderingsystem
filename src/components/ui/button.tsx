"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-orange-500 text-white shadow-orange-glow hover:bg-orange-600 focus-visible:ring-orange-300 disabled:bg-orange-300",
  secondary:
    "bg-navy-700 text-white hover:bg-navy-800 focus-visible:ring-navy-300 disabled:bg-navy-300",
  outline:
    "border border-grey-300 bg-white text-navy-700 hover:border-orange-400 hover:text-orange-600 focus-visible:ring-orange-200",
  ghost: "text-navy-600 hover:bg-grey-100 focus-visible:ring-grey-200",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300",
  subtle: "bg-orange-50 text-orange-700 hover:bg-orange-100 focus-visible:ring-orange-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-xl",
  icon: "h-10 w-10 rounded-full",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  magnetic?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, magnetic, disabled, children, ...props },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={magnetic ? { scale: 1.03, y: -1 } : { y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium tracking-tight transition-colors duration-200 outline-none focus-visible:ring-2 ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
