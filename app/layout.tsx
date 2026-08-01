import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "비레스 5083 이야기 서고",
  description: "내 시작 장면과 이어지는 편지, 장부, 공문과 사건 기록을 읽는 비레스 5083 이야기 서고",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
