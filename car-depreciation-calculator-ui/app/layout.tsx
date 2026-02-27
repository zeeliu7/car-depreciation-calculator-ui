import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Depreciation Calculator",
  description: "Predict your car's future value over the next 5 years",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
