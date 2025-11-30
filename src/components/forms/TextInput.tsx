import { TextField } from "@radix-ui/themes";
import React from "react";
import { useFormContext } from "react-hook-form";

interface TextInputProps extends Omit<React.ComponentProps<typeof TextField.Root>, 'name' | 'disabled'> {
  label: string;
  name: string;
  disabled?: boolean;
}

export default function TextInput({ label, name, disabled, ...props }: TextInputProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors?.[name]?.message as string | undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-medium">{label}</label>
      <TextField.Root
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
