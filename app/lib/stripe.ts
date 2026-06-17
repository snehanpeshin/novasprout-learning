import crypto from "crypto";

export type CheckoutProductKey = "tutoring_session" | "monthly_subscription";

type CheckoutConfig = {
  dbaName: string;
  mode: "payment" | "subscription";
  priceId?: string;
  productName: string;
};

export function getCheckoutConfig(productKey: CheckoutProductKey): CheckoutConfig {
  const configs: Record<CheckoutProductKey, CheckoutConfig> = {
    tutoring_session: {
      dbaName: "NovaSprout Learning",
      mode: "payment",
      priceId: process.env.STRIPE_NOVASPROUT_TUTORING_PRICE_ID,
      productName: "NovaSprout Learning tutoring session"
    },
    monthly_subscription: {
      dbaName: "NovaSprout Learning",
      mode: "subscription",
      priceId: process.env.STRIPE_NOVASPROUT_MONTHLY_PRICE_ID,
      productName: "NovaSprout Learning monthly subscription"
    }
  };

  return configs[productKey];
}

export async function createCheckoutSession({
  origin,
  productKey
}: {
  origin: string;
  productKey: CheckoutProductKey;
}) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const config = getCheckoutConfig(productKey);

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!config.priceId) {
    throw new Error(`Missing Stripe price ID for ${productKey}`);
  }

  const body = new URLSearchParams({
    mode: config.mode,
    success_url: `${origin}/pricing?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    "line_items[0][price]": config.priceId,
    "line_items[0][quantity]": "1",
    "metadata[dba_name]": config.dbaName,
    "metadata[product_name]": config.productName,
    "custom_text[submit][message]": `${config.dbaName} is a brand of Karigari Home LLC.`,
    allow_promotion_codes: "true"
  });

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
    method: "POST"
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

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const expectedSignature = parts.v1;

  if (!timestamp || !expectedSignature) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const digest = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  const expected = Buffer.from(expectedSignature, "hex");
  const actual = Buffer.from(digest, "hex");

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
