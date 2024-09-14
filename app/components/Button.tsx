// app/components/Button.tsx
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "icon";
  as?: React.ElementType;
}

const Button: React.FC<ButtonProps> = ({
  variant = "default",
  size = "default",
  as: Component = "button",
  className,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantStyles = {
    default: "bg-blue-500 text-white hover:bg-blue-600",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  };
  const sizeStyles = {
    default: "px-4 py-2 text-sm",
    icon: "p-2 text-base",
  };

  return (
    <Component
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    />
  );
};

export { Button };
