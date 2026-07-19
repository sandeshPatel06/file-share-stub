"use client";
import React from "react";
import { Loader } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variants: Record<string, string> = {
  primary: "bg-accent hover:bg-accent-2 text-white shadow-lg hover:shadow-xl transition-shadow",
  secondary: "bg-surface-2 hover:bg-surface-3 text-text border border-border hover:border-accent",
  danger: "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 hover:border-danger",
  ghost: "bg-transparent hover:bg-surface-3/50 text-text-muted hover:text-text",
};

const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2 text-sm gap-2 rounded-xl",
  lg: "px-6 py-3 text-base gap-2.5 rounded-xl",
};

export function Button({
  variant = "primary",
  size    = "md",
  loading = false,
  icon,
  iconRight,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.97]
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader className="animate-spin-slow" size={14} />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="shrink-0 ml-auto">{iconRight}</span>}
    </button>
  );
}
