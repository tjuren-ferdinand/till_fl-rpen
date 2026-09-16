"use client";

import LineIcon from "@/components/LineIcon";
import Link from "next/link";
import { actions, resolveKurs, useStore, DEFAULT_GRADING_PARAMS, type Klass } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Surface from "@/components/ui/Surface";
import EmptyState from "@/components/ui/EmptyState";
import Breadcrumb from "@/components/ui/Breadcrumb";
import StatusBadge from "@/components/ui/StatusBadge";
import GradingWizard from "@/components/GradingWizard";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const kursId = params.id as string;

  const kurser = useStore((s) => s.kurser);
  const klasser = useStore((s) => s.klasser);
  const prov = useStore((s) => s.prov);
  const results = useStore((s) => s.results);
  const hydrated = useStore((s) => s.hydrated);

  const kurs = resolveKurs(kurser, kursId);
  const kursKlasser = klasser.filter((k) => k.kursId === kursId);
  const kursProv = prov.filter((p) => p.kursId === kursId);
  const deltagare = kurs?.isCustom ? kurs.students : [];

  const [wizardOpen, setWizardOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Kursdetalj hämtar färska deltagare — listvyn kan vara äldre.
  useEffect(() => {
    if (hydrated && kurs?.isCustom) {
      void actions.loadKurs(kursId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, kursId, kurs?.isCustom]);

  if (!kurs) {
    return <div className="text-ink-secondary">Kursen hittades inte</div>;
  }

  const totalStudents =
    kursKlasser.reduce((sum, k) => sum + k.students.length, 0) + deltagare.length;

  const addStudent = async () => {
    const name = studentName.trim();
    if (!name) return;
    setAddingStudent(true);
    setStudentError(null);
    try {
      await actions.addCourseStudent(kursId, { name });
      setStudentName("");
    } catch (e) {
      setStudentError((e as Error).message);
    } finally {
      setAddingStudent(false);
    }
  };

  // Syntetisk klass-form åt GradingWizard — i kursläge används `kurs`-propen
  // för lagring och navigering, `klass` fyller bara komponentens form.
  const klassLike: Klass = {
    id: kurs.id,
    name: kurs.name,
    kursId: kurs.id,
    students: deltagare,
    gradingParams: { ...DEFAULT_GRADING_PARAMS },
    gradeThresholds: kurs.gradeThresholds,
  };

  return (
    <div className="space-y-10">
      <div>
        <Breadcrumb
          items={[{ label: "Kurser", href: "/courses" }, { label: kurs.name }]}
          className="mb-6"
        />
        <PageHeader
          eyebrow={kurs.code}
          title={kurs.name}
          subtitle={kurs.description}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setWizardOpen(true)} className="btn-primary inline-flex items-center gap-1.5">
                Rätta nytt prov
              </button>
              <Link href={`/classes/new?kursId=${kursId}`} className="btn-secondary inline-flex items-center gap-1.5">
                Skapa klass
              </Link>
            </div>
          }
        />

        {/* Stats — integrated row, not boxed widgets */}
        <div className="mt-8 flex items-center gap-12 border-t border-ink-hairline pt-6">
          <div>
            <div className="text-[24px] font-medium tracking-[-0.01em] text-ink tabular-nums">
              {kursKlasser.length}
            </div>
            <div className="mt-0.5 text-[12.5px] text-ink-muted">
              {kursKlasser.length === 1 ? "klass" : "klasser"}
            </div>
          </div>
          <div>
            <div className="text-[24px] font-medium tracking-[-0.01em] text-ink tabular-nums">
              {totalStudents}
            </div>
            <div className="mt-0.5 text-[12.5px] text-ink-muted">elever totalt</div>
          </div>
          <div>
            <div className="text-[24px] font-medium tracking-[-0.01em] text-ink tabular-nums">
              {kursProv.length}
            </div>
            <div className="mt-0.5 text-[12.5px] text-ink-muted">kursprov</div>
          </div>
        </div>
      </div>

      {/* Kursprov — prov direkt på kursen, utan klasskrav */}
      <section>
        <h2 className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-muted">
          Kursprov
        </h2>
        {kursProv.length === 0 ? (
          <EmptyState
            icon="file"
            title="Inga kursprov ännu"
            description="Ett kursprov rättas för hela kursen — för deltagare som inte tillhör en gemensam klass."
            action={
              <button onClick={() => setWizardOpen(true)} className="btn-primary">
                Rätta nytt prov
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {kursProv.map((p) => {
              const provResults = results.filter((r) => r.provId === p.id);
              return (
                <Surface key={p.id} href={`/courses/${kursId}/grade/${p.id}`} padding="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium truncate text-ink">{p.title}</div>
                      <div className="mt-1 text-[12px] text-ink-muted">
                        {new Date(p.createdAt).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <StatusBadge status={p.status as string} />
                  </div>
                  <div className="mt-4 text-[12.5px] text-ink-secondary">
                    <strong className="font-medium text-ink">{provResults.length}</strong> elever
                  </div>
                </Surface>
              );
            })}
          </div>
        )}
      </section>

      {/* Kursdeltagare — elever direkt på kursen */}
      {kurs.isCustom && (
        <section>
          <h2 className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-muted">
            Deltagare ({deltagare.length})
          </h2>
          <div className="rounded-[16px] bg-paper-raised border border-ink-hairline shadow-soft">
            <div className="flex gap-2 border-b border-ink-hairline p-4">
              <input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void addStudent(); }}
                placeholder="Lägg till deltagare — för- och efternamn"
                className="input flex-1"
              />
              <button
                onClick={() => void addStudent()}
                disabled={addingStudent || !studentName.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Lägg till
              </button>
            </div>
            {studentError && (
              <div className="px-4 pt-3 text-[12.5px] text-state-danger">{studentError}</div>
            )}
            {deltagare.length === 0 ? (
              <div className="px-4 py-6 text-[13px] text-ink-muted">
                Inga deltagare ännu. Deltagare här kan skriva kursprov utan att tillhöra en klass —
                namnet används för automatisk matchning vid rättning.
              </div>
            ) : (
              <ul className="divide-y divide-ink-hairline">
                {deltagare.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="h-8 w-8 shrink-0 rounded-full grid place-items-center text-[12px] font-medium bg-ink/10 text-ink-secondary">
                      {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    <span className="flex-1 truncate text-[13.5px] text-ink">{s.name}</span>
                    {s.identifier && (
                      <span className="text-[11px] text-ink-muted">{s.identifier}</span>
                    )}
                    <button
                      onClick={() => void actions.deleteCourseStudent(kursId, s.id)}
                      aria-label={`Ta bort ${s.name}`}
                      className="grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-ink/5 hover:text-state-danger"
                    >
                      <LineIcon name="x" className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Classes */}
      <section>
        <h2 className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-muted">
          Klasser som läser {kurs.name}
        </h2>

        {kursKlasser.length === 0 ? (
          <EmptyState
            icon="graduation-cap"
            title="Inga klasser ännu"
            description={`Skapa en klass för ${kurs.name}.`}
            action={
              <Link href={`/classes/new?kursId=${kursId}`} className="btn-primary">
                Skapa klass
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kursKlasser.map((klass) => {
              const klassProv = prov.filter((p) => p.klassId === klass.id);

              return (
                <Surface key={klass.id} href={`/classes/${klass.id}`} padding="p-5" className="relative">
                  <div className="absolute right-4 top-4 text-ink-muted/50 transition-colors group-hover:text-ink-secondary">
                    <LineIcon name="graduation-cap" className="h-5 w-5" />
                  </div>
                  <h3 className="text-[15px] font-medium text-ink">{klass.name}</h3>
                  <div className="mt-3 flex items-center gap-4 text-[13px] text-ink-secondary">
                    <span className="flex items-center gap-1.5">
                      <LineIcon name="users" className="h-3.5 w-3.5 opacity-70" />
                      {klass.students.length} elever
                    </span>
                    <span>{klassProv.length} prov</span>
                  </div>
                  {klassProv.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-ink-hairline">
                      <div className="text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                        Senaste prov
                      </div>
                      <div className="mt-1 text-[13px] font-medium text-ink-secondary truncate">
                        {klassProv[klassProv.length - 1].title}
                      </div>
                    </div>
                  )}
                </Surface>
              );
            })}
          </div>
        )}
      </section>

      <GradingWizard
        klass={klassLike}
        kurs={kurs.isCustom ? kurs : undefined}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onStarted={(provId) => router.push(`/courses/${kurs.id}/grade/${provId}`)}
      />
    </div>
  );
}
