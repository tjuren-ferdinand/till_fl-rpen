"use client";

import { useEffect, useState } from "react";
import { useStore, actions, type Prov, type StudentResult, type Klass, type Question } from "@/lib/store";
import { useTheme, type ReviewLayout } from "@/lib/theme";
import { useDirection } from "@/lib/direction";
import Surface from "./ui/Surface";
import EmptyState from "./ui/EmptyState";
import StatusBadge from "./ui/StatusBadge";
import LineIcon from "./LineIcon";
import MathText from "./Math";
import PublishResultsModal from "./PublishResultsModal";
import "katex/dist/katex.min.css";

export default function ReviewWorkbench() {
  const { reviewLayout } = useTheme();
  const { direction } = useDirection();
  const prov = useStore((s) => s.prov);
  const results = useStore((s) => s.results);
  const klasser = useStore((s) => s.klasser);
  const [selectedProv, setSelectedProv] = useState<Prov | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [editingStep, setEditingStep] = useState<{ resultId: string; stepId: string } | null>(null);
  const [editPoints, setEditPoints] = useState<string>("");

  // Prov in the review pipeline: currently grading or ready for review.
  // Published prov does not appear here — it is shown on the results/elev side.
  const completedProv = prov.filter((p) => p.status === "grading" || p.status === "review");

  useEffect(() => {
    if (selectedProv && !completedProv.some((p) => p.id === selectedProv.id)) {
      setSelectedProv(null);
      setShowPublish(false);
    }
  }, [completedProv, selectedProv]);

  useEffect(() => {
    // Kö-riktningarna (bänken, söndagskväll) hoppar direkt in i det första
    // provet som väntar — inget extra klick mellan lista och arbete.
    if (!selectedProv && direction !== "arkiv") {
      const next = completedProv.find((p) => p.status === "review");
      if (next) setSelectedProv(next);
    }
  }, [completedProv, selectedProv, direction]);

  useEffect(() => {
    // Poll while any prov is still being graded so the list becomes
    // clickable as soon as AI grading completes — no page reload needed.
    if (!completedProv.some((p) => p.status === "grading")) return;

    const timer = setInterval(() => {
      actions.hydrate().catch(() => {});
    }, 5000);

    return () => clearInterval(timer);
  }, [completedProv]);

  const getKlass = (provId: string): Klass | undefined => {
    const p = prov.find((pr) => pr.id === provId);
    return p ? klasser.find((k) => k.id === p.klassId) : undefined;
  };

  // Ägarnamn för visning — klassprov via klass, kursprov via kurs.
  const kurser = useStore((s) => s.kurser);
  const getOwnerName = (provId: string): string | undefined => {
    const p = prov.find((pr) => pr.id === provId);
    if (!p) return undefined;
    return (
      klasser.find((k) => k.id === p.klassId)?.name ??
      kurser.find((k) => k.id === p.kursId)?.name
    );
  };

  const getProvResults = (provId: string): StudentResult[] =>
    results.filter((r) => r.provId === provId);

  const startEditStep = (result: StudentResult, stepId: string) => {
    const step = result.steps.find((s) => s.id === stepId);
    if (!step) return;
    setEditingStep({ resultId: result.id, stepId });
    setEditPoints(String(step.earnedPoints));
  };

  const saveStep = () => {
    if (!editingStep) return;
    const result = results.find((r) => r.id === editingStep.resultId);
    const step = result?.steps.find((s) => s.id === editingStep.stepId);
    if (!step) return;
    const points = Number(editPoints);
    if (Number.isNaN(points) || points < 0 || points > step.maxPoints) return;
    actions.updateStep(editingStep.resultId, editingStep.stepId, {
      earnedPoints: points,
      status: points <= 0 ? "incorrect" : points >= step.maxPoints ? "correct" : "partial",
      reviewed: true,
      reviewedAt: new Date().toISOString(),
      aiEarnedPoints: step.aiEarnedPoints ?? step.earnedPoints,
      aiStatus: step.aiStatus ?? step.status,
    });
    setEditingStep(null);
  };

  if (completedProv.length === 0) {
    return (
      <EmptyState
        icon="edit"
        title="Inga rättade prov att granska"
        description="När ett prov har rättats dyker det upp här för granskning och publicering."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {completedProv.map((p) => {
          const klass = getKlass(p.id);
          const provResults = getProvResults(p.id);
          const isGrading = p.status === "grading";

          return (
            <Surface
              key={p.id}
              onClick={isGrading ? undefined : () => setSelectedProv(p)}
              interactive={!isGrading}
              className={isGrading ? "opacity-60" : ""}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-medium text-ink">{p.title}</h3>
                  <p className="mt-0.5 text-[13px] text-ink-secondary">{klass?.name ?? getOwnerName(p.id)}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-4 flex items-center gap-2 text-[13px] text-ink-muted">
                <LineIcon name="users" className="h-3.5 w-3.5" />
                {isGrading ? "Rättar..." : `${provResults.length} elever`}
              </div>
            </Surface>
          );
        })}
      </div>

      {selectedProv && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[20px] font-medium tracking-[-0.01em] text-ink">
                {selectedProv.title}
              </h3>
              <p className="mt-1 text-[13.5px] text-ink-secondary">
                {getProvResults(selectedProv.id).length} elever ·{" "}
                {selectedProv.status === "published" ? "publicerat" : "redo för granskning"}
              </p>
            </div>
            {selectedProv.status === "review" && (
              <button onClick={() => setShowPublish(true)} className="btn-primary">
                <LineIcon name="check" className="h-4 w-4" />
                Publicera resultat
              </button>
            )}
          </div>

          {(() => {
            const provResults = getProvResults(selectedProv.id);
            const questions = deriveQuestions(provResults);
            const isDone = (r: StudentResult) =>
              r.steps.filter((s) => !s.error && s.found !== false).every((s) => s.reviewed);
            const firstUnreviewed = provResults.find((r) => !isDone(r)) ?? provResults[0];
            const current =
              provResults.find((r) => r.id === selectedResultId) ?? firstUnreviewed;
            const idx = current ? provResults.indexOf(current) : -1;
            const cardProps = {
              questions,
              klass: getKlass(selectedProv.id),
              editingStep,
              editPoints,
              onEditStep: startEditStep,
              onPointsChange: setEditPoints,
              onSave: saveStep,
              onCancel: () => setEditingStep(null),
            };

            /* ---------- B · BÄNKEN — master-detail med kö ---------- */
            if (direction === "bank" && current) {
              return (
                <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                  <aside className="overflow-hidden rounded-lg border border-ink-hairline bg-paper-raised">
                    <div className="border-b border-ink-hairline px-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
                      Kö — {provResults.filter(isDone).length}/{provResults.length} klara
                    </div>
                    <div className="max-h-[560px] overflow-auto">
                      {provResults.map((r) => {
                        const done = isDone(r);
                        const active = r.id === current.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelectedResultId(r.id)}
                            className={`flex w-full items-center justify-between gap-2 border-b border-ink-hairline px-3 py-2.5 text-left text-[13px] transition-colors last:border-0 ${
                              active ? "bg-ink/[0.05] font-medium text-ink" : "text-ink-secondary hover:bg-ink/[0.03]"
                            }`}
                          >
                            <span className="truncate">{r.studentName}</span>
                            {done ? (
                              <LineIcon name="check" className="h-3.5 w-3.5 shrink-0 text-state-success" />
                            ) : (
                              <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-muted">
                                {r.steps.filter((s) => s.reviewed).length}/{r.steps.length}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </aside>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-[12px] text-ink-muted">
                        Elev {idx + 1}/{provResults.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = provResults.find((r, i) => i > idx && !isDone(r));
                          if (next) setSelectedResultId(next.id);
                        }}
                        className="btn-secondary !py-1.5 text-[12.5px]"
                      >
                        Nästa ogranskade →
                      </button>
                    </div>
                    <ResultCard key={current.id} result={current} {...cardProps} layout={reviewLayout} />
                  </div>
                </div>
              );
            }

            /* ---------- C · SÖNDAGSKVÄLL — en i taget ---------- */
            if (direction === "kvall" && current) {
              return (
                <div className="mx-auto max-w-2xl">
                  <div className="mb-5 flex items-center justify-between text-[13px] text-ink-muted">
                    <button
                      type="button"
                      disabled={idx <= 0}
                      onClick={() => setSelectedResultId(provResults[idx - 1].id)}
                      className="btn-tertiary disabled:opacity-40"
                    >
                      ← Föregående
                    </button>
                    <span className="tabular-nums">
                      {idx + 1} av {provResults.length}
                    </span>
                    <button
                      type="button"
                      disabled={idx >= provResults.length - 1}
                      onClick={() => setSelectedResultId(provResults[idx + 1].id)}
                      className="btn-tertiary disabled:opacity-40"
                    >
                      Nästa →
                    </button>
                  </div>
                  <ResultCard key={current.id} result={current} {...cardProps} layout={reviewLayout} />
                  {isDone(current) && idx < provResults.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setSelectedResultId(provResults[idx + 1].id)}
                      className="btn-primary mx-auto mt-6 flex"
                    >
                      {current.studentName} är klar — nästa elev
                    </button>
                  )}
                </div>
              );
            }

            /* ---------- A · ARKIVET — dokumentvy ---------- */
            return (
              <div className="space-y-4">
                {provResults.map((result) => (
                  <ResultCard key={result.id} result={result} {...cardProps} layout={reviewLayout} />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {selectedProv && (
        <PublishResultsModal
          isOpen={showPublish}
          onClose={() => setShowPublish(false)}
          prov={selectedProv}
          results={getProvResults(selectedProv.id)}
        />
      )}
    </div>
  );
}

function deriveQuestions(results: StudentResult[]): Question[] {
  const seen = new Map<string, Question>();
  for (const result of results) {
    for (const step of result.steps) {
      if (!seen.has(step.questionId)) {
        seen.set(step.questionId, {
          id: `q-${step.questionId}`,
          number: step.questionId,
          maxPoints: step.maxPoints,
        });
      }
    }
  }
  return Array.from(seen.values());
}

function ResultCard({
  result,
  questions,
  klass,
  editingStep,
  editPoints,
  onEditStep,
  onPointsChange,
  onSave,
  onCancel,
  layout = "split",
}: {
  result: StudentResult;
  questions: Question[];
  klass?: Klass;
  editingStep: { resultId: string; stepId: string } | null;
  editPoints: string;
  onEditStep: (result: StudentResult, stepId: string) => void;
  onPointsChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  layout?: ReviewLayout;
}) {
  const isImage = (url: string) => /^data:image\/(png|jpeg|jpg|webp|gif);/.test(url);
  const scanPage = result.scanPages?.[0];
  const showScan = layout !== "compact" && !!scanPage;

  const scanBlock = scanPage ? (
    <div className={layout === "stacked" ? "border-t border-ink-hairline pt-4" : "border-t border-ink-hairline pt-4"}>
      <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-ink-muted mb-2">
        Originalskanning
      </div>
      {isImage(scanPage) ? (
        <img
          src={scanPage}
          alt="Elevens originalskanning"
          className={`rounded-xl border border-ink-hairline object-contain ${
            layout === "stacked" ? "max-h-64 w-full" : "max-h-96"
          }`}
        />
      ) : (
        <a
          href={scanPage}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[10px] text-sm text-ink underline underline-offset-4 hover:decoration-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          Visa originalfil
        </a>
      )}
    </div>
  ) : null;

  return (
    <Surface padding="p-5">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-[12px] bg-ink/[0.04] border border-ink-hairline grid place-items-center text-[15px] font-medium text-ink">
          {result.studentName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-medium text-ink">{result.studentName}</h4>
          <p className="text-[13px] text-ink-secondary">
            {result.totalScore}/{result.maxScore} poäng · {result.percentage}%
          </p>
        </div>
        {(() => {
          const reviewable = result.steps.filter((s) => !s.error && s.found !== false);
          const reviewed = reviewable.filter((s) => s.reviewed).length;
          if (!reviewable.length) return null;
          return reviewed === reviewable.length ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-state-success/10 px-2.5 py-1 text-[11px] font-medium text-state-success ring-1 ring-state-success/20">
              <LineIcon name="check" className="h-3 w-3" />
              Granskad
            </span>
          ) : (
            <span className="shrink-0 text-[11px] text-ink-muted tabular-nums">
              {reviewed}/{reviewable.length} granskade
            </span>
          );
        })()}
      </div>

      {layout === "stacked" && showScan && <div className="mt-5">{scanBlock}</div>}

      <div className={layout === "split" ? "mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5" : "mt-0"}>
      {layout === "split" && showScan && scanBlock}

      <div className="mt-5 border-t border-ink-hairline pt-4">
        <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-ink-muted mb-3">
          Uppgifter
        </div>
        <div className={layout === "compact" ? "space-y-2" : "space-y-3"}>
          {questions.map((q) => {
            const step = result.steps.find((s) => s.questionId === q.number);
            const status = step?.status ?? "pending";
            const label = step?.label ?? `Uppgift ${q.number}`;
            const maxPoints = step?.maxPoints ?? q.maxPoints;
            const earnedPoints = step?.earnedPoints ?? 0;
            const isEditing =
              step && editingStep?.resultId === result.id && editingStep?.stepId === step.id;
            return (
              <div
                key={step ? step.id : `q-${q.id}`}
                className={`flex items-start justify-between gap-4 rounded-[10px] bg-paper-secondary border border-ink-hairline ${
                  layout === "compact" ? "p-2.5" : "p-3"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-ink">{label}</span>
                    <span
                      className={`shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        status === "correct"
                          ? "bg-state-success/10 text-state-success border-state-success/20"
                          : status === "partial"
                            ? "bg-state-warning/10 text-state-warning border-state-warning/20"
                            : status === "incorrect"
                              ? "bg-state-danger/10 text-state-danger border-state-danger/20"
                              : status === "needs_review"
                                ? "bg-state-warning/10 text-state-warning border-state-warning/20"
                                : "bg-ink/[0.04] text-ink-muted border-ink-hairline"
                      }`}
                    >
                      {status === "correct"
                        ? "Rätt"
                        : status === "partial"
                          ? "Delvis"
                          : status === "incorrect"
                            ? "Fel"
                            : status === "needs_review"
                              ? "Behöver granskas"
                              : "Väntar"}
                    </span>
                    {step?.reviewed && (
                      <span title="Granskad av lärare" className="shrink-0">
                        <LineIcon name="check" className="h-3.5 w-3.5 text-state-success" />
                      </span>
                    )}
                  </div>
                  {layout !== "compact" && (
                    <>
                      {step?.questionText && (
                        <p className="mt-1.5 text-[12.5px] text-ink-secondary leading-relaxed">
                          <span className="font-medium text-ink">Fråga:</span> <MathText content={step.questionText} />
                        </p>
                      )}
                      {step?.studentWork !== undefined && (
                        <p className="mt-1 text-[12.5px] text-ink-secondary leading-relaxed">
                          <span className="font-medium text-ink">Elevens svar:</span> <MathText content={step.studentWork || "(inte extraherat)"} mode="transcription" />
                        </p>
                      )}
                      {step?.correctAnswer && (
                        <p className="mt-1 text-[12.5px] text-ink-secondary leading-relaxed">
                          <span className="font-medium text-ink">Facit:</span> <MathText content={step.correctAnswer} mode="transcription" />
                        </p>
                      )}
                      {step?.feedback && (
                        <p className="mt-1 text-[12.5px] text-ink-secondary leading-relaxed">
                          <span className="font-medium text-ink">AI-analys:</span> <MathText content={step.feedback} />
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editPoints}
                        onChange={(e) => onPointsChange(e.target.value)}
                        className="input w-20 h-8 py-1 text-center"
                        min={0}
                        max={maxPoints}
                      />
                      <span className="text-[13px] text-ink-muted">/ {maxPoints}</span>
                      <button onClick={onSave} className="btn-primary h-8 px-2.5">
                        <LineIcon name="check" className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={onCancel} className="btn-secondary h-8 px-2.5">
                        <LineIcon name="x" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : step ? (
                    <button
                      onClick={() => onEditStep(result, step.id)}
                      className="flex items-center gap-2 text-[13px] text-ink-secondary hover:text-ink"
                    >
                      <LineIcon name="pen" className="h-3.5 w-3.5" />
                      {earnedPoints} / {maxPoints}
                    </button>
                  ) : (
                    <span className="text-[13px] text-ink-muted">— / {maxPoints}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </Surface>
  );
}
