"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore, type Prov, type StudentResult } from "@/lib/store";
import { useDirection } from "@/lib/direction";
import Reveal from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
import Onboarding from "@/components/Onboarding";
import DashboardEmptyState from "@/components/DashboardEmptyState";
import GradingGrid from "@/components/GradingGrid";
import LineIcon from "@/components/LineIcon";

function useToday() {
  const [today, setToday] = useState("");
  useEffect(() => {
    const f = new Intl.DateTimeFormat("sv-SE", { weekday: "long", day: "numeric", month: "long" });
    setToday(f.format(new Date()));
  }, []);
  return today;
}

function useUserName() {
  const [userName, setUserName] = useState("lärare");
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const u = data.user;
        const name = (u?.user_metadata as Record<string, string> | undefined)?.name;
        const email = u?.email;
        setUserName(name || email?.split("@")[0] || "lärare");
      });
  }, []);
  return userName;
}

/** Ogranskade delsteg i ett elevresultat */
function unreviewedSteps(r: StudentResult) {
  return r.steps.filter((s) => !s.reviewed).length;
}

function provProgress(prov: Prov, results: StudentResult[]) {
  const provResults = results.filter((r) => r.provId === prov.id);
  const total = provResults.length;
  const done = provResults.filter((r) => r.steps.every((s) => s.reviewed)).length;
  return { total, done, remaining: total - done };
}

