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
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return { serviceRoleKey, url: url.replace(/\/$/, "") };
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const { serviceRoleKey, url } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${body}`);
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
