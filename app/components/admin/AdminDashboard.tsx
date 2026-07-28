"use client";

import { useState } from "react";

type Metrics = {
  activeSubscriptions: Array<{
    dba_name: string;
    product_name: string;
    status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string;
  }>;
  customers: Array<{
    customer_email: string | null;
    customer_name: string | null;
    dba_name: string;
    stripe_customer_id: string | null;
    total_paid: number;
  }>;
  platformStatus: {
    aiAccess: PlatformState;
    lessonModes: PlatformState;
    paymentReporting: PlatformState;
    studentRecords: PlatformState;
  };
  revenueByDba: Record<string, number>;
  revenueByMonth: Record<string, number>;
  setupWarning?: string;
  totalRevenue: number;
};

type PlatformState = "active" | "planned" | "setup_required";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency"
  }).format(value);
}

const platformItems: Array<{
  key: keyof Metrics["platformStatus"];
  label: string;
}> = [
  { key: "aiAccess", label: "AI lesson access control" },
  { key: "lessonModes", label: "Visual lessons, custom plans, and timed exams" },
  { key: "paymentReporting", label: "Stripe payment and revenue reporting" },
  { key: "studentRecords", label: "Student profiles, saved lessons, and exam scores" }
];

const stateLabels: Record<PlatformState, string> = {
  active: "Active",
  planned: "Planned",
  setup_required: "Setup required"
};

export default function AdminDashboard() {
  const [token, setToken] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function loadMetrics() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/metrics", {
        cache: "no-store",
        headers: { "x-admin-token": token.trim() }
      });
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load dashboard.");
      }

      setMetrics(data as Metrics);
    } catch (dashboardError) {
      setError(
        dashboardError instanceof SyntaxError
          ? "The admin API returned an unreadable response. Please redeploy and try again."
          : dashboardError instanceof Error
            ? dashboardError.message
            : "Could not load dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="policy-hero">
        <a className="brand policy-brand" href="/" aria-label="NovaSprout Learning home">
          <img className="brand-logo" src="/novasprout-logo.png" alt="" />
          <span>NovaSprout Learning</span>
        </a>
        <p className="eyebrow">Admin</p>
        <h1>Admin console</h1>
        <p>Enter the admin token to load payment metrics and review the NovaSprout platform controls.</p>
        <div className="admin-login">
          <input
            onChange={(event) => setToken(event.target.value)}
            placeholder="Admin token"
            type="password"
            value={token}
          />
          <button className="button primary" disabled={!token || isLoading} onClick={loadMetrics} type="button">
            {isLoading ? "Loading..." : "Load dashboard"}
          </button>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      {metrics ? (
        <section className="admin-content">
          {metrics.setupWarning ? (
            <article className="admin-table setup-warning">
              <h2>Setup needed</h2>
              <p>
                The admin console is unlocked, but payment metrics are not connected yet:
                {" "}
                {metrics.setupWarning}
              </p>
              <ol className="setup-steps">
                <li>Create or open the NovaSprout Supabase project.</li>
                <li>Run <code>docs/database-schema.sql</code> in its SQL Editor.</li>
                <li>Add the real Supabase URL and service-role key in Amplify, then redeploy.</li>
              </ol>
            </article>
          ) : null}

          <div className="metric-grid">
            <article>
              <span>Total revenue</span>
              <strong className={metrics.setupWarning ? "metric-unavailable" : undefined}>
                {metrics.setupWarning ? "Not connected" : formatCurrency(metrics.totalRevenue)}
              </strong>
            </article>
            <article>
              <span>Active subscriptions</span>
              <strong className={metrics.setupWarning ? "metric-unavailable" : undefined}>
                {metrics.setupWarning ? "Not connected" : metrics.activeSubscriptions.length}
              </strong>
            </article>
            <article>
              <span>Customers</span>
              <strong className={metrics.setupWarning ? "metric-unavailable" : undefined}>
                {metrics.setupWarning ? "Not connected" : metrics.customers.length}
              </strong>
            </article>
          </div>

          <article className="admin-table">
            <h2>Learning platform controls</h2>
            <div>
              {platformItems.map((item) => {
                const state = metrics.platformStatus[item.key];
                return (
                <p className="report-row" key={item.key}>
                  <span>{item.label}</span>
                  <strong className={`admin-status admin-status-${state}`}>
                    {stateLabels[state]}
                  </strong>
                </p>
                );
              })}
            </div>
          </article>

          <div className="admin-grid">
            <article>
              <h2>Revenue by DBA</h2>
              {Object.entries(metrics.revenueByDba).map(([dba, value]) => (
                <p className="report-row" key={dba}>
                  <span>{dba}</span>
                  <strong>{formatCurrency(value)}</strong>
                </p>
              ))}
              {!metrics.setupWarning && Object.keys(metrics.revenueByDba).length === 0 ? (
                <p className="admin-empty">No completed payments yet.</p>
              ) : null}
              {metrics.setupWarning ? <p className="admin-empty">Connect the payment database to view this report.</p> : null}
            </article>
            <article>
              <h2>Revenue by month</h2>
              {Object.entries(metrics.revenueByMonth).map(([month, value]) => (
                <p className="report-row" key={month}>
                  <span>{month}</span>
                  <strong>{formatCurrency(value)}</strong>
                </p>
              ))}
              {!metrics.setupWarning && Object.keys(metrics.revenueByMonth).length === 0 ? (
                <p className="admin-empty">Monthly revenue will appear after the first completed payment.</p>
              ) : null}
              {metrics.setupWarning ? <p className="admin-empty">Connect the payment database to view this report.</p> : null}
            </article>
          </div>

          <article className="admin-table">
            <h2>Active subscriptions</h2>
            <div>
              {metrics.activeSubscriptions.map((subscription) => (
                <p className="report-row" key={subscription.stripe_subscription_id}>
                  <span>{subscription.product_name}</span>
                  <strong>{subscription.status}</strong>
                </p>
              ))}
              {!metrics.setupWarning && metrics.activeSubscriptions.length === 0 ? (
                <p className="admin-empty">No active subscriptions.</p>
              ) : null}
              {metrics.setupWarning ? <p className="admin-empty">Connect the payment database to view subscriptions.</p> : null}
            </div>
          </article>

          <article className="admin-table">
            <h2>Customer list</h2>
            <div>
              {metrics.customers.map((customer) => (
                <p className="report-row" key={customer.customer_email ?? customer.stripe_customer_id ?? customer.dba_name}>
                  <span>{customer.customer_name ?? customer.customer_email ?? "Unknown customer"}</span>
                  <strong>{formatCurrency(customer.total_paid)}</strong>
                </p>
              ))}
              {!metrics.setupWarning && metrics.customers.length === 0 ? (
                <p className="admin-empty">Customers will appear after the first completed payment.</p>
              ) : null}
              {metrics.setupWarning ? <p className="admin-empty">Connect the payment database to view customers.</p> : null}
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