export default function DashboardPage() {
  const { direction } = useDirection();
  const klasser = useStore((s) => s.klasser);
  const prov = useStore((s) => s.prov);
  const results = useStore((s) => s.results);
  const kurser = useStore((s) => s.kurser);
  const userName = useUserName();
  const today = useToday();

  const pendingProv = prov.filter((p) => p.status === "review" || p.status === "grading");
  const gradingProv = prov.filter((p) => p.status === "grading");
  const activeKurser = kurser.filter(
    (kurs) => kurs.isCustom || klasser.some((k) => k.kursId === kurs.id)
  );
  const recentResults = results.slice(-3).reverse();
  const ownerName = (p: Prov) =>
    klasser.find((k) => k.id === p.klassId)?.name ??
    kurser.find((k) => k.id === p.kursId)?.name ?? "—";

  /* ================== B · BÄNKEN — kötabell ================== */
  if (direction === "bank") {
    return (
      <div>
        <Onboarding />
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
              Arbetskö
            </h1>
            <p className="mt-0.5 text-[12.5px] text-ink-secondary capitalize">
              {today} · {pendingProv.length} provbunt{pendingProv.length === 1 ? "" : "ar"} aktiv{pendingProv.length === 1 ? "" : "a"}
            </p>
          </div>
          <Link href="/classes" className="btn-primary !py-2 text-[13px]">
            + Rätta nytt prov
          </Link>
        </div>

        {/* Kötabell — varje provbunt en rad med framdrift */}
        <div className="overflow-hidden rounded-lg border border-ink-hairline bg-paper-raised">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-ink-hairline text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
                <th className="px-4 py-2.5 font-medium">Prov</th>
                <th className="px-4 py-2.5 font-medium">Klass/Kurs</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Granskat</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {prov.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                    Inga prov ännu — skapa en klass och ladda upp din första provbunt.
                  </td>
                </tr>
              )}
              {prov.map((p) => {
                const prog = provProgress(p, results);
                const isGrading = p.status === "grading";
                const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;
                return (
                  <tr key={p.id} className="border-b border-ink-hairline last:border-0 hover:bg-ink/[0.025] transition-colors">
                    <td className="px-4 py-3 font-medium text-ink">{p.title}</td>
                    <td className="px-4 py-3 text-ink-secondary">{ownerName(p)}</td>
                    <td className="px-4 py-3">
                      {isGrading ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-ink-secondary">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-state-warning" />
                          rättar…
                        </span>
                      ) : p.status === "published" ? (
                        <span className="font-mono text-[12px] text-state-success">publicerat</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-accent">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          väntar på dig
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {prog.total > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-20 overflow-hidden rounded-full bg-ink/10">
                            <div
                              className="h-full rounded-full bg-accent transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[12px] tabular-nums text-ink-secondary">
                            {prog.done}/{prog.total}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-[12px] text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "review" && (
                        <Link href="/review" className="text-[12.5px] font-medium text-accent hover:underline">
                          Granska →
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Kompakt register under */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted">Kurser</h2>
            <div className="divide-y divide-ink-hairline border-y border-ink-hairline">
              {activeKurser.map((kurs) => (
                <Link key={kurs.id} href={`/courses/${kurs.id}`} className="flex items-center justify-between py-2.5 text-[13px] hover:bg-ink/[0.025] px-2 -mx-2 rounded transition-colors">
                  <span className="font-medium text-ink">{kurs.name}</span>
                  <span className="font-mono text-[12px] text-ink-muted">{kurs.subject}</span>
                </Link>
              ))}
              {activeKurser.length === 0 && <div className="py-3 text-[13px] text-ink-muted">Inga kurser ännu</div>}
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted">Klasser</h2>
            <div className="divide-y divide-ink-hairline border-y border-ink-hairline">
              {klasser.map((k) => (
                <Link key={k.id} href={`/classes/${k.id}`} className="flex items-center justify-between py-2.5 text-[13px] hover:bg-ink/[0.025] px-2 -mx-2 rounded transition-colors">
                  <span className="font-medium text-ink">{k.name}</span>
                  <span className="font-mono text-[12px] text-ink-muted">{k.students.length} elever</span>
                </Link>
              ))}
              {klasser.length === 0 && <div className="py-3 text-[13px] text-ink-muted">Inga klasser ännu</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================== C · SÖNDAGSKVÄLL — ett fokus ================== */
  if (direction === "kvall") {
    const next = pendingProv[0];
    return (
      <div>
        <Onboarding />
        <div className="mb-14 pt-4 text-center">
          <p className="text-[13px] text-ink-muted capitalize">{today}</p>
          <h1 className="mt-3 text-[30px] font-medium leading-[1.15] tracking-[-0.02em] text-ink">
            {pendingProv.length > 0
              ? `${pendingProv.length} prov väntar på dig, ${userName}.`
              : `Allt är klart, ${userName}.`}
          </h1>
          {next && (
            <p className="mt-3 text-[15px] text-ink-secondary">
              Ta dem en i taget — WiseOS har gjort grovjobbet.
            </p>
          )}
        </div>

        {next && (
          <Link
            href="/review"
            className="group mx-auto mb-14 block max-w-lg rounded-2xl border border-ink-hairline bg-paper-raised p-7 transition-all hover:border-accent/40"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[12px] font-medium text-accent">Nästa i kön</div>
                <h2 className="mt-1.5 text-[19px] font-medium text-ink">{next.title}</h2>
                <p className="mt-1 text-[13.5px] text-ink-secondary">
                  {ownerName(next)} · {results.filter((r) => r.provId === next.id).length} elever
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition-transform group-hover:translate-x-0.5">
                <LineIcon name="pen" className="h-5 w-5" />
              </span>
            </div>
          </Link>
        )}

        {gradingProv.length > 0 && (
          <p className="mb-14 text-center text-[13px] text-ink-muted">
            {gradingProv.length} prov rättas just nu — de dyker upp här när de är klara.
          </p>
        )}

        <div className="mx-auto max-w-lg space-y-1">
          <h2 className="hand mb-3 text-[22px] text-ink-secondary">Dina kurser</h2>
          {activeKurser.map((kurs) => (
            <Link
              key={kurs.id}
              href={`/courses/${kurs.id}`}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-[14px] transition-colors hover:bg-ink/[0.04]"
            >
              <span className="font-medium text-ink">{kurs.name}</span>
              <span className="text-[12.5px] text-ink-muted">{kurs.subject}</span>
            </Link>
          ))}
          {activeKurser.length === 0 && <DashboardEmptyState />}
        </div>
      </div>
    );
  }

  /* ================== A · ARKIVET — editorial ================== */
  return (
    <div>
      <Onboarding />
      <div className="mb-12">
        <h1 className="break-words text-[32px] font-medium leading-[1.15] tracking-[-0.015em] text-ink sm:text-[36px]">
          Välkommen tillbaka, {userName}
        </h1>
        <p className="mt-3 text-[14px] text-ink-secondary">
          {today && <span className="capitalize">{today}</span>}
          {today && " · "}
          {pendingProv.length > 0
            ? `${pendingProv.length} provbunt${pendingProv.length === 1 ? "" : "ar"} väntar på granskning`
            : "Inga prov att granska just nu"}
        </p>
      </div>

      {/* Det som väntar — prioriterad kö */}
      {pendingProv.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-5 text-[22px] font-medium text-ink">Det som väntar</h2>
          <div className="divide-y divide-ink-hairline border-y border-ink-hairline">
            {pendingProv.map((p) => {
              const prog = provProgress(p, results);
              const isGrading = p.status === "grading";
              return (
                <Link
                  key={p.id}
                  href="/review"
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-ink/[0.02] -mx-3 px-3 rounded"
                >
                  <div className="min-w-0">
                    <div className="text-[15.5px] font-medium text-ink">{p.title}</div>
                    <div className="mt-0.5 text-[13px] text-ink-muted">
                      {ownerName(p)}
                      {prog.total > 0 && ` · ${prog.done} av ${prog.total} granskade`}
                    </div>
                  </div>
                  <span className={`shrink-0 text-[13px] font-medium ${isGrading ? "text-ink-muted" : "text-accent"}`}>
                    {isGrading ? "Rättas…" : "Granska →"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Arkivregister */}
      <div className="grid grid-cols-1 gap-12 pb-10 lg:grid-cols-5 lg:gap-16">
        <section className="col-span-1 lg:col-span-3">
          <div className="mb-4 flex items-baseline justify-between border-b border-ink-hairline pb-3">
            <h2 className="text-[18px] font-medium text-ink">Kurser</h2>
            <Link href="/courses" className="text-[13px] text-ink-secondary underline decoration-ink/20 underline-offset-4 hover:text-ink">
              Ny kurs
            </Link>
          </div>
          {activeKurser.length === 0 ? (
            <DashboardEmptyState />
          ) : (
            <div>
              {activeKurser.map((kurs) => {
                const kursKlasser = klasser.filter((k) => k.kursId === kurs.id);
                const totalStudents = kursKlasser.reduce((sum, k) => sum + k.students.length, 0);
                return (
                  <Link
                    key={kurs.id}
                    href={`/courses/${kurs.id}`}
                    className="group flex items-baseline justify-between gap-4 border-b border-ink-hairline py-4 -mx-3 px-3 rounded transition-colors hover:bg-ink/[0.02]"
                  >
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium text-ink">{kurs.name}</div>
                      <div className="mt-0.5 text-[13px] text-ink-muted">
                        {kurs.subject} · {kursKlasser.length} {kursKlasser.length === 1 ? "klass" : "klasser"} · {totalStudents} elever
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="col-span-1 lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between border-b border-ink-hairline pb-3">
            <h2 className="text-[18px] font-medium text-ink">Klasser</h2>
            <Link href="/classes/new" className="text-[13px] text-ink-secondary underline decoration-ink/20 underline-offset-4 hover:text-ink">
              Ny klass
            </Link>
          </div>
          {klasser.length === 0 ? (
            <div className="py-4 text-[13.5px] text-ink-secondary">
              Inga klasser ännu — skapa en klass i en kurs.
            </div>
          ) : (
            <div>
              {klasser.map((k) => (
                <Link
                  key={k.id}
                  href={`/classes/${k.id}`}
                  className="group flex items-baseline justify-between gap-4 border-b border-ink-hairline py-3.5 -mx-3 px-3 rounded transition-colors hover:bg-ink/[0.02]"
                >
                  <span className="text-[14px] font-medium text-ink">{k.name}</span>
                  <span className="text-[12.5px] text-ink-muted">{k.students.length} elever</span>
                </Link>
              ))}
            </div>
          )}

          <h2 className="mb-4 mt-12 border-b border-ink-hairline pb-3 text-[18px] font-medium text-ink">
            Senast rättat
          </h2>
          {recentResults.length === 0 ? (
            <div className="py-4 text-[13.5px] text-ink-secondary">Ingen aktivitet ännu</div>
          ) : (
            <div>
              {recentResults.map((result) => {
                const resultProv = prov.find((p) => p.id === result.provId);
                const totalPoints = result.steps.reduce((sum, s) => sum + s.earnedPoints, 0);
                const maxPoints = result.steps.reduce((sum, s) => sum + s.maxPoints, 0);
                return (
                  <div key={result.id} className="flex items-baseline justify-between gap-3 border-b border-ink-hairline py-3.5">
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium text-ink">{result.studentName}</div>
                      <div className="text-[12.5px] text-ink-muted">{resultProv?.title || "Prov"}</div>
                    </div>
                    <span className="shrink-0 text-[13px] font-medium tabular-nums text-ink">
                      {totalPoints}/{maxPoints}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
