import crypto from "crypto";

export type CheckoutProductKey = "tutoring_session" | "monthly_subscription" | "ai_lesson" | "ai_subscription";

type CheckoutConfig = {
  dbaName: string;
  mode: "payment" | "subscription";
  priceId?: string;
  productName: string;
};

export function getCheckoutConfig(productKey: CheckoutProductKey): CheckoutConfig {
  const configs: Record<CheckoutProductKey, CheckoutConfig> = {
    ai_lesson: { dbaName: "NovaSprout Learning", mode: "payment", priceId: process.env.STRIPE_NOVASPROUT_AI_LESSON_PRICE_ID, productName: "NovaSprout One AI Lesson" },
    ai_subscription: { dbaName: "NovaSprout Learning", mode: "subscription", priceId: process.env.STRIPE_NOVASPROUT_AI_MONTHLY_PRICE_ID, productName: "NovaSprout Monthly AI Tutor" },
    tutoring_session: {
      dbaName: "NovaSprout Learning",
      mode: "payment",
      priceId: process.env.STRIPE_NOVASPROUT_ONE_HOUR_TUTORING_PRICE_ID,
      productName: "NovaSprout Learning - 1 Hour Tutoring"
    },
    monthly_subscription: {
      dbaName: "NovaSprout Learning",
      mode: "subscription",
      priceId: process.env.STRIPE_NOVASPROUT_MONTHLY_PACKAGE_PRICE_ID,
      productName: "NovaSprout Learning - Monthly Tutoring Package"
    }
  };

  return configs[productKey];
}

export async function createCheckoutSession({
  origin,
  productKey,
  browserNonce
}: {
  origin: string;
  productKey: CheckoutProductKey;
  browserNonce?: string;
}) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const config = getCheckoutConfig(productKey);

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!config.priceId) {
    throw new Error(`Missing Stripe price ID for ${productKey}`);
  }

  const isAi = productKey === "ai_lesson" || productKey === "ai_subscription";
  const body = new URLSearchParams({
    mode: config.mode,
    success_url: isAi ? `${origin}/ai-lesson-generator?checkout_session_id={CHECKOUT_SESSION_ID}` : `${origin}/pricing?checkout=success`,
    cancel_url: isAi ? `${origin}/ai-lesson-generator?checkout=cancelled` : `${origin}/pricing?checkout=cancelled`,
    "line_items[0][price]": config.priceId,
    "line_items[0][quantity]": "1",
    "metadata[dba_name]": config.dbaName,
    "metadata[product_name]": config.productName,
    "custom_text[submit][message]": `${config.dbaName} is a brand of Karigari Home LLC.`,
    allow_promotion_codes: isAi ? "false" : "true"
  });

  body.set("metadata[product_key]", productKey);
  if (browserNonce) body.set("metadata[browser_nonce]", browserNonce);
  if (isAi) body.set("payment_method_types[0]", "card");
  if (config.mode === "payment") {
    body.set("customer_creation", "always");
    body.set("payment_intent_data[metadata][dba_name]", config.dbaName);
    body.set("payment_intent_data[metadata][product_name]", config.productName);
  } else {
    body.set("subscription_data[metadata][dba_name]", config.dbaName);
    body.set("subscription_data[metadata][product_name]", config.productName);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    body,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "POST", signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stripe checkout failed: ${errorText}`);
  }

  return response.json() as Promise<{ id: string; url: string }>;
}

export function verifyStripeSignature({
  payload,
  secret,
  signatureHeader
}: {
  payload: string;
  secret: string;
  signatureHeader: string | null;
}) {
  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(",").map(part => part.split("=", 2));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const digest = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest();
  return parts.filter(([key]) => key === "v1").some(([, value]) => {
    if (!/^[a-f0-9]{64}$/i.test(value || "")) return false;
    const actual = Buffer.from(value, "hex");
    return actual.length === digest.length && crypto.timingSafeEqual(actual, digest);
  });
}
