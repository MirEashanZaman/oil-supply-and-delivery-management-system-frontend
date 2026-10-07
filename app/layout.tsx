import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oil Supply & Delivery Management System",
  description: "Oil Supply & Delivery Management System - Enterprise Fuel Logistics & Distribution Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PetroSupply",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0F2747",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full w-full flex flex-col items-center overflow-x-hidden bg-[#F5F7FA] text-[#1E293B] px-2.5 py-3 sm:px-6 sm:py-6">{children}</body>
    </html>
  );
}
