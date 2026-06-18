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
  title: "셀러메이트 파트너 프로그램 | 온라인 판매자를 위한 재택 부업의 정석",
  description:
    "셀러메이트 공식 파트너 프로그램 — 추천인 가입 보상 + 셀러메이트 수익 퍼센트 적립. 라이트, 프리미엄, 슈퍼 프리미엄 등급으로 시작하세요.",
  openGraph: {
    title: "셀러메이트 파트너 프로그램",
    description: "추천인 가입 보상 + 셀러메이트 수익 퍼센트 적립. 지금 파트너로 시작하세요.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-white text-[#0f172a]">
        {children}
      </body>
    </html>
  );
}
