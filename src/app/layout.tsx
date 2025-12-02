import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generative Studio",
  description: "Create compositions from simple shapes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
