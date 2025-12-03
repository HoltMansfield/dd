"use client";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { startTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { withSentryErrorClient } from "@/sentry-error";
import { loginAction } from "./actions";
import { schema, LoginFormInputs } from "./schema";
import ServerError from "@/components/forms/ServerError";
import SubmitButton from "@/components/forms/SubmitButton";
import TextInput from "@/components/forms/TextInput";
import Form from "@/components/forms/Form";

import { Card } from "@radix-ui/themes";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const methods = useForm<LoginFormInputs>({
    resolver: yupResolver(schema),
  });
  const { handleSubmit } = methods;

  // Handle redirects after successful login
  useEffect(() => {
    if (state?.requiresMFA && state?.userId) {
      router.push(`/login/verify?userId=${state.userId}`);
    } else if (state?.success) {
      router.push("/");
    }
  }, [state, router]);

  const onSubmit = withSentryErrorClient(async (data: LoginFormInputs) => {
    startTransition(() => {
      formAction(data);
    });
  });

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Login</CardTitle>
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
              <SubmitButton isPending={isPending}>Login</SubmitButton>
            </Form>
          </FormProvider>
          <CardFooter className="flex justify-center">
            <div className="mt-4 text-center">
              <a
                href="/register"
                className="text-blue-600 hover:underline text-sm"
              >
                Create an account
              </a>
            </div>
          </CardFooter>
        </CardContent>
      </Card>
    </main>
  );
}
