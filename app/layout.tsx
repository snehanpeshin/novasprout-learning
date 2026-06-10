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
      <body>{children}</body>
    </html>
  );
}
