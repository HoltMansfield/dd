import React from "react";
import clsx from "clsx";
import "./submit-button-pulse.css";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isPending: boolean;
  pendingText?: string;
  children: React.ReactNode;
}

export function SubmitButton({ isPending, children, pendingText = "Please wait...", ...rest }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={clsx(
        "bg-blue-600 text-white rounded px-4 py-2",
        { "submit-btn-pulse": isPending }
      )}
      disabled={isPending}
      {...rest}
    >
      {isPending ? pendingText : children}
    </button>
  );
}

export default SubmitButton;
