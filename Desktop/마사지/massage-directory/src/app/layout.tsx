import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: '힐링찾기 - 전국 제휴업소 디렉토리',
    template: '%s | 힐링찾기',
  },
  description:
    '전국 마사지·힐링 업소를 지역별·테마별로 한눈에 찾아보세요. 스웨디시, 아로마, 타이, 스포츠 등 다양한 테마의 검증된 제휴업소를 소개합니다.',
  keywords: ['마사지', '힐링', '스웨디시', '아로마', '타이마사지'],
  robots: { index: true, follow: true },
  openGraph: { type: 'website', locale: 'ko_KR', siteName: '힐링찾기' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-gray-100 text-gray-900 antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
