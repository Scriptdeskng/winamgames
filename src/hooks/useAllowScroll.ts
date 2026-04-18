import { useEffect } from "react";

export function useAllowScroll() {
  useEffect(() => {
    document.documentElement.classList.add("allow-scroll");
    return () => document.documentElement.classList.remove("allow-scroll");
  }, []);
}
