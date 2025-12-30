import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Illumenate Customer Portal",
  description: "Customer portal for managing projects and services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
