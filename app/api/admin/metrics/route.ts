import { NextResponse } from "next/server";
import { getPayments, getSubscriptions } from "../../../lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const expectedToken = process.env.ADMIN_DASHBOARD_TOKEN;
  const providedToken = request.headers.get("x-admin-token");

  if (!expectedToken || providedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [payments, subscriptions] = await Promise.all([getPayments(), getSubscriptions()]);
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

  return NextResponse.json({
    activeSubscriptions,
    customers,
    payments,
    revenueByDba,
    revenueByMonth,
    totalRevenue
  });
}
