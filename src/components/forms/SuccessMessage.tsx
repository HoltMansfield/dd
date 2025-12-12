"use client";

import React from "react";

interface SuccessMessageProps {
  message: string;
  className?: string;
}

export function SuccessMessage({
  message,
  className = "",
}: SuccessMessageProps) {
  return (
    <div
      className={`p-3 bg-green-50 border border-green-200 rounded-md ${className}`.trim()}
      role="status"
    >
      <p className="text-sm text-green-800">{message}</p>
    </div>
  );
}
