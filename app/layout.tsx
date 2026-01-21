import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700']
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: '--font-dm-serif',
  weight: '400'
});

export const metadata: Metadata = {
  title: "Pratiro",
  description: "Øv på livets viktige samtaler – trygt og i ditt eget tempo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className={`${dmSans.variable} ${dmSerif.variable} font-sans antialiased bg-mist`}>
        {children}
      </body>
    </html>
  );
}
