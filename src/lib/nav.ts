import type { DictKey } from "@/lib/i18n";

export type Role = "citizen" | "moderator" | "admin";

export type NavItem = {
  href: string;
  labelKey: DictKey;
  icon: string;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/missions", labelKey: "nav_missions", icon: "🌱", roles: ["citizen", "moderator", "admin"] },
  { href: "/submissions", labelKey: "nav_submissions", icon: "📋", roles: ["citizen", "moderator", "admin"] },
  { href: "/ranking", labelKey: "nav_ranking", icon: "🏆", roles: ["citizen", "moderator", "admin"] },
  { href: "/moderation", labelKey: "nav_moderation", icon: "🛡️", roles: ["moderator", "admin"] },
  { href: "/admin", labelKey: "nav_admin", icon: "📊", roles: ["admin"] },
  { href: "/notifications", labelKey: "nav_notifications", icon: "🔔", roles: ["citizen", "moderator", "admin"] },
  { href: "/profile", labelKey: "nav_profile", icon: "👤", roles: ["citizen", "moderator", "admin"] },
  { href: "/settings", labelKey: "nav_settings", icon: "⚙️", roles: ["citizen", "moderator", "admin"] },
];

export const MOBILE_PRIMARY_HREFS = ["/missions", "/submissions", "/ranking", "/notifications"];
