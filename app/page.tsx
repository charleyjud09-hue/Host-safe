import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    title: "Organise your information",
    body: "Put the details of your property and its fire-safety arrangements in one clear place, instead of scattered notes and emails.",
  },
  {
    title: "Keep evidence together",
    body: "Store documents, photos and records alongside each other so they are easy to find when you need them.",
  },
  {
    title: "Get gentle reminders",
    body: "Be nudged about the checks and tasks you have chosen to keep on top of.",
  },
  {
    title: "Create a draft action record",
    body: "Turn what you have told us into a structured draft you can review, edit and take further advice on.",
  },
];

export default async function Home() {
  let signedIn = false;
  let userEmail: string | null = null;
  let properties: { id: string; name: string }[] = [];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      signedIn = true;
      userEmail = userData.user.email ?? null;
      const { data } = await supabase
        .from("properties")
        .select("id, name")
        .order("created_at", { ascending: true });
      properties = data ?? [];
    }
  }

  if (signedIn) {
    const propertyCount = properties.length;
    const singleProperty = propertyCount === 1 ? properties[0] : null;

    return (
      <>
        <Header />
        <main className="flex-1">
          <section className="bg-navy text-white">
            <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
              <p className="inline-block rounded-full bg-white/10 px-3 py-1 text-sm text-teal-200">
                Welcome back
              </p>
              <h1 className="mt-6 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                Welcome back to HostSafe{userEmail ? `, ${userEmail}` : ""}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-200">
                Your property fire-safety information is organised here. Go
                to your dashboard to continue.
              </p>
              <div className="mt-8">
                <Link
                  href="/dashboard"
                  className="inline-block rounded-lg bg-teal-400 px-6 py-3 font-semibold text-navy hover:bg-teal-300"
                >
                  Go to my dashboard
                </Link>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-5 py-12">
            <div className="grid gap-4 sm:grid-cols-3">
              <Link
                href="/properties/new"
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-navy"
              >
                <h2 className="font-semibold text-navy">Add a property</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {propertyCount === 0
                    ? "Get started by adding your first property."
                    : "Add another property to your account."}
                </p>
              </Link>

              {singleProperty && (
                <Link
                  href={`/properties/${singleProperty.id}/check`}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-navy"
                >
                  <h2 className="font-semibold text-navy">
                    Take a property check
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Six quick questions for {singleProperty.name}.
                  </p>
                </Link>
              )}
              {propertyCount > 1 && (
                <Link
                  href="/dashboard"
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-navy"
                >
                  <h2 className="font-semibold text-navy">
                    Take a property check
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Choose a property on your dashboard to check.
                  </p>
                </Link>
              )}

              {propertyCount > 0 && (
                <Link
                  href="/dashboard"
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-navy"
                >
                  <h2 className="font-semibold text-navy">View evidence</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    See evidence records for your properties on your
                    dashboard.
                  </p>
                </Link>
              )}
            </div>

            <p className="mt-8 text-sm text-slate-600">
              HostSafe is an organisational and educational tool. It does not
              provide legal advice, fire-risk assessments, or compliance
              certification, and it does not confirm that a property is safe
              or legally compliant.
            </p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
            <p className="inline-block rounded-full bg-white/10 px-3 py-1 text-sm text-teal-200">
              Early access for self-catering hosts in England
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              A clearer starting point for holiday-let fire-safety paperwork
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-200">
              HostSafe helps owners of small, simple holiday lets organise
              their fire-safety information, keep evidence together and stay on
              top of reminders, in plain English.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/check"
                className="rounded-lg bg-teal-400 px-6 py-3 font-semibold text-navy hover:bg-teal-300"
              >
                Check if your property is suitable
              </Link>
              <a
                href="#limitations"
                className="text-slate-200 underline underline-offset-4 hover:text-white"
              >
                What HostSafe is not
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-3xl font-semibold text-navy">
            What HostSafe does
          </h2>
          <p className="mt-3 max-w-2xl text-slate-700">
            Fire-safety paperwork can feel confusing. HostSafe is an
            organisational and educational tool that helps you gather and keep
            track of the information you provide.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div
                  aria-hidden
                  className="mb-4 h-1.5 w-10 rounded-full bg-teal-500"
                />
                <h3 className="text-lg font-semibold text-navy">{f.title}</h3>
                <p className="mt-2 text-slate-700">{f.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-600">
            Some of these features are still being built. Today, the first step
            is the short suitability check.
          </p>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 className="text-3xl font-semibold text-navy">Who it is for</h2>
            <p className="mt-3 max-w-2xl text-slate-700">
              HostSafe is designed for owners of small, simple self-catering
              holiday lets in England, especially if you feel unsure where to
              start.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                "Two floors or fewer",
                "Up to 10 overnight guests",
                "A simple layout with a clear escape route",
              ].map((t) => (
                <li
                  key={t}
                  className="rounded-xl bg-slate-100 p-5 font-medium text-navy"
                >
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-2xl text-slate-700">
              Larger, more complex or unusual properties may need more tailored
              advice from a competent fire-risk assessor.
            </p>
          </div>
        </section>

        <Disclaimer />

        <section className="mx-auto max-w-5xl px-5 py-16 text-center">
          <h2 className="text-3xl font-semibold text-navy">
            See if HostSafe fits your property
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-700">
            It takes about a minute, and nothing you enter is saved or sent.
          </p>
          <Link
            href="/check"
            className="mt-6 inline-block rounded-lg bg-navy px-6 py-3 font-semibold text-white hover:bg-navy-light"
          >
            Check if your property is suitable
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
