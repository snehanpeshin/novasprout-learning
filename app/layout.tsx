import type { Metadata } from "next";
import CookieConsent from "./components/CookieConsent";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.novasproutlearning.com"),
  title: "Online Math, Science and Coding Tutoring | NovaSprout Learning",
  description:
    "Personalized online tutoring in math, science, coding, data skills, and study support. Start with a free introductory session."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'analytics_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'wait_for_update': 500
              });
              try {
                if (window.localStorage.getItem('novasprout_cookie_consent') === 'accepted') {
                  gtag('consent', 'update', {
                    'ad_storage': 'granted',
                    'analytics_storage': 'granted',
                    'ad_user_data': 'granted',
                    'ad_personalization': 'granted'
                  });
                }
              } catch (error) {}
              gtag('js', new Date());
              gtag('config', 'AW-18335791503');
            `
          }}
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18335791503" />
      </head>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
