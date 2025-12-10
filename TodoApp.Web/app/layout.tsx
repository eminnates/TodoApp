import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { PWAInstaller } from "@/components/pwa-installer";
import { OfflineIndicator } from "@/components/offline-indicator";

export const metadata: Metadata = {
  title: "Todo App - Vintage Task Manager",
  description: "A beautiful vintage-styled todo application with book animations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TodoApp",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#B5A495",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Niconne&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="application-name" content="TodoApp" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TodoApp" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <PWAInstaller />
        <OfflineIndicator />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
