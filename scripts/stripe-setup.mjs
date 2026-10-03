// Creates Letnook's two products and eight prices in Stripe.
// Safe to re-run: anything that already exists (by lookup key) is skipped.
//
//   node --env-file=.env.local scripts/stripe-setup.mjs
//
// Refuses to run with a live key unless --live is passed, so it can't touch
// real money by accident. Prices must match lib/membership.ts.

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set (run with --env-file=.env.local).");
  process.exit(1);
}
if (key.startsWith("sk_live_") && !process.argv.includes("--live")) {
  console.error("That's a LIVE key. Re-run with --live only when you mean to set up the live account.");
  process.exit(1);
}

const stripe = new Stripe(key);

// Pence. Yearly = 11 × monthly (one month free).
const PLANS = {
  membership: {
    name: "Letnook Membership",
    description: "Up to 5 properties. 30-day free trial.",
    standard: { month: 1600, year: 17600 },
    founding: { month: 1200, year: 13200 },
  },
  premium: {
    name: "Letnook Premium",
    description: "Up to 25 properties. 30-day free trial.",
    standard: { month: 3500, year: 38500 },
    founding: { month: 2900, year: 31900 },
  },
};

for (const [planId, plan] of Object.entries(PLANS)) {
  // One product per plan, found again by its metadata.
  const existing = await stripe.products.search({
    query: `metadata['letnook_plan']:'${planId}'`,
  });
  const product =
    existing.data[0] ??
    (await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { letnook_plan: planId },
      statement_descriptor: "LETNOOK",
    }));
  console.log(`${existing.data[0] ? "Found" : "Created"} product ${plan.name}`);

  for (const tier of ["standard", "founding"]) {
    for (const interval of ["month", "year"]) {
      const lookupKey = `letnook_${planId}_${interval}_${tier}`;
      const found = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
      if (found.data[0]) {
        console.log(`  Found   ${lookupKey}`);
        continue;
      }
      await stripe.prices.create({
        product: product.id,
        currency: "gbp",
        unit_amount: plan[tier][interval],
        recurring: { interval },
        lookup_key: lookupKey,
        nickname: `${plan.name} ${interval}ly (${tier})`,
        metadata: { letnook_plan: planId, letnook_tier: tier },
      });
      console.log(`  Created ${lookupKey} £${(plan[tier][interval] / 100).toFixed(2)}`);
    }
  }
}
console.log("Done.");
