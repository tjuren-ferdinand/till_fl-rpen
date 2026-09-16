"use client";

import { useDirection, DIRECTIONS, type Direction } from "@/lib/direction";

export default function DirectionSwitcher() {
  const { direction, setDirection } = useDirection();

  return (
    <div
      className="fixed bottom-5 right-5 z-[90] flex items-center gap-1 rounded-full border border-ink-hairline bg-paper/90 p-1 shadow-float backdrop-blur-md"
      role="group"
      aria-label="Välj designriktning"
    >
      {DIRECTIONS.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => setDirection(d.id)}
          title={d.tagline}
          aria-pressed={direction === d.id}
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all ${
            direction === d.id
              ? "bg-ink text-paper"
              : "text-ink-secondary hover:text-ink hover:bg-ink/5"
          }`}
        >
          {d.id === "arkiv" ? "A" : d.id === "bank" ? "B" : "C"}
        </button>
      ))}
      <span className="hidden pl-1 pr-2 text-[11px] text-ink-muted sm:block">
        {DIRECTIONS.find((d) => d.id === direction)?.tagline}
      </span>
    </div>
  );
}
