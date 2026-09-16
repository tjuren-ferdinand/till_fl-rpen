"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Direction = "arkiv" | "bank" | "kvall";

export const DIRECTIONS: { id: Direction; label: string; tagline: string }[] = [
  { id: "arkiv", label: "A · Arkivet", tagline: "Editorial lugn" },
  { id: "bank", label: "B · Bänken", tagline: "Tätt arbetsflöde" },
  { id: "kvall", label: "C · Söndagskväll", tagline: "Mörk-först" },
];

const VALID: Direction[] = ["arkiv", "bank", "kvall"];

interface DirectionContextType {
  direction: Direction;
  setDirection: (d: Direction) => void;
}

const DirectionContext = createContext<DirectionContextType | undefined>(undefined);

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirectionState] = useState<Direction>("arkiv");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Läs ?dir= från URL:en först, annars sparad riktning
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("dir") as Direction | null;
    if (fromUrl && VALID.includes(fromUrl)) {
      setDirectionState(fromUrl);
    } else {
      try {
        const stored = localStorage.getItem("wiseos-direction") as Direction | null;
        if (stored && VALID.includes(stored)) setDirectionState(stored);
      } catch {}
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-dir", direction);
    try {
      localStorage.setItem("wiseos-direction", direction);
    } catch {}
    // Söndagskväll föreslår dark — övriga light. Sätts vid riktningsbyte;
    // temaväljaren fungerar fortfarande fritt efteråt.
    const suggestedTheme = direction === "kvall" ? "dark" : "light";
    try {
      localStorage.setItem("wiseos-theme", suggestedTheme);
    } catch {}
    document.documentElement.classList.remove("light", "cream", "dark");
    document.documentElement.classList.add(suggestedTheme);
  }, [direction, mounted]);

  const setDirection = (d: Direction) => {
    setDirectionState(d);
    const url = new URL(window.location.href);
    url.searchParams.set("dir", d);
    window.history.replaceState(null, "", url.toString());
  };

  return (
    <DirectionContext.Provider value={{ direction, setDirection }}>
      {children}
    </DirectionContext.Provider>
  );
}

export function useDirection() {
  const ctx = useContext(DirectionContext);
  if (!ctx) throw new Error("useDirection must be used within DirectionProvider");
  return ctx;
}
