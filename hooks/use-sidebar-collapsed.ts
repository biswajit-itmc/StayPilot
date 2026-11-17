"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "staypilot:sidebar-collapsed";
const EVENT = "staypilot:sidebar-change";

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Sidebar collapsed preference, persisted in localStorage. Server and first client render are expanded. */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(KEY, read() ? "0" : "1");
    } catch {
      /* storage unavailable: preference is not persisted */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [collapsed, toggle] as const;
}
