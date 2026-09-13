"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Leaf,
  ListChecks,
  Trophy,
  ShieldCheck,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Menu,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { useNotifications } from "@/lib/useNotifications";

interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof Leaf;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/feed", labelKey: "nav.feed", icon: Leaf, roles: ["citizen", "moderator", "admin"] },
  { href: "/submissions", labelKey: "nav.submissions", icon: ListChecks, roles: ["citizen", "moderator", "admin"] },
  { href: "/ranking", labelKey: "nav.ranking", icon: Trophy, roles: ["citizen", "moderator", "admin"] },
  { href: "/moderation", labelKey: "nav.moderation", icon: ShieldCheck, roles: ["moderator", "admin"] },
  { href: "/admin", labelKey: "nav.admin", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell, roles: ["citizen", "moderator", "admin"] },
  { href: "/profile", labelKey: "nav.profile", icon: User, roles: ["citizen", "moderator", "admin"] },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, roles: ["citizen", "moderator", "admin"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const items = NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role));
  const bottomItems = items.slice(0, 5);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white p-5 md:flex">
        <div className="mb-8 flex items-center gap-2 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-sm">
            <Leaf className="h-6 w-6" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-stone-900">Eco Verify</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        {user && (
          <div className="mt-4 border-t border-stone-200 pt-4">
            <div className="mb-3 px-1">
              <p className="truncate text-sm font-semibold text-stone-900">{user.nome}</p>
              <p className="truncate text-xs text-stone-500">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              {t("nav.logout")}
            </button>
          </div>
        )}
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-teal-500 text-white">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-stone-900">Eco Verify</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-72 animate-slide-up bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {user && (
              <div className="mb-4 border-b border-stone-200 pb-4">
                <p className="truncate text-sm font-semibold text-stone-900">{user.nome}</p>
                <p className="truncate text-xs text-stone-500">{user.email}</p>
              </div>
            )}
            <nav className="flex flex-col gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {item.href === "/notifications" && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                {t("nav.logout")}
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
        {bottomItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-brand-600" : "text-stone-500",
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
