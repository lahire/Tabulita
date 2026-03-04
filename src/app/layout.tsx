import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tabulita - PoE Private League Tracker",
  description: "Track wishlists and character progress for Path of Exile private leagues",
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
