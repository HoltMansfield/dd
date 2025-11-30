"use client";
import { useForm, FormProvider } from "react-hook-form";
import { startTransition, useActionState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { withSentryErrorClient } from "@/sentry-error";
import { registerAction } from "./actions";
import { schema, RegisterFormInputs } from "./schema";
import ServerError from "@/components/forms/ServerError";
import SubmitButton from "@/components/forms/SubmitButton";
import TextInput from "@/components/forms/TextInput";
import Form from "@/components/forms/Form";
import { redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    undefined
  );
  const methods = useForm<RegisterFormInputs>({
    resolver: yupResolver(schema),
  });
  const { handleSubmit } = methods;

  const onSubmit = withSentryErrorClient(async (data: RegisterFormInputs) => {
    startTransition(() => {
      formAction(data);
    });
  });

  if (state?.success) {
    redirect("/login");
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <TextInput
                name="email"
                type="email"
                label="Email"
                placeholder="Email"
                autoComplete="email"
                disabled={isPending}
              />
              <TextInput
                name="password"
                type="password"
                label="Password"
                placeholder="Password"
                autoComplete="new-password"
                disabled={isPending}
              />
              {state?.error && <ServerError message={state.error} />}
              <SubmitButton isPending={isPending}>Register</SubmitButton>
            </Form>
          </FormProvider>
        </CardContent>
        <CardFooter className="flex justify-center">
          <a
            href="/login"
            className="text-blue-600 hover:underline text-sm mt-4 text-center"
          >
            Already have an account? Login
          </a>
        </CardFooter>
      </Card>
    </main>
  );
}
