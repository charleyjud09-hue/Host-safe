import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { changePassword } from "@/app/account/actions";
import AccountForm from "@/components/AccountForm";
import AccountPage from "@/components/AccountPage";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Change password | Letnook",
};

export default async function ChangePasswordPage() {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  return (
    <AccountPage title="Change password">
      <AccountForm
        action={changePassword}
        submitLabel="Change password"
        fields={[
          {
            name: "current_password",
            label: "Current password",
            type: "password",
            autoComplete: "current-password",
          },
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
            hint: "At least 8 characters, including an uppercase letter, a lowercase letter, a number and a symbol.",
          },
          {
            name: "confirm_password",
            label: "Confirm new password",
            type: "password",
            autoComplete: "new-password",
          },
        ]}
      />
    </AccountPage>
  );
}
