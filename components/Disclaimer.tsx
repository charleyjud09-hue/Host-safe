export default function Disclaimer() {
  return (
    <section id="limitations" className="bg-slate-100">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-3xl font-semibold text-navy">
          What Letnook doesn&apos;t do
        </h2>
        <p className="mt-3 max-w-2xl text-slate-700">
          Letnook is an organisational tool. To be clear about its limits:
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            "It doesn’t give legal, safety or compliance advice.",
            "It doesn’t inspect, check, certify or approve any property.",
            "It doesn’t connect to, or manage bookings on, Airbnb, Booking.com, Vrbo or any other platform.",
            "Reminders come only from the dates you enter, and won’t cover every requirement or deadline.",
            "You remain responsible for your property, your guests’ safety and your legal obligations.",
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
