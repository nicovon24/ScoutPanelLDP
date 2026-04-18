"use client";
import { Button, ButtonProps } from "@nextui-org/react";
import React from "react";

interface AppButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "light";
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function AppButton({ variant = "primary", size, className = "", children, ...props }: AppButtonProps) {
  const variants = {
    primary: "bg-green text-base font-black uppercase tracking-widest hover:brightness-110 shadow-[0_4px_20px_rgba(0,224,148,0.2)]",
    secondary: "bg-white/[0.05] hover:bg-white/[0.08] text-primary font-bold",
    danger: "bg-transparent text-muted hover:text-danger hover:bg-danger/5 border border-white/[0.05]",
    ghost: "bg-transparent border border-white/[0.1] hover:bg-white/[0.05] text-primary",
    light: "bg-transparent hover:bg-white/5 text-muted hover:text-primary",
  };

  const selectedVariant = variants[variant as keyof typeof variants] || variants.primary;

  return (
    <Button
      className={`rounded-xl transition-all duration-300 ${selectedVariant} ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}
