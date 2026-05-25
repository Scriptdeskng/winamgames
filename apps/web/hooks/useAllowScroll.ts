"use client";

import { useEffect } from "react";

export default function useAllowScroll() {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "auto";
    document.body.classList.remove("overflow-hidden");
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
}
