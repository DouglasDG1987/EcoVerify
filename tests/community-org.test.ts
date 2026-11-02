import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getTableConfig } from "drizzle-orm/pg-core";
import { groupNav, mobileNav, navItemsFor } from "@/lib/nav";
import { communityChat } from "@/db/schema";

const hrefs = (role: "citizen" | "moderator" | "admin", hasCommunity: boolean) =>
  navItemsFor(role, true, hasCommunity).map((item) => item.href);

describe("community per organization", () => {
  it("the Community tab only shows for people in an organization", () => {
    expect(hrefs("citizen", true)).toContain("/community");
    expect(hrefs("moderator", true)).toContain("/community");
    expect(hrefs("citizen", false)).not.toContain("/community");
    expect(hrefs("moderator", false)).not.toContain("/community");
    // Organizations stay reachable, so people can join or create one.
    expect(hrefs("citizen", false)).toContain("/org");
    expect(hrefs("admin", true)).not.toContain("/community");
  });

  it("without an organization the phone bar keeps 4 useful tabs", () => {
    const { primary } = mobileNav(navItemsFor("citizen", true, false));
    expect(primary.map((item) => item.href)).toEqual(["/missions", "/submissions", "/ranking", "/notifications"]);
  });

  it("chat messages belong to an organization (deleted with it)", () => {
    const config = getTableConfig(communityChat);
    expect(config.columns.map((column) => column.name)).toContain("organization_id");
    const fk = config.foreignKeys.find((key) => key.reference().columns.some((column) => column.name === "organization_id"));
    expect(fk?.onDelete).toBe("cascade");
    expect(config.indexes.map((index) => index.config.name)).toContain("community_chat_org_created_idx");
  });

  it("the Supabase files add the column for new and existing projects", () => {
    const schema = readFileSync("supabase/01_schema.sql", "utf8");
    expect(schema).toContain('"organization_id" uuid');
    expect(schema).toContain("community_chat_org_created_idx");
    const update = readFileSync("supabase/06_comunidade_por_organizacao.sql", "utf8");
    expect(update).toMatch(/add column if not exists organization_id uuid/i);
    expect(update).toMatch(/on delete cascade/i);
    expect(update).toMatch(/create index if not exists community_chat_org_created_idx/i);
  });
});

describe("menu sections", () => {
  it("groups the citizen menu into everyday, explore and account, in order", () => {
    const sections = groupNav(navItemsFor("citizen", true, true));
    expect(sections.map((s) => s.group)).toEqual(["main", "explore", "account"]);
    expect(sections[1].items.map((i) => i.href)).toEqual(["/quiz", "/mapa", "/lixo", "/beneficios", "/org"]);
    expect(groupNav(navItemsFor("moderator", true, false)).map((s) => s.group)).toEqual(["main", "explore", "staff", "account"]);
    expect(groupNav(navItemsFor("admin", true)).map((s) => s.group)).toEqual(["staff", "account"]);
  });

  it("leaves only the secondary screens for the phone menu", () => {
    const { more } = mobileNav(navItemsFor("citizen", true, true));
    expect(more.map((i) => i.href)).toEqual(["/quiz", "/mapa", "/lixo", "/beneficios", "/org", "/notifications", "/profile", "/settings"]);
  });
});
