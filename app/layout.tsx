import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meraki — Films for the feeling",
  description: "Find a film with a story that feels close to yours.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
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
