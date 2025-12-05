"use client";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const methods = useForm<LoginFormInputs>({
    resolver: yupResolver(schema),
  });
  const { handleSubmit } = methods;

  // Check if user was redirected due to session timeout
  useEffect(() => {
    if (searchParams.get("timeout") === "true") {
      setShowTimeoutMessage(true);
      // Hide message after 10 seconds
      const timer = setTimeout(() => setShowTimeoutMessage(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

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
          {showTimeoutMessage && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Session Expired
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your session has expired due to inactivity. Please log in
                    again.
                  </p>
                </div>
                <button
                  onClick={() => setShowTimeoutMessage(false)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
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
