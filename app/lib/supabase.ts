type PaymentRecord = {
  amount: number;
  currency: string;
  customer_email: string | null;
  customer_name: string | null;
  dba_name: string;
  payment_date: string;
  product_name: string;
  stripe_customer_id: string | null;
  stripe_session_id: string;
};

type SubscriptionRecord = {
  current_period_end: string | null;
  current_period_start: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  dba_name: string;
  product_name: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Amplify environment variables, then redeploy."
    );
  }

  if (url.includes("your-project") || serviceRoleKey === "REPLACE_ME") {
    throw new Error(
      "Replace the example Supabase values in Amplify with credentials from your Supabase project, then redeploy."
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL is not a valid URL. Correct it in Amplify, then redeploy.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("SUPABASE_URL must start with https:// (or http:// for local development).");
  }

  return { serviceRoleKey, url: url.replace(/\/$/, "") };
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const { serviceRoleKey, url } = getSupabaseConfig();
  let response: Response;

  try {
    response = await fetch(`${url}/rest/v1/${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });
  } catch {
    throw new Error(
      "Could not reach the payment database. Check SUPABASE_URL in Amplify and confirm the Supabase project is active."
    );
  }

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Supabase rejected the server credentials. Check SUPABASE_SERVICE_ROLE_KEY in Amplify and redeploy."
      );
    }
    if (response.status === 404) {
      throw new Error(
        "The payment tables are missing. Run docs/database-schema.sql in the Supabase SQL Editor."
      );
    }
    throw new Error(`The payment database returned error ${response.status}. Check the Supabase logs.`);
  }

  return response;
}

export async function savePayment(record: PaymentRecord) {
  await supabaseFetch("stripe_payments", {
    body: JSON.stringify(record),
    headers: { Prefer: "return=minimal" },
    method: "POST"
  });
}

export async function upsertSubscription(record: SubscriptionRecord) {
  await supabaseFetch("stripe_subscriptions?on_conflict=stripe_subscription_id", {
    body: JSON.stringify(record),
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    method: "POST"
  });
}

export async function getPayments() {
  const response = await supabaseFetch(
    "stripe_payments?select=customer_name,customer_email,stripe_customer_id,stripe_session_id,amount,currency,dba_name,product_name,payment_date&order=payment_date.desc"
  );

  return response.json() as Promise<PaymentRecord[]>;
}

export async function getSubscriptions() {
  const response = await supabaseFetch(
    "stripe_subscriptions?select=stripe_subscription_id,stripe_customer_id,customer_name,customer_email,status,dba_name,product_name,current_period_start,current_period_end,updated_at&order=updated_at.desc"
  );

  return response.json() as Promise<SubscriptionRecord[]>;
}

export async function claimAppleLessonPurchase({
  productId,
  transactionId
}: {
  productId: string;
  transactionId: string;
}) {
  const activeUntil = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  const response = await supabaseFetch("apple_iap_lesson_uses", {
    body: JSON.stringify({
      active_until: activeUntil,
      product_id: productId,
      transaction_id: transactionId
    }),
    headers: { Prefer: "return=minimal" },
    method: "POST"
  }).catch((error) => {
    if (error instanceof Error && error.message.includes("409")) {
      return null;
    }
    throw error;
  });

  return response !== null;
}

export async function hasActiveAppleLessonPurchase(transactionId: string) {
  const response = await supabaseFetch(
    `apple_iap_lesson_uses?select=active_until&transaction_id=eq.${encodeURIComponent(transactionId)}&limit=1`
  );
  const rows = (await response.json()) as Array<{ active_until: string }>;
  return rows.some((row) => new Date(row.active_until).getTime() > Date.now());
}

export async function claimAppleSubscriptionLesson({
  expiresDate,
  productId,
  transactionId
}: {
  expiresDate: number;
  productId: string;
  transactionId: string;
}) {
  const response = await supabaseFetch("rpc/claim_apple_subscription_lesson", {
    body: JSON.stringify({
      p_expires_at: new Date(expiresDate).toISOString(),
      p_lesson_limit: 20,
      p_product_id: productId,
      p_transaction_id: transactionId
    }),
    method: "POST"
  });
  return (await response.json()) === true;
}
