import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meraki — Films for the feeling",
  description: "Find a film with a story that feels close to yours.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Skip link for screen reader users */}
        <a href="#main-content" className="sr-only focus:not-sr-only p-2 bg-indigo-600 text-white">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
