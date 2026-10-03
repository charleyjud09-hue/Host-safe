// Applies Letnook's Stripe account settings that can be set through the API:
//   - payment methods: cards (incl. Apple Pay, Google Pay, Link), PayPal and
//     Revolut Pay on; Klarna, Amazon Pay and other methods off
//   - customer portal: update card, see receipts; cancelling only at the end
//     of the period (Letnook's own cancel page is the main way to cancel)
//
//   node --env-file=.env.local scripts/stripe-configure.mjs          (show only)
//   node --env-file=.env.local scripts/stripe-configure.mjs --apply  (change)
//
// Refuses to run with a live key unless --live is passed.

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set (run with --env-file=.env.local).");
  process.exit(1);
}
if (key.startsWith("sk_live_") && !process.argv.includes("--live")) {
  console.error("That's a LIVE key. Re-run with --live only when you mean to change the live account.");
  process.exit(1);
}
const apply = process.argv.includes("--apply");
const stripe = new Stripe(key);

const WANTED_ON = ["card", "apple_pay", "google_pay", "link", "paypal", "revolut_pay"];

// 1. Payment methods (the default configuration used by checkout).
const { data: configs } = await stripe.paymentMethodConfigurations.list({ limit: 20 });
const config = configs.find((c) => c.is_default) ?? configs[0];
if (!config) {
  console.log("No payment method configuration found.");
} else {
  const changes = {};
  for (const [name, value] of Object.entries(config)) {
    if (!value || typeof value !== "object" || !("display_preference" in value)) continue;
    const isOn = value.display_preference.value === "on";
    const wantOn = WANTED_ON.includes(name);
    console.log(`${isOn ? "ON " : "off"}  ${name}${value.available === false ? " (not available)" : ""}`);
    // Unavailable methods must be activated in the dashboard first (e.g. PayPal).
    if (isOn !== wantOn && value.available !== false) {
      changes[name] = { display_preference: { preference: wantOn ? "on" : "off" } };
    }
  }
  console.log(`\nPayment method changes needed: ${Object.keys(changes).join(", ") || "none"}`);
  if (apply && Object.keys(changes).length) {
    await stripe.paymentMethodConfigurations.update(config.id, changes);
    console.log("Payment methods updated.");
  }
}

// 2. Customer portal.
const { data: portals } = await stripe.billingPortal.configurations.list({ limit: 10 });
const portal = portals.find((p) => p.is_default) ?? portals[0];
const portalFeatures = {
  payment_method_update: { enabled: true },
  invoice_history: { enabled: true },
  customer_update: { enabled: true, allowed_updates: ["email", "address"] },
  subscription_cancel: { enabled: true, mode: "at_period_end" },
};
if (portal) {
  console.log(
    `\nPortal: cancel ${portal.features.subscription_cancel.enabled ? `on (${portal.features.subscription_cancel.mode})` : "off"}, ` +
      `card update ${portal.features.payment_method_update.enabled ? "on" : "off"}, ` +
      `receipts ${portal.features.invoice_history.enabled ? "on" : "off"}`,
  );
}
if (apply) {
  if (portal) {
    await stripe.billingPortal.configurations.update(portal.id, { features: portalFeatures });
  } else {
    await stripe.billingPortal.configurations.create({ features: portalFeatures });
  }
  console.log("Portal updated: cancelling only at the end of the period.");
}
