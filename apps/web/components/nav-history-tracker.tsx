"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pushNavHistory } from "@/lib/nav-history";

export function NavHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    pushNavHistory(pathname);
  }, [pathname]);

  return null;
}
