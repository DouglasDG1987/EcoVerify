import { useState, type ReactNode } from "react";
import { LogOut, Menu, X, Users } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { PoweredByFone } from "@/components/brand/fone";
import { homeFor, navItemsFor, mobileNav } from "@/lib/nav";
import { t } from "@/lib/i18n";
import { Link, useRoute } from "../router";
import { dt } from "../i18n";
import { logout, moderatorsOn, useLang, useStore, type User } from "../store";
import { Avatar } from "./ui";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { DrawerNav, DrawerProfileCard, SidebarNav, type NavLinkProps } from "@/components/nav/nav-menu";
import { initials } from "@/lib/utils";

function DemoLink({ href, className, onClick, children }: NavLinkProps) {
  return (
    <Link to={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}


/** Keeps content clear of the status bar / notch in the Android app (edge-to-edge) and on iPhone. */
export function SafeAreaTop({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`h-[env(safe-area-inset-top)] ${className}`} />;
}

function roleLabel(user: User, lang: ReturnType<typeof useLang>) {
  return dt(lang, user.role === "admin" ? "demo_role_admin" : user.role === "moderator" ? "demo_role_moderator" : "demo_role_citizen");
}

export function Shell({ user, children }: { user: User; children: ReactNode }) {
  const lang = useLang();
  const path = useRoute();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const unread = useStore((s) => s.notifications.filter((n) => n.userId === user.id && !n.isRead).length);
  const pendingReview = useStore((s) => s.submissions.filter((x) => x.status === "pending" && x.userId !== user.id).length);

  const moderatorsEnabled = useStore((s) => moderatorsOn(s));
  // The Community is the chat of an organization: the tab only shows for members of one.
  const hasCommunity = useStore((s) => (s.orgMembers ?? []).some((m) => m.userId === user.id));
  const items = navItemsFor(user.role, moderatorsEnabled, hasCommunity);
  const { primary: primaryMobile, more: moreMobile } = mobileNav(items);
  const isActive = (href: string) => path === href || path.startsWith(href + "/");

  const badge = (href: string) => (href === "/notifications" ? unread : href === "/moderation" ? pendingReview : 0);
  const closeDrawer = () => setDrawerOpen(false);

  const userCard = (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <Avatar name={user.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{roleLabel(user, lang)}</p>
      </div>
    </div>
  );

  const actions = (
    <div className="mt-3 grid gap-2">
      <button
        type="button"
        onClick={() => {
          setDrawerOpen(false);
          setSwitcherOpen(true);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-200"
      >
        <Users className="h-4 w-4" /> {dt(lang, "demo_switch_profile")}
      </button>
      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" /> {t(lang, "nav_logout")}
      </button>
      <div className="mt-2 flex justify-center">
        <PoweredByFone lang={lang} height={14} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40">
        <SafeAreaTop className="bg-white/90 md:hidden" />
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-2.5 backdrop-blur md:hidden">
          <Link to={homeFor(user.role, moderatorsEnabled)} className="flex items-center gap-2">
            <LogoMark size={32} />
            <span className="text-lg font-extrabold text-slate-900">EcoVerify</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSwitcherOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900"
            >
              <Users className="h-4 w-4" /> {roleLabel(user, lang)}
            </button>
            <button
              type="button"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-100"
            >
              <Menu className="h-6 w-6" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />}
            </button>
          </div>
        </header>
      </div>

      <div className="md:flex">
        {/* Desktop sidebar */}
        <aside className="hidden border-r border-black/5 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-72 md:shrink-0 md:flex-col">
          <div className="flex items-center gap-3 px-6 py-6">
            <LogoMark size={40} />
            <span className="text-xl font-extrabold text-slate-900">EcoVerify</span>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
            <SidebarNav items={items} lang={lang} isActive={isActive} badge={badge} Link={DemoLink} />
          </nav>
          <div className="border-t border-black/5 p-4">
            {userCard}
            {actions}
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
        </main>
      </div>

      {/* Mobile drawer ("More"): profile card, tiles to explore, account list */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 flex h-full w-[88vw] max-w-sm flex-col bg-slate-50 shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="flex items-center gap-2">
                <LogoMark size={30} />
                <span className="font-extrabold text-slate-900">EcoVerify</span>
              </div>
              <button type="button" aria-label="close" onClick={closeDrawer} className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-500 shadow-sm hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-4">
              <DrawerProfileCard name={user.name} subtitle={roleLabel(user, lang)} initials={initials(user.name)} href="/profile" lang={lang} Link={DemoLink} onNavigate={closeDrawer} />
              <DrawerNav items={moreMobile.filter((item) => item.href !== "/profile")} lang={lang} isActive={isActive} badge={badge} Link={DemoLink} onNavigate={closeDrawer} />
            </div>
            <div className="border-t border-black/5 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">{actions}</div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {primaryMobile.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${isActive(item.href) ? "text-emerald-600" : "text-slate-500"}`}
          >
            <item.icon className="h-6 w-6" />
            {((item.href === "/moderation" && pendingReview > 0) || (item.href === "/notifications" && unread > 0)) && (
              <span className="absolute right-[30%] top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
            )}
            <span className="max-w-full truncate px-1">{t(lang, item.labelKey)}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-slate-500"
        >
          <Menu className="h-6 w-6" />
          {unread > 0 && moreMobile.some((item) => item.href === "/notifications") && (
            <span className="absolute right-[30%] top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
          )}
          <span>{dt(lang, "more")}</span>
        </button>
      </nav>

      {switcherOpen && <ProfileSwitcher onClose={() => setSwitcherOpen(false)} />}
    </div>
  );
}
