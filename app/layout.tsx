import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "NovaSprout Learning | Online Tutoring",
  description:
    "Personalized online tutoring for math, science, coding, data skills, reading, writing, and study confidence."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18239515056" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18239515056');
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
