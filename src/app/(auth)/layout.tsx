import { LogoHorizontal } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 animate-fade-in">
          <LogoHorizontal height={44} />
        </div>
        <div className="w-full max-w-md animate-slide-up">{children}</div>
      </div>
      <footer className="pb-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} EcoVerify — Ações sustentáveis, reconhecidas e recompensadas.
      </footer>
    </div>
  );
}
