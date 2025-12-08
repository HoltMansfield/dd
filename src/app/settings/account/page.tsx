"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { deleteUserAccount } from "@/actions/user";
import { withSentryErrorClient } from "@/sentry-error";
import TextInput from "@/components/forms/TextInput";
import Form from "@/components/forms/Form";
import { AlertTriangle, Trash2 } from "lucide-react";
import Link from "next/link";

const deleteSchema = yup.object({
  password: yup.string().required("Password is required"),
});

type DeleteFormInputs = yup.InferType<typeof deleteSchema>;

export default function AccountSettings() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<DeleteFormInputs>({
    resolver: yupResolver(deleteSchema),
    defaultValues: {
      password: "",
    },
  });

  const { handleSubmit, reset } = methods;

  const handleDeleteAccount = withSentryErrorClient(
    async (data: DeleteFormInputs) => {
      setDeleteLoading(true);
      setError(null);

      try {
        const result = await deleteUserAccount(data.password);

        if (!result.success) {
          setError(result.error || "Failed to delete account");
          setDeleteLoading(false);
        }
        // If successful, user will be redirected by the server action
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
        setDeleteLoading(false);
      }
    }
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Account Settings
        </h1>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete My Account
                </button>
              ) : (
                <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
                  <div className="mb-4">
                    <h4 className="font-bold text-red-900 mb-2">
                      ⚠️ Are you absolutely sure?
                    </h4>
                    <p className="text-sm text-red-800 mb-2">
                      This will permanently delete:
                    </p>
                    <ul className="text-sm text-red-800 list-disc list-inside space-y-1 mb-4">
                      <li>Your account and profile</li>
                      <li>All your uploaded documents</li>
                      <li>All document permissions and shares</li>
                      <li>Your session and login data</li>
                    </ul>
                    <p className="text-sm text-red-800 font-semibold">
                      Note: Audit logs will be retained for 7 years for
                      compliance purposes.
                    </p>
                  </div>

                  <FormProvider {...methods}>
                    <Form
                      onSubmit={handleSubmit(handleDeleteAccount)}
                      className="space-y-4"
                    >
                      <TextInput
                        name="password"
                        type="password"
                        label="Enter your password to confirm"
                        placeholder="Your password"
                        disabled={deleteLoading}
                      />

                      {error && (
                        <div className="p-3 bg-red-100 border border-red-300 rounded-md">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={deleteLoading}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <span className="flex items-center justify-center gap-2">
                            {deleteLoading ? (
                              "Deleting..."
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Yes, Delete My Account
                              </>
                            )}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            reset();
                            setError(null);
                          }}
                          disabled={deleteLoading}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </Form>
                  </FormProvider>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
