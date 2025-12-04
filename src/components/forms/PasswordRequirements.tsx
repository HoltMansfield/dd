"use client";

import { PASSWORD_REQUIREMENTS } from "@/lib/password-validation";
import { Check, X } from "lucide-react";

interface PasswordRequirementsProps {
  password: string;
  show?: boolean;
}

export default function PasswordRequirements({
  password,
  show = true,
}: PasswordRequirementsProps) {
  if (!show) return null;

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Password Requirements:
      </p>
      <ul className="space-y-1">
        {PASSWORD_REQUIREMENTS.map((requirement, index) => {
          const isMet = password ? requirement.test(password) : false;
          return (
            <li
              key={index}
              className={`text-xs flex items-center gap-2 ${
                isMet ? "text-green-600" : "text-gray-500"
              }`}
            >
              {isMet ? (
                <Check className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              <span>{requirement.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
