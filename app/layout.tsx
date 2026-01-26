import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, Outfit, Inter } from "next/font/google";
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

const outfit = Outfit({
  subsets: ["latin"],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800']
});

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600']
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
      <body className={`${dmSans.variable} ${dmSerif.variable} ${outfit.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
