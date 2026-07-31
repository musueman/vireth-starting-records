import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "비레스 시작상황별 기록",
  description: "비레스의 일곱 시작상황과 관련 기록을 읽는 공개 서고",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
