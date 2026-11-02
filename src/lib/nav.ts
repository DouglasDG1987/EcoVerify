import type { DictKey } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";
import { Sprout, FileText, Trophy, MessageSquare, Shield, BarChart3, Bell, User, Settings, Building2, Gift, Brain, MapPinCheck, Map as MapIcon } from "@/components/ui/icons";

export type Role = "citizen" | "moderator" | "admin";

/** Menu sections, in this order: what you use every day, things to explore, team tools, your account. */
export type NavGroup = "main" | "explore" | "staff" | "account";
export const NAV_GROUPS: NavGroup[] = ["main", "explore", "staff", "account"];
export const NAV_GROUP_LABEL: Record<NavGroup, DictKey> = {
  main: "nav_group_main",
  explore: "nav_group_explore",
  staff: "nav_group_staff",
  account: "nav_group_account",
};

/** Colour of the item's icon badge (palettes that also have a dark-mode version in theme.css). */
export type NavTone = "emerald" | "teal" | "sky" | "amber" | "lime" | "orange" | "green" | "red" | "slate";

export type NavItem = {
  href: string;
  labelKey: DictKey;
  icon: LucideIcon;
  roles: Role[];
  group: NavGroup;
  tone: NavTone;
};

/**
 * Citizens and moderators use the same app (missions, proofs, ranking, community, perks,
 * organizations). Moderators are trusted members of the team, chosen by the admin in Admin → Users:
 * besides the citizen app they get the Moderation screen (never their own proofs). The admin has
 * only the admin tools (no missions, ranking or chat).
 */
const PEOPLE: Role[] = ["citizen", "moderator"];
export const NAV_ITEMS: NavItem[] = [
  // Citizens and moderators: every day
  { href: "/missions", labelKey: "nav_missions", icon: Sprout, roles: PEOPLE, group: "main", tone: "emerald" },
  { href: "/submissions", labelKey: "nav_submissions", icon: FileText, roles: PEOPLE, group: "main", tone: "teal" },
  { href: "/ranking", labelKey: "nav_ranking", icon: Trophy, roles: PEOPLE, group: "main", tone: "amber" },
  { href: "/community", labelKey: "nav_community", icon: MessageSquare, roles: PEOPLE, group: "main", tone: "sky" },
  // Citizens and moderators: explore
  { href: "/quiz", labelKey: "nav_quiz", icon: Brain, roles: PEOPLE, group: "explore", tone: "lime" },
  { href: "/mapa", labelKey: "nav_map", icon: MapIcon, roles: PEOPLE, group: "explore", tone: "green" },
  { href: "/lixo", labelKey: "nav_dumps", icon: MapPinCheck, roles: PEOPLE, group: "explore", tone: "orange" },
  { href: "/beneficios", labelKey: "nav_benefits", icon: Gift, roles: PEOPLE, group: "explore", tone: "red" },
  { href: "/org", labelKey: "nav_orgs", icon: Building2, roles: PEOPLE, group: "explore", tone: "sky" },
  // Staff
  { href: "/admin", labelKey: "nav_admin", icon: BarChart3, roles: ["admin"], group: "staff", tone: "emerald" },
  { href: "/moderation", labelKey: "nav_moderation", icon: Shield, roles: ["moderator", "admin"], group: "staff", tone: "slate" },
  // Everyone
  { href: "/notifications", labelKey: "nav_notifications", icon: Bell, roles: ["citizen", "moderator", "admin"], group: "account", tone: "slate" },
  { href: "/profile", labelKey: "nav_profile", icon: User, roles: ["citizen", "moderator", "admin"], group: "account", tone: "slate" },
  { href: "/settings", labelKey: "nav_settings", icon: Settings, roles: ["citizen", "moderator", "admin"], group: "account", tone: "slate" },
];

/** The items split into their sections (empty sections left out), in menu order. */
export function groupNav(items: NavItem[]): { group: NavGroup; items: NavItem[] }[] {
  return NAV_GROUPS.map((group) => ({ group, items: items.filter((item) => item.group === group) })).filter((section) => section.items.length > 0);
}

/** Bottom bar on phones: the first 4 of these that the role has (the rest go to "More"). */
export const MOBILE_PRIMARY_HREFS = ["/missions", "/submissions", "/ranking", "/community", "/admin", "/moderation", "/notifications", "/profile"];

/**
 * Who reviews proofs for the platform. Admins always; moderators unless the platform switched the
 * role off (MODERATORS_ENABLED=false on the server, a switch in the demo). Moderators have limited
 * powers: review proofs and give yellow cards; red cards, suspensions, bans and FONE are admin-only.
 */
export function canReview(role: Role, moderatorsEnabled: boolean): boolean {
  return role === "admin" || (role === "moderator" && moderatorsEnabled);
}

/** Citizens and moderators take part (missions, ranking, chat...); the admin doesn't. */
export function isParticipant(role: Role): boolean {
  return role !== "admin";
}

/** True for the admin: no citizen screens. Moderators use the citizen app plus Moderation. */
export function isStaffExperience(role: Role, _moderatorsEnabled?: boolean): boolean {
  return !isParticipant(role);
}

/** First screen after login (and where citizen screens send the admin). */
export function homeFor(role: Role, _moderatorsEnabled?: boolean): string {
  return role === "admin" ? "/admin" : "/missions";
}

/**
 * The Community is the chat of an organization: the tab only shows for people in at least one
 * organization (hasCommunity), the others find the way in from Organizations.
 */
export function navItemsFor(role: Role, moderatorsEnabled: boolean, hasCommunity = true): NavItem[] {
  return NAV_ITEMS.filter(
    (item) =>
      item.roles.includes(role) &&
      (item.href !== "/moderation" || canReview(role, moderatorsEnabled)) &&
      (item.href !== "/community" || hasCommunity),
  );
}

/** Splits the role's items into the phone bottom bar (up to 4) and the "More" drawer. */
export function mobileNav(items: NavItem[]): { primary: NavItem[]; more: NavItem[] } {
  const primary = items.filter((item) => MOBILE_PRIMARY_HREFS.includes(item.href)).slice(0, 4);
  return { primary, more: items.filter((item) => !primary.includes(item)) };
}
