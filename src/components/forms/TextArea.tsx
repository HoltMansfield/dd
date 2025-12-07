import { TextArea as RadixTextArea } from "@radix-ui/themes";
import React from "react";
import { useFormContext } from "react-hook-form";

interface TextAreaProps
  extends Omit<
    React.ComponentProps<typeof RadixTextArea>,
    "name" | "disabled"
  > {
  label: string;
  name: string;
  disabled?: boolean;
}

export default function TextArea({
  label,
  name,
  disabled,
  ...props
}: TextAreaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors?.[name]?.message as string | undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-medium">
        {label}
      </label>
      <RadixTextArea
        disabled={Boolean(disabled)}
        {...register(name)}
        {...props}
      />
      {error && (
        <div className="text-red-600 text-xs italic" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
