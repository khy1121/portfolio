import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "김헌영 — Frontend Engineer",
  description:
    "내가 먼저 쓰는 제품을 만들고, 왜 그렇게 만들었는지 설명할 수 있는 코드를 짭니다. Next.js·React 서비스 5개 배포, 실운영 2건.",
  openGraph: {
    title: "김헌영 — Frontend Engineer",
    description: "내가 먼저 쓰는 제품을 만드는 프론트엔드 개발자",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${syne.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
