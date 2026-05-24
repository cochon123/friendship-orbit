import type { Metadata } from "next";
import "./globals.css";

import { AppNavBar } from "@/components/layout/AppNavBar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Starfield } from "@/components/layout/Starfield";
import { AppDataProvider, ToastListener } from "@/components/providers/AppDataProvider";

export const metadata: Metadata = {
  title: "Friendship Orbit",
  description: "Visualise and track the shape of your friendships",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppDataProvider>
          <ToastListener />
          <Starfield />
          <div className="relative z-[1] mx-auto max-w-[1400px] px-6 py-6">
            <SiteHeader />
            <AppNavBar />
            <main>{children}</main>
          </div>
        </AppDataProvider>
      </body>
    </html>
  );
}
