import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { FeedbackModalWrapper } from "@/components/FeedbackModalWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "English Agent - Learn & Chat in English",
  description: "Your private English tutor powered by AI",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <ErrorBoundary>
          <Providers>
            <div className="app-background h-full">
              <div className="app-overlay h-full">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <header className="flex-shrink-0">
                    {/* TopBar will be here */}
                  </header>
                  
                  {/* Main content with single scroll owner */}
                  <main className="flex-1 overflow-y-auto">
                    {children}
                  </main>
                  
                  {/* Footer */}
                  <footer className="flex-shrink-0">
                    {/* Footer content if needed */}
                  </footer>
                </div>
              </div>
            </div>
          </Providers>
        </ErrorBoundary>
        <FeedbackModalWrapper />
        <Toaster />
      </body>
    </html>
  );
}
