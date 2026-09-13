"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++counter;
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 4500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur animate-slide-up",
              item.kind === "success" && "border-brand-200 bg-brand-50 text-brand-900",
              item.kind === "error" && "border-red-200 bg-red-50 text-red-900",
              item.kind === "info" && "border-teal-200 bg-teal-50 text-teal-900",
            )}
            role="status"
          >
            {item.kind === "success" && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
            {item.kind === "error" && <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />}
            {item.kind === "info" && <Info className="mt-0.5 h-5 w-5 shrink-0" />}
            <p className="flex-1 text-sm font-medium leading-snug">{item.message}</p>
            <button
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded-full p-1 opacity-60 hover:opacity-100"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
