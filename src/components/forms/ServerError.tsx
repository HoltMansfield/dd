import React from "react";

interface ServerErrorProps {
  message?: string;
}

export function ServerError({ message }: ServerErrorProps) {
  if (!message) return null;

  return (
    <div
      className="text-sm text-center mt-2 border-6 border-red-300 text-red-400 font-bold rounded-none px-2 py-8 shadow"
      role="alert"
      data-testid="server-error"
    >
      {message}
    </div>
  );
}

export default ServerError;
