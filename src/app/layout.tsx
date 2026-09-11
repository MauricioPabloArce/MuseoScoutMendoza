import type { Metadata } from "next";
import { Geist, Geist_Mono, Ubuntu } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ubuntu = Ubuntu({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-ubuntu',
});

export const metadata: Metadata = {
  title: "Museo Scout Mendoza",
  description: 'Museo Scout Mendoza "Hno Gris Cayetano Ponso"',
  icons: {
    icon: "/logo.png",
  },
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${ubuntu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
