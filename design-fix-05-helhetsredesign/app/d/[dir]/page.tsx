"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDirection, type Direction } from "@/lib/direction";

const VALID: Direction[] = ["arkiv", "bank", "kvall"];

export default function DirectionRedirect() {
  const { dir } = useParams<{ dir: string }>();
  const { setDirection } = useDirection();
  const router = useRouter();

  useEffect(() => {
    if (VALID.includes(dir as Direction)) {
      setDirection(dir as Direction);
    }
    router.replace("/");
  }, [dir, setDirection, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-[13px] text-ink-muted">
      Byter designriktning…
    </div>
  );
}
