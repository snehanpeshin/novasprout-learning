"use client";

import { ReactNode } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type TrackedLinkProps = {
  children: ReactNode;
  className?: string;
  eventName: string;
  href: string;
  target?: string;
};

export default function TrackedLink({
  children,
  className,
  eventName,
  href,
  target
}: TrackedLinkProps) {
  function handleClick() {
    window.gtag?.("event", eventName, {
      event_category: "lead",
      event_label: href
    });
  }

  return (
    <a
      className={className}
      href={href}
      onClick={handleClick}
      rel={target === "_blank" ? "noreferrer" : undefined}
      target={target}
    >
      {children}
    </a>
  );
}
