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
  revenueByDba: Record<string, number>;
  revenueByMonth: Record<string, number>;
  totalRevenue: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency"
  }).format(value);
}

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
        headers: { "x-admin-token": token }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load dashboard.");
      }

      setMetrics(data as Metrics);
    } catch (dashboardError) {
      setError(dashboardError instanceof Error ? dashboardError.message : "Could not load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="policy-hero">
        <a className="brand policy-brand" href="/" aria-label="NovaSprout Learning home">
          <span className="brand-mark">N</span>
          <span>NovaSprout Learning</span>
        </a>
        <p className="eyebrow">Admin</p>
        <h1>Revenue dashboard</h1>
        <p>Enter the admin token to load Stripe payment and subscription metrics from the database.</p>
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
          <div className="metric-grid">
            <article>
              <span>Total revenue</span>
              <strong>{formatCurrency(metrics.totalRevenue)}</strong>
            </article>
            <article>
              <span>Active subscriptions</span>
              <strong>{metrics.activeSubscriptions.length}</strong>
            </article>
            <article>
              <span>Customers</span>
              <strong>{metrics.customers.length}</strong>
            </article>
          </div>

          <div className="admin-grid">
            <article>
              <h2>Revenue by DBA</h2>
              {Object.entries(metrics.revenueByDba).map(([dba, value]) => (
                <p className="report-row" key={dba}>
                  <span>{dba}</span>
                  <strong>{formatCurrency(value)}</strong>
                </p>
              ))}
            </article>
            <article>
              <h2>Revenue by month</h2>
              {Object.entries(metrics.revenueByMonth).map(([month, value]) => (
                <p className="report-row" key={month}>
                  <span>{month}</span>
                  <strong>{formatCurrency(value)}</strong>
                </p>
              ))}
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
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
