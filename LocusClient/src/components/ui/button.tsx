// src/components/ui/button.tsx
import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

export const Button: React.FC<ButtonProps> = ({
  className = "",
  variant = "default",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none";
  const variantClass =
    variant === "outline"
      ? "border border-gray-300 bg-white hover:bg-gray-50"
      : "bg-[#A50034] text-white hover:opacity-90";

  return (
    <button
      className={`${base} ${variantClass} ${className}`}
      {...props}
    />
  );
};
