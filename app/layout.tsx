import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GritGrid Workbench",
  description: "Internal employee workbench for GritGrid Technologies.",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
