import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { deleteAccount } from "@/app/account/actions";
import AccountForm from "@/components/AccountForm";
import AccountPage from "@/components/AccountPage";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Delete your account | Letnook",
};

export default async function DeleteAccountPage() {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  return (
    <AccountPage
      title="Delete your account"
      intro={
        <div className="rounded-xl bg-red-50 p-4 text-red-900 ring-1 ring-red-200">
          <p className="font-medium">This permanently deletes:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>your account and sign-in details</li>
            <li>every property on your account</li>
            <li>
              all records, actions, maintenance issues, calendar entries and
              property checks
            </li>
            <li>every file and photo you have uploaded</li>
          </ul>
          <p className="mt-3 text-sm">
            This can’t be undone. If you want to keep any documents, download
            them before you continue.
          </p>
        </div>
      }
    >
      <AccountForm
        action={deleteAccount}
        submitLabel="Permanently delete my account"
        danger
        fields={[
          {
            name: "confirm_text",
            label: "Type DELETE to confirm",
            type: "text",
            autoComplete: "off",
          },
          {
            name: "current_password",
            label: "Current password",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
      />
    </AccountPage>
  );
}
