import type { Metadata } from "next";
import { Fustat } from "next/font/google";
import "./globals.css";

const fustat = Fustat({
  subsets: ["latin"],
  variable: "--font-fustat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIB Mirassol | Dashboard",
  description: "Painel de gestão ministerial da SIB Mirassol",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={fustat.variable}>{children}</body>
    </html>
  );
}
