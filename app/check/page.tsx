import type { Metadata } from "next";
import EligibilityChecker from "@/components/EligibilityChecker";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Check if your property is suitable | HostSafe",
  description:
    "Six short questions to see whether HostSafe is designed for your kind of property.",
};

export default async function CheckPage() {
  let signedIn = false;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">
            Check if your property is suitable
          </h1>
          <p className="mt-3 mb-8 text-slate-700">
            Six quick questions. This is not an assessment. It only helps you
            see whether HostSafe is designed for a property like yours.
          </p>
          <EligibilityChecker
            accountsEnabled={isSupabaseConfigured}
            signedIn={signedIn}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
