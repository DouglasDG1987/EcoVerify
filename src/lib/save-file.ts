import { Capacitor } from "@capacitor/core";

/**
 * Saves a text file (e.g. "Download my data") in a way that works everywhere:
 *
 * - Browser (desktop or phone): a normal download.
 * - Android app: the WebView can't download files, so it uses the native plugins. It asks for the
 *   storage permission when the Android version needs it (Android 10 and older), writes the file to
 *   Documents/EcoVerify and returns the path. If saving there is not possible, it opens the share
 *   sheet (Drive, Files, e-mail, WhatsApp…) with the file.
 * - Older app versions without the plugins: copies the content to the clipboard.
 *
 * Shared by the web app and the offline demo.
 */
export type SaveResult =
  | { kind: "downloaded" }
  | { kind: "saved"; path: string; uri: string }
  | { kind: "shared" }
  | { kind: "copied" }
  | { kind: "cancelled" }
  | { kind: "failed" };

export const SAVE_FOLDER = "EcoVerify";

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function browserDownload(filename: string, content: string, mime: string): SaveResult {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { kind: "downloaded" };
}

async function copyToClipboard(content: string): Promise<SaveResult> {
  try {
    await navigator.clipboard.writeText(content);
    return { kind: "copied" };
  } catch {
    return { kind: "failed" };
  }
}

function isCancel(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel/i.test(message);
}

/** Opens the Android share sheet with a copy of the file (cache folder: no permission needed). */
export async function shareFile(filename: string, content: string, title: string): Promise<SaveResult> {
  if (!Capacitor.isPluginAvailable("Filesystem") || !Capacitor.isPluginAvailable("Share")) return copyToClipboard(content);
  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
  try {
    const { uri } = await Filesystem.writeFile({ path: filename, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title, files: [uri], dialogTitle: title });
    return { kind: "shared" };
  } catch (error) {
    return isCancel(error) ? { kind: "cancelled" } : copyToClipboard(content);
  }
}

export async function saveTextFile(filename: string, content: string, opts: { mime?: string; shareTitle: string }): Promise<SaveResult> {
  const mime = opts.mime ?? "application/json";
  if (!isNativeApp()) return browserDownload(filename, content, mime);
  if (!Capacitor.isPluginAvailable("Filesystem")) return copyToClipboard(content);

  const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
  try {
    // Android 10 and older need the storage permission for the public Documents folder; newer versions return "granted".
    let permission = (await Filesystem.checkPermissions()).publicStorage;
    if (permission !== "granted") permission = (await Filesystem.requestPermissions()).publicStorage;
    if (permission === "granted") {
      const path = `${SAVE_FOLDER}/${filename}`;
      const { uri } = await Filesystem.writeFile({ path, data: content, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
      return { kind: "saved", path: `Documents/${path}`, uri };
    }
  } catch {
    // Falls through to the share sheet.
  }
  return shareFile(filename, content, opts.shareTitle);
}
