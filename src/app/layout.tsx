import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next Drizzle Tailwind Auth",
  description: "Next.js app with Drizzle, Tailwind, and Google Auth",
};

import NavBar from "@/components/NavBar";
import SentryProvider from "@/components/SentryProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <NavBar />
        <SentryProvider>
          <Providers>{children}</Providers>
        </SentryProvider>
      </body>
    </html>
  );
}
