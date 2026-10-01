import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { changeEmail } from "@/app/account/actions";
import AccountForm from "@/components/AccountForm";
import AccountPage from "@/components/AccountPage";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Change email | Letnook",
};

export default async function ChangeEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { notice } = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  return (
    <AccountPage
      title="Change email address"
      intro={
        <>
          <p>
            You currently sign in with{" "}
            <span className="break-words font-medium">{userData.user.email}</span>.
          </p>
          <p className="mt-2">
            We will send a confirmation link to your new address. Nothing
            changes until you click it.
          </p>
          {notice === "link-failed" && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200"
            >
              That confirmation link did not work. It may have expired or
              already been used. Please start the change again below.
            </p>
          )}
        </>
      }
    >
      <AccountForm
        action={changeEmail}
        submitLabel="Send confirmation link"
        fields={[
          { name: "email", label: "New email address", type: "email", autoComplete: "email" },
          {
            name: "current_password",
            label: "Current password",
            type: "password",
            autoComplete: "current-password",
            hint: "To keep your account safe, confirm it’s you.",
          },
        ]}
      />
    </AccountPage>
  );
}
