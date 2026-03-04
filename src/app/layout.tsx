import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
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
    <html lang="en" className="dark">
      <body
        className="antialiased text-foreground min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('/assets/Mirage_HighResKeyArt.png')" }}
      >
        <div className="min-h-screen bg-black/60">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
