import { beforeEach, describe, expect, it, vi } from "vitest";

const cap = { native: true, plugins: new Set(["Filesystem", "Share"]) };
const fs = {
  permission: "granted" as string,
  requested: "granted" as string,
  writeFails: false,
  writes: [] as { path: string; directory: string }[],
};
const shared: unknown[] = [];

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => cap.native,
    isPluginAvailable: (name: string) => cap.plugins.has(name),
  },
}));
vi.mock("@capacitor/filesystem", () => ({
  Directory: { Documents: "DOCUMENTS", Cache: "CACHE" },
  Encoding: { UTF8: "utf8" },
  Filesystem: {
    checkPermissions: async () => ({ publicStorage: fs.permission }),
    requestPermissions: async () => ({ publicStorage: fs.requested }),
    writeFile: async ({ path, directory }: { path: string; directory: string }) => {
      if (fs.writeFails && directory === "DOCUMENTS") throw new Error("EACCES");
      fs.writes.push({ path, directory });
      return { uri: `file:///${directory}/${path}` };
    },
  },
}));
vi.mock("@capacitor/share", () => ({
  Share: { share: async (opts: unknown) => void shared.push(opts) },
}));

const clipboard: string[] = [];
vi.stubGlobal("navigator", { clipboard: { writeText: async (text: string) => void clipboard.push(text) } });

const { saveTextFile } = await import("@/lib/save-file");

beforeEach(() => {
  cap.native = true;
  cap.plugins = new Set(["Filesystem", "Share"]);
  Object.assign(fs, { permission: "granted", requested: "granted", writeFails: false, writes: [] });
  shared.length = 0;
  clipboard.length = 0;
});

describe("saveTextFile in the Android app", () => {
  it("saves to Documents/EcoVerify when storage is allowed", async () => {
    const r = await saveTextFile("dados.json", "{}", { shareTitle: "x" });
    expect(r).toEqual({ kind: "saved", path: "Documents/EcoVerify/dados.json", uri: "file:///DOCUMENTS/EcoVerify/dados.json" });
    expect(shared).toHaveLength(0);
  });

  it("asks for the storage permission on old Android and saves when granted", async () => {
    fs.permission = "prompt";
    fs.requested = "granted";
    const r = await saveTextFile("dados.json", "{}", { shareTitle: "x" });
    expect(r.kind).toBe("saved");
  });

  it("falls back to the share sheet when the permission is denied", async () => {
    fs.permission = "prompt";
    fs.requested = "denied";
    const r = await saveTextFile("dados.json", "{}", { shareTitle: "x" });
    expect(r.kind).toBe("shared");
    expect(fs.writes).toEqual([{ path: "dados.json", directory: "CACHE" }]);
    expect(shared).toHaveLength(1);
  });

  it("falls back to the share sheet when writing to Documents fails", async () => {
    fs.writeFails = true;
    const r = await saveTextFile("dados.json", "{}", { shareTitle: "x" });
    expect(r.kind).toBe("shared");
  });

  it("copies the data on app versions without the plugins", async () => {
    cap.plugins = new Set();
    const r = await saveTextFile("dados.json", '{"a":1}', { shareTitle: "x" });
    expect(r.kind).toBe("copied");
    expect(clipboard).toEqual(['{"a":1}']);
  });
});
