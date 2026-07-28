import { NextResponse } from "next/server";
import { getPayments, getSubscriptions } from "../../../lib/supabase";

export const runtime = "nodejs";

type PlatformStatus = {
  aiAccess: "active" | "setup_required";
  lessonModes: "active";
  paymentReporting: "active" | "setup_required";
  studentRecords: "planned";
};

function getPlatformStatus(paymentDatabaseConnected: boolean): PlatformStatus {
  const aiAccessConfigured = Boolean(
    process.env.AI_LESSON_ACCESS_TOKEN?.trim() ||
      process.env.AI_LESSON_ALLOWED_EMAILS?.trim()
  );
  const stripeConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim()
  );

  return {
    aiAccess: aiAccessConfigured ? "active" : "setup_required",
    lessonModes: "active",
    paymentReporting:
      stripeConfigured && paymentDatabaseConnected ? "active" : "setup_required",
    studentRecords: "planned"
  };
}

function adminJson(body: object, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...(init?.headers ?? {})
    }
  });
}

export async function GET(request: Request) {
  const expectedToken = process.env.ADMIN_DASHBOARD_TOKEN?.trim();
  const providedToken = request.headers.get("x-admin-token")?.trim();

  if (!expectedToken || providedToken !== expectedToken) {
    return adminJson({ error: "Unauthorized" }, { status: 401 });
  }

  let payments;
  let subscriptions;

  try {
    [payments, subscriptions] = await Promise.all([getPayments(), getSubscriptions()]);
  } catch (error) {
    const setupWarning =
      error instanceof Error ? error.message : "Could not connect to the payment database.";

    return adminJson({
      activeSubscriptions: [],
      customers: [],
      payments: [],
      platformStatus: getPlatformStatus(false),
      revenueByDba: {},
      revenueByMonth: {},
      setupWarning,
      totalRevenue: 0
    });
  }

  const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const revenueByDba = payments.reduce<Record<string, number>>((acc, payment) => {
    acc[payment.dba_name] = (acc[payment.dba_name] ?? 0) + Number(payment.amount);
    return acc;
  }, {});
  const revenueByMonth = payments.reduce<Record<string, number>>((acc, payment) => {
    const month = payment.payment_date.slice(0, 7);
    acc[month] = (acc[month] ?? 0) + Number(payment.amount);
    return acc;
  }, {});
  const activeSubscriptions = subscriptions.filter((subscription) =>
    ["active", "trialing"].includes(subscription.status)
  );
  const customers = Array.from(
    new Map(
      payments.map((payment) => [
        payment.customer_email ?? payment.stripe_customer_id ?? payment.stripe_session_id,
        {
          customer_email: payment.customer_email,
          customer_name: payment.customer_name,
          dba_name: payment.dba_name,
          stripe_customer_id: payment.stripe_customer_id,
          total_paid: payments
            .filter((item) => item.customer_email === payment.customer_email)
            .reduce((sum, item) => sum + Number(item.amount), 0)
        }
      ])
    ).values()
  );

  return adminJson({
    activeSubscriptions,
    customers,
    payments,
    platformStatus: getPlatformStatus(true),
    revenueByDba,
    revenueByMonth,
    totalRevenue
  });
}
