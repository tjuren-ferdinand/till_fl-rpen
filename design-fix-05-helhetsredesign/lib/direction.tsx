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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    const fromUrl = searchParams.get("dir") as Direction | null;
    if (fromUrl && VALID.includes(fromUrl)) {
      setDirectionState(fromUrl);
      try {
        localStorage.setItem("wiseos-direction", fromUrl);
      } catch {}
      return;
    }
    try {
      const stored = localStorage.getItem("wiseos-direction") as Direction | null;
      if (stored && VALID.includes(stored)) setDirectionState(stored);
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-dir", direction);
    try {
      localStorage.setItem("wiseos-direction", direction);
    } catch {}
    // Söndagskväll föreslår dark — övriga light. Respekterar manuell temaväxling
    // eftersom den bara sätter temat vid riktningsbyte.
    const suggestedTheme = direction === "kvall" ? "dark" : "light";
    try {
      localStorage.setItem("wiseos-theme", suggestedTheme);
    } catch {}
    document.documentElement.classList.remove("light", "cream", "dark");
    document.documentElement.classList.add(suggestedTheme);
  }, [direction, mounted]);

  const setDirection = (d: Direction) => {
    setDirectionState(d);
    const params = new URLSearchParams(searchParams.toString());
    params.set("dir", d);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
