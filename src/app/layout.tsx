import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import TokenExpirationWarning from "./components/TokenExpirationWarning";
import TokenMonitoringInitializer from "./components/TokenMonitoringInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MVP Authentication System",
  description:
    "A simple, production-ready authentication system built with Next.js and Firebase",
  keywords: ["authentication", "nextjs", "firebase", "login", "signup"],
  authors: [{ name: "MVP Auth Team" }],
  creator: "MVP Auth",
  publisher: "MVP Auth",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    title: "MVP Authentication System",
    description:
      "A simple, production-ready authentication system built with Next.js and Firebase",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <TokenMonitoringInitializer />
            {children}
            <TokenExpirationWarning warningThresholdMinutes={60} />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
