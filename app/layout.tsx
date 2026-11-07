import type { Metadata } from "next";
import "./globals.css";
import Provider from "./components/Provider";
import Shell from "./components/Shell";
export const metadata: Metadata = {
  title: { default: "FASTINPUT CTF Writeups", template: "%s | FASTINPUT" },
  description: "CTF 문제 풀이 및 보안 학습 아카이브",
  openGraph: {
    title: "FASTINPUT CTF Writeups",
    description: "CTF 문제 풀이 및 보안 학습 아카이브",
    locale: "ko_KR",
    type: "website",
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Provider>
          <Shell>{children}</Shell>
        </Provider>
      </body>
    </html>
  );
}
