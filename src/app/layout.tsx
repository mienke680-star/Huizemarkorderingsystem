import type { Metadata } from "next";
import { Jost, Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { MotionSettingsProvider } from "@/components/providers/motion-provider";
import { Toaster } from "sonner";

const display = Jost({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Huizemark Agent Ordering Hub",
  description: "Order. Approve. Track. Deliver. — Huizemark North Coast internal ordering platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-navy-700">
        <AuthSessionProvider>
          <MotionSettingsProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              toastOptions={{
                style: {
                  fontFamily: "var(--font-body)",
                  borderRadius: "14px",
                },
              }}
            />
          </MotionSettingsProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
