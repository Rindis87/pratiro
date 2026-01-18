import type { Metadata } from "next";
import { DM_Sans, Fredoka } from "next/font/google";
import "./globals.css"; 

const dmSans = DM_Sans({ subsets: ["latin"], variable: '--font-dm-sans' });
const fredoka = Fredoka({ subsets: ["latin"], variable: '--font-fredoka' });

export const metadata: Metadata = {
  title: "Pratiro",
  description: "Din treningspartner for foreldrerollen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className={`${dmSans.variable} ${fredoka.variable} font-sans antialiased bg-teal-50`}>
        {children}
      </body>
    </html>
  );
}