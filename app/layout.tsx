import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { SessionProvider } from "@/app/context/SessionContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextMiner",
  description: "Sistema de gestión con autenticación",
  icons: {
    icon: [{ url: "/assets/viasentra3.png", type: "image/png" }],
    shortcut: ["/assets/viasentra3.png"],
    apple: [{ url: "/assets/viasentra3.png" }],
  },
};

// Forzar renderizado dinámico para que el Navbar siempre obtenga la sesión actual
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-green-100">
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
