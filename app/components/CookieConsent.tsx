"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const consentStorageKey = "novasprout_cookie_consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function updateGoogleConsent(granted: boolean) {
  window.gtag?.("consent", "update", {
    ad_personalization: granted ? "granted" : "denied",
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    analytics_storage: granted ? "granted" : "denied"
  });
}

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChoice, setHasChoice] = useState(false);

  useEffect(() => {
    try {
      const savedChoice = window.localStorage.getItem(consentStorageKey);
      setHasChoice(savedChoice === "accepted" || savedChoice === "declined");
      setIsOpen(savedChoice !== "accepted" && savedChoice !== "declined");
    } catch {
      setIsOpen(true);
    }
  }, []);

  function saveChoice(granted: boolean) {
    try {
      window.localStorage.setItem(consentStorageKey, granted ? "accepted" : "declined");
    } catch {
      // Consent still applies for this page even if storage is unavailable.
    }
    updateGoogleConsent(granted);
    setHasChoice(true);
    setIsOpen(false);
  }

  return (
    <>
      {isOpen ? (
        <aside aria-labelledby="cookie-consent-title" className="cookie-consent" role="dialog">
          <div>
            <h2 id="cookie-consent-title">Cookie choices</h2>
            <p>
              NovaSprout uses optional Google Ads cookies to measure website activity and advertising.
              You can accept or decline them. <a href="/privacy">Privacy Policy</a>
            </p>
          </div>
          <div className="cookie-consent-actions">
            <button className="button secondary" onClick={() => saveChoice(false)} type="button">
              Decline
            </button>
            <button className="button primary" onClick={() => saveChoice(true)} type="button">
              Accept cookies
            </button>
          </div>
        </aside>
      ) : null}
      {hasChoice && !isOpen ? (
        <button className="cookie-settings" onClick={() => setIsOpen(true)} type="button">
          <Cookie aria-hidden="true" size={16} />
          Cookie settings
        </button>
      ) : null}
    </>
  );
}
