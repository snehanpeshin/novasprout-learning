"use client";

import { ReactNode, useState } from "react";

type ProductKey = "tutoring_session" | "monthly_subscription";

type CheckoutButtonProps = {
  children: ReactNode;
  className?: string;
  productKey: ProductKey;
};

export default function CheckoutButton({ children, className, productKey }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        body: JSON.stringify({ productKey }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      const data = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }

      window.gtag?.("event", "stripe_checkout_started", {
        event_category: "payment",
        event_label: productKey
      });
      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not start checkout.");
      setIsLoading(false);
    }
  }

  return (
    <div className="checkout-control">
      <button className={className} disabled={isLoading} onClick={startCheckout} type="button">
        {isLoading ? "Opening checkout..." : children}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
