"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

const NAV_HISTORY_KEY = "winam.nav-history";

export function readNavHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(NAV_HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function writeNavHistory(stack: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(stack));
  } catch {
    // ignore
  }
}

export function pushNavHistory(pathname: string) {
  if (typeof window === "undefined") return;
  const stack = readNavHistory();
  if (stack[stack.length - 1] !== pathname) {
    stack.push(pathname);
    writeNavHistory(stack);
  }
}

export function popNavHistory(): string | null {
  if (typeof window === "undefined") return null;
  const stack = readNavHistory();
  if (stack.length >= 2) {
    stack.pop();
    const target = stack.pop() ?? null;
    if (target) {
      writeNavHistory(stack);
      return target;
    }
  }
  return null;
}

export function useSmartBack(fallbackHref: string) {
  const router = useRouter();

  return useCallback(() => {
    const target = popNavHistory();
    if (target) {
      router.replace(target);
      return;
    }
    router.replace(fallbackHref);
  }, [fallbackHref, router]);
}
