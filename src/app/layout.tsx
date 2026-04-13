import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Family Vaccine Tracker",
  description:
    "Ứng dụng quản lý lịch tiêm chủng cho cả gia đình với lịch mẫu, reminder linh hoạt, export lịch và theo dõi các mũi quá hạn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
