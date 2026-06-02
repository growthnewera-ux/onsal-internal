import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "온살팀 대시보드",
  description: "온살팀 매출 & 업무 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
