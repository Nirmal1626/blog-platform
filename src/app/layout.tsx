import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlogVerse — Modern Blogging Platform",
  description: "A premium blogging platform built with Next.js and Supabase. Create, share, and discover amazing blog posts with AI-powered summaries.",
  keywords: ["blog", "blogging platform", "nextjs", "supabase", "ai summaries"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
