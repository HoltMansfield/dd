import React from "react";

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export default function Form({ children, className = "flex flex-col gap-4", ...props }: FormProps) {
  return (
    <form className={className} {...props}>
      {children}
    </form>
  );
}
