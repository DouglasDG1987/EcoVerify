import type { ComponentType, ReactNode } from "react";
import { groupNav, NAV_GROUP_LABEL, type NavItem, type NavTone } from "@/lib/nav";
import { t, type Lang } from "@/lib/i18n";
import { ChevronRight } from "@/components/ui/icons";

/**
 * The app menu, grouped in sections ("Everyday", "Explore", "Team", "Your account"):
 * - SidebarNav: desktop sidebar, compact rows under small section titles;
 * - DrawerNav: phone menu ("More"), the explore items as a grid of colourful tiles and the account
 *   items as a list, so it no longer reads as one long column.
 *
 * Shared by the Next.js app and the offline demo: the caller passes its own Link component.
 */

export type NavLinkProps = { href: string; className?: string; onClick?: () => void; children: ReactNode; "aria-current"?: "page" };
export type NavLink = ComponentType<NavLinkProps>;

type MenuProps = {
  items: NavItem[];
  lang: Lang;
  isActive: (href: string) => boolean;
  /** Number shown on the item (unread notifications, proofs to review...). */
  badge?: (href: string) => number;
  Link: NavLink;
  onNavigate?: () => void;
};

const TONE: Record<NavTone, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  teal: "bg-teal-100 text-teal-700",
  sky: "bg-sky-100 text-sky-700",
  amber: "bg-amber-100 text-amber-700",
  lime: "bg-lime-100 text-lime-700",
  orange: "bg-orange-100 text-orange-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-600",
  slate: "bg-slate-100 text-slate-600",
};

function NavIcon({ item, className }: { item: NavItem; className: string }) {
  return (
    <span className={`grid shrink-0 place-items-center ${TONE[item.tone]} ${className}`} aria-hidden>
      <item.icon className="h-[18px] w-[18px]" />
    </span>
  );
}

function Count({ n, className = "" }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return <span className={`rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white ${className}`}>{n > 99 ? "99+" : n}</span>;
}

function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${className}`}>{children}</p>;
}

export function SidebarNav({ items, lang, isActive, badge, Link, onNavigate }: MenuProps) {
  return (
    <div className="space-y-4" data-testid="sidebar-nav">
      {groupNav(items).map((section) => (
        <div key={section.group}>
          <SectionTitle className="mb-1">{t(lang, NAV_GROUP_LABEL[section.group])}</SectionTitle>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm transition-colors ${
                    active ? "bg-emerald-50 font-semibold text-emerald-800 ring-1 ring-emerald-200" : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <NavIcon item={item} className="h-7 w-7 rounded-lg" />
                  <span className="min-w-0 flex-1 truncate">{t(lang, item.labelKey)}</span>
                  <Count n={badge?.(item.href) ?? 0} />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DrawerNav({ items, lang, isActive, badge, Link, onNavigate }: MenuProps) {
  return (
    <div className="space-y-5" data-testid="drawer-nav">
      {groupNav(items).map((section) => {
        const tiles = section.group === "main" || section.group === "explore";
        return (
          <section key={section.group}>
            <SectionTitle className="mb-2">{t(lang, NAV_GROUP_LABEL[section.group])}</SectionTitle>
            {tiles ? (
              <div className="grid grid-cols-3 gap-2">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const n = badge?.(item.href) ?? 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border bg-white p-2.5 text-center shadow-sm transition active:scale-[0.97] ${
                        active ? "border-emerald-300 ring-2 ring-emerald-100" : "border-black/5 hover:border-slate-200"
                      }`}
                    >
                      <NavIcon item={item} className="h-11 w-11 rounded-2xl" />
                      <span className={`line-clamp-2 text-xs leading-tight ${active ? "font-bold text-emerald-800" : "font-semibold text-slate-700"}`}>
                        {t(lang, item.labelKey)}
                      </span>
                      <Count n={n} className="absolute right-1.5 top-1.5" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
                {section.items.map((item, index) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 px-3.5 py-3 text-sm transition-colors ${index > 0 ? "border-t border-black/5" : ""} ${
                        active ? "bg-emerald-50 font-semibold text-emerald-800" : "font-medium text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <NavIcon item={item} className="h-7 w-7 rounded-lg" />
                      <span className="min-w-0 flex-1 truncate">{t(lang, item.labelKey)}</span>
                      <Count n={badge?.(item.href) ?? 0} />
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Top of the phone menu: who is logged in, with a shortcut to the profile. */
export function DrawerProfileCard({
  name,
  subtitle,
  initials,
  href,
  lang,
  Link,
  onNavigate,
}: {
  name: string;
  subtitle: string;
  initials: string;
  href: string;
  lang: Lang;
  Link: NavLink;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#2cc35f] via-[#278c98] to-[#2456d0] p-4 text-white shadow-md transition active:scale-[0.99]"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/20 text-base font-bold ring-2 ring-white/40">{initials}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold">{name}</span>
        <span className="block truncate text-xs text-white/80">{subtitle}</span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
        {t(lang, "nav_see_profile")}
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
