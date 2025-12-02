import { redirect } from "next/navigation";
import { getCurrentUserId } from "../../../actions/auth";
import { checkMFAStatus } from "../../../actions/mfa";
import SecuritySettings from "./SecuritySettings";

export default async function SecuritySettingsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const { enabled: mfaEnabled } = await checkMFAStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Security Settings
        </h1>
        <SecuritySettings initialMFAEnabled={mfaEnabled} />
      </div>
    </div>
  );
}
