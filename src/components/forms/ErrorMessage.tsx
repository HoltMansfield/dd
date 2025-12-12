"use client";

import React from "react";

type ErrorMessageProps = {
  message: string;
  className?: string;
  testId?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function ErrorMessage({
  message,
  className = "",
  testId,
  ...rest
}: ErrorMessageProps) {
  return (
    <div
      className={`p-3 bg-red-50 border border-red-200 rounded-md ${className}`.trim()}
      role="alert"
      data-testid={testId}
      {...rest}
    >
      <p className="text-sm text-red-800">{message}</p>
    </div>
  );
}
