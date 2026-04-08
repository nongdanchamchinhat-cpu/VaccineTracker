import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Kobe Tracker",
  description:
    "Ứng dụng quản lý lịch tiêm chủng cho phụ huynh Việt Nam với OTP email, lịch mẫu và nhắc lịch production-ready.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
