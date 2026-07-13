import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "수업로 AI | 체험학습 코디네이터",
  description:
    "교육과정, 지도, 일정, 안전 근거를 연결하는 교사용 계획 작업공간",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
