import type { Metadata } from "next";
import Script from "next/script";
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
  title: "ورود به سیستم",
  description: "سیستم ورود و ثبت نام",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="set-theme" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');if(t){document.documentElement.setAttribute('data-theme', t);}else{document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
