import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SettingsProvider } from "@/lib/settings-context";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Eco Verify — Missões Ambientais",
  description:
    "Plataforma de missões ambientais com verificação humana, gamificação por pontos e recompensas em token FONE.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <SettingsProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
