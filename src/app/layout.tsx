import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "EcoVerify — Ações sustentáveis, reconhecidas e recompensadas",
  description:
    "EcoVerify conecta ações sustentáveis do mundo real a recompensas reais: missões, comprovações, pontos e a criptomoeda FONE.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser().catch(() => null);

  const fontClass = `font-${user?.fontSize ?? "medium"}`;
  const classes = [
    fontClass,
    user?.highContrast ? "high-contrast" : "",
    user?.reducedMotion ? "reduce-motion" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang="pt-BR" className={classes}>
      <body className={`${inter.variable} font-sans antialiased bg-[#f7f8f7] text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
