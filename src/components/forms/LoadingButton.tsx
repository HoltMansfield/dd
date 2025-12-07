import React from "react";
import clsx from "clsx";
import "./submit-button-pulse.css";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: "primary" | "danger" | "secondary";
}

export function LoadingButton({
  isLoading,
  children,
  loadingText = "Please wait...",
  variant = "primary",
  className,
  ...rest
}: LoadingButtonProps) {
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
  };

  return (
    <button
      type="button"
      className={clsx(
        "rounded px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
        variantClasses[variant],
        { "submit-btn-pulse": isLoading },
        className
      )}
      disabled={isLoading}
      {...rest}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}

export default LoadingButton;
