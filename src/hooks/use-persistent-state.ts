import { useEffect, useRef, useState } from "react";

const NAMESPACE = "creatorcore:";

/**
 * useLocalState — persistent React state backed by localStorage.
 * Survives refresh, minimize, tab switch, accidental navigation.
 *
 * @param key   stable key (no namespace prefix needed)
 * @param initial default value if no stored value exists
 */
export function useLocalState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const storageKey = NAMESPACE + key;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  // Debounce writes so rapid state updates don't thrash localStorage.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // Quota exceeded or storage disabled — silently drop.
      }
    }, 200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [storageKey, value]);

  return [value, setValue];
}

/** Remove a persisted key. Useful for "reset" buttons. */
export function clearLocalState(key: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(NAMESPACE + key); } catch { /* ignore */ }
}

/** Read a File from base64 + mime + name. */
export async function base64ToFile(b64: string, mimeType: string, name: string): Promise<File> {
  const res = await fetch(`data:${mimeType};base64,${b64}`);
  const blob = await res.blob();
  return new File([blob], name, { type: mimeType });
}

/** Encode a File to base64 (no data URI prefix). */
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; name: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const b64 = result.split(",")[1] ?? "";
      resolve({ base64: b64, mimeType: file.type || "image/jpeg", name: file.name });
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/**
 * Downscale + JPEG-encode a File so it's safely persistable in localStorage
 * (most browsers cap at ~5MB). Targets max edge `maxEdge` and JPEG quality 0.82.
 * Returns base64 + mimeType + name. Falls back to original encoding if canvas is unavailable.
 */
export async function fileToPersistableBase64(
  file: File,
  maxEdge = 1600,
): Promise<{ base64: string; mimeType: string; name: string }> {
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") {
    return fileToBase64(file);
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fileToBase64(file);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const b64 = dataUrl.split(",")[1] ?? "";
    return { base64: b64, mimeType: "image/jpeg", name: file.name.replace(/\.[^.]+$/, "") + ".jpg" };
  } catch {
    return fileToBase64(file);
  }
}
