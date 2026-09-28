export default function Disclaimer() {
  return (
    <section id="limitations" className="bg-slate-100">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-3xl font-semibold text-navy">
          What HostSafe is not
        </h2>
        <p className="mt-3 max-w-2xl text-slate-700">
          We want to be clear about the limits, so you know what to expect.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            "HostSafe is not a fire-risk assessor and does not carry out fire-risk assessments.",
            "It does not give legal advice, and it does not certify or approve any property.",
            "It cannot guarantee that a property is safe or meets any legal requirement.",
            "Everything it produces is based on information you provide, and you remain responsible for checking it.",
            "If your property is complex or outside its intended scope, you should speak with a competent fire-risk assessor.",
          ].map((t) => (
            <li
              key={t}
              className="rounded-xl border border-slate-200 bg-white p-5 text-slate-800 sm:last:odd:col-span-2"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
