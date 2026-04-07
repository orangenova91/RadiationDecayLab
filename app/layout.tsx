import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "방사성 반감기 교육 앱",
  description: "팀별 동전 실험 데이터를 통합해 대수의 법칙을 시각화합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-8">
            <Link href="/" className="text-lg font-semibold text-zinc-900">
              방사성 동위 원소 붕괴 실험실
            </Link>
            <p className="text-sm text-zinc-500">실시간 협업 실험 플랫폼</p>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-200 bg-white/90 px-4 py-5 text-xs md:px-8">
          <div className="mx-auto grid w-full max-w-7xl gap-4 text-zinc-600 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-800">방사성 동위 원소 붕괴 실험실</p>
                <p className="text-xs text-zinc-500">버전: v1.0.3 (최종 업데이트: 2026-04-07)</p>
              </div>
              <p>개발자: 언양고등학교 (Eonyang High School) · 교사 박주현</p>
            </div>

            <div className="grid gap-1 text-zinc-500 md:justify-items-end">
              <p>라이선스: CC BY-NC 4.0</p>
              <p>
                문의:{" "}
                <a href="mailto:orangenova91@gmail.com" className="underline underline-offset-2">
                  orangenova91@gmail.com
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
