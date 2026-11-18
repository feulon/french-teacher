import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { display, hand, ipa, sans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Francês", template: "%s · Francês" },
  description: "Aprenda francês do zero, 20 minutos por dia.",
  applicationName: "Francês",
  appleWebApp: { capable: true, title: "Francês", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6ea" },
    { media: "(prefers-color-scheme: dark)", color: "#11172a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${hand.variable} ${ipa.variable}`}>
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
