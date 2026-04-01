import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Harness",
  description: "SNS統合管理プラットフォーム by No Side",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
