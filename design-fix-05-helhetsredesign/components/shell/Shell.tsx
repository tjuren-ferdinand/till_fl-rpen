"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useTheme } from "@/lib/theme";
import { useDirection } from "@/lib/direction";
import LineIcon, { type IconName } from "@/components/LineIcon";
import { LOGO_MARK_DARK, LOGO_MARK_LIGHT } from "@/lib/logo";
import { createClient } from "@/lib/supabase/client";

const NAV: { label: string; href: string; icon: IconName }[] = [
  { label: "Översikt", href: "/", icon: "grid" },
  { label: "Kurser", href: "/courses", icon: "stack" },
  { label: "Klasser", href: "/classes", icon: "users" },
  { label: "Granskning", href: "/review", icon: "pen" },
  { label: "Inställningar", href: "/settings", icon: "settings" },
];

function getTitle(pathname: string) {
  if (pathname === "/") return "Översikt";
  if (pathname.startsWith("/courses")) return "Kurser";
  if (pathname.startsWith("/classes")) return "Klasser";
  if (pathname.startsWith("/review")) return "Granskning";
  if (pathname.startsWith("/settings")) return "Inställningar";
  if (pathname.startsWith("/results")) return "Resultat";
  if (pathname.startsWith("/student")) return "Elev";
  return "WiseOS";
}

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { direction } = useDirection();
  const [user, setUser] = useState<User | null>(null);

  const isDark = theme === "dark" || direction === "kvall";
  const nextThemeLabel = theme === "light" ? "Byt till krämtema" : theme === "cream" ? "Byt till mörkt tema" : "Byt till ljust tema";
  const isPublic =
    pathname === "/login" ||
    pathname === "/demo" ||
    pathname.startsWith("/demo/") ||
    pathname === "/faq" ||
    pathname === "/legal" ||
    pathname === "/_not-found" ||
    pathname.endsWith("/print");

  useEffect(() => {
    if (isPublic) {
      setUser(null);
      return;
    }
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [isPublic]);

  if (isPublic) {
    return <>{children}</>;
  }

  const metadata: Record<string, unknown> = user?.user_metadata ?? {};
  const name = [metadata.name, metadata.full_name, metadata.display_name]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
  const identity = name || user?.email || "";
  const parts = (name || user?.email?.split("@")[0] || "").split(/[\s._-]+/).filter(Boolean);
  const initials = parts.length > 1
    ? `${Array.from(parts[0])[0]}${Array.from(parts[parts.length - 1])[0]}`.toLocaleUpperCase("sv-SE")
    : Array.from(parts[0] || "").slice(0, 2).join("").toLocaleUpperCase("sv-SE");
  const title = getTitle(pathname);

  const logoMark = (
    <Image
      src={isDark ? LOGO_MARK_DARK : LOGO_MARK_LIGHT}
      alt=""
      width={24}
      height={24}
      className="h-6 w-6 object-contain"
    />
  );
  const avatar = (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper text-xs font-medium"
      role="img"
      aria-label={identity ? `Inloggad som ${identity}` : "Användarkonto"}
      title={identity || "Användarkonto"}
    >
      {initials || <LineIcon name="users" className="h-4 w-4" />}
    </div>
  );
  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn-tertiary h-10 w-10 p-0"
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
    >
      <LineIcon name={theme === "cream" ? "moon" : "sun"} className="h-5 w-5" />
    </button>
  );

  /* Mobil-bottom-nav — delad men riktningsstyrd via tokens */
  const mobileNav = (
    <nav className="order-2 flex h-[calc(3.5rem+env(safe-area-inset-bottom))] flex-none items-center justify-around border-t border-ink-hairline bg-paper pb-[env(safe-area-inset-bottom)] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] md:hidden" aria-label="Huvudnavigation">
      {NAV.map((item) => {
        const active = isActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            className={[
              "flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
              active ? "bg-paper-secondary text-ink border border-ink-hairline" : "text-ink-secondary hover:bg-ink/5 hover:text-ink",
            ].join(" ")}
          >
            <LineIcon name={item.icon} className="h-5 w-5" />
          </Link>
        );
      })}
    </nav>
  );

  /* ---------- A · ARKIVET — sidebar med textetiketter ---------- */
  if (direction === "arkiv") {
    return (
      <div className="fixed inset-0 z-0 flex flex-col overflow-hidden bg-paper text-ink md:flex-row">
        <aside className="hidden md:flex h-full w-56 flex-none flex-col border-r border-ink-hairline bg-paper px-5 py-6">
          <Link href="/" className="mb-10 flex items-center gap-2.5 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40" aria-label="WiseOS översikt">
            {logoMark}
            <span className="font-[Fraunces,Georgia,serif] text-[17px] font-medium tracking-[-0.01em] text-ink">WiseOS</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-0.5" aria-label="Huvudnavigation">
            {NAV.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "rounded-md px-3 py-2 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
                    active
                      ? "bg-paper-secondary font-medium text-ink"
                      : "text-ink-secondary hover:bg-ink/[0.04] hover:text-ink",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex items-center justify-between border-t border-ink-hairline pt-4">
            {avatar}
            {themeButton}
          </div>
        </aside>
        {mobileNav}
        <section className="flex min-h-0 flex-1 flex-col">
          <header className="flex h-[calc(3.5rem+env(safe-area-inset-top))] flex-none items-center justify-between border-b border-ink-hairline pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] md:h-14 md:px-8 md:pt-0">
            <h1 className="font-[Fraunces,Georgia,serif] text-[17px] font-medium tracking-tight text-ink">{title}</h1>
            <div className="md:hidden">{themeButton}</div>
          </header>
          <main className="min-h-0 flex-1 overflow-auto">
            <div className="mx-auto max-w-4xl px-5 py-8 md:px-10 md:py-12">
              {children}
            </div>
          </main>
        </section>
      </div>
    );
  }

  /* ---------- B · BÄNKEN — top bar med horisontella tabs ---------- */
  if (direction === "bank") {
    return (
      <div className="fixed inset-0 z-0 flex flex-col overflow-hidden bg-paper text-ink">
        <header className="flex h-[calc(3rem+env(safe-area-inset-top))] flex-none items-center justify-between border-b border-ink-hairline bg-paper pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)]">
          <div className="flex h-full items-center gap-6">
            <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40" aria-label="WiseOS översikt">
              {logoMark}
              <span className="text-[14px] font-semibold tracking-[-0.01em] text-ink">WiseOS</span>
            </Link>
            <nav className="hidden h-full items-center gap-0.5 md:flex" aria-label="Huvudnavigation">
              {NAV.map((item) => {
                const active = isActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "relative flex h-full items-center px-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/30",
                      active ? "text-ink" : "text-ink-muted hover:text-ink",
                    ].join(" ")}
                  >
                    {item.label}
                    {active && <span className="absolute inset-x-2 bottom-0 h-[2px] bg-accent" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-1.5">
            {themeButton}
            {avatar}
          </div>
        </header>
        {mobileNav}
        <main className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  /* ---------- C · SÖNDAGSKVÄLL — minimal top bar, centrerad ---------- */
  return (
    <div className="fixed inset-0 z-0 flex flex-col overflow-hidden bg-paper text-ink">
      <header className="flex h-[calc(3.5rem+env(safe-area-inset-top))] flex-none items-center justify-between pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)]">
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40" aria-label="WiseOS översikt">
          {logoMark}
          <span className="text-[15px] font-medium tracking-[-0.01em] text-ink">WiseOS</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {themeButton}
          {avatar}
        </div>
      </header>
      {/* Diskret centrerad nav — inga boxar */}
      <nav className="hidden flex-none items-center justify-center gap-7 pb-2 md:flex" aria-label="Huvudnavigation">
        {NAV.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
                active ? "font-medium text-ink" : "text-ink-muted hover:text-ink-secondary",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {mobileNav}
      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
