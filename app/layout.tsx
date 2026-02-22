import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: '--font-dm-serif',
  weight: '400'
});

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  weight: ['400', '500', '600']
});

export const metadata: Metadata = {
  title: "Pratiro – Finn ordene før det gjelder",
  description: "Pratiro gir deg et trygt rom for å øve på krevende samtaler – i ditt eget tempo, uten konsekvenser.",
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className={`${dmSerif.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
