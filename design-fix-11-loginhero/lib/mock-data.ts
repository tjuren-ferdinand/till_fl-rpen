/**
 * DESIGN-POOL — statisk exempeldata. Inga riktiga elever, inga credentials.
 * Alla namn är påhittade. Muterbar i minnet så att formulär känns levande,
 * men inget sparas någonstans — allt nollställs vid omstart.
 */
import type {
  BackendClass,
  BackendCourse,
  BackendGradingResult,
  BackendGradingStep,
  BackendStudent,
  BackendTest,
} from "./api.types";

const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

// Liten transparent PNG som står för "skannad originalsida" i Workbench/print.
export const MOCK_SCAN_PAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const s = (id: string, name: string): BackendStudent => ({ id, name, identifier: null });

const KLASS_ELEVER = [
  "Elin Karlsson", "Viktor Ström", "Amina Hassan", "Lucas Berg", "Sara Lindqvist",
  "Omar Faruk", "Maja Nilsson", "Noa Eriksson", "Isak Holm", "Tova Åström",
];

const KURS_DELTAGARE = ["Frida Lund", "Elias Widell", "Wilma Chen"];

export const mockDb = {
  courses: [
    {
      id: "kurs-ma1c",
      name: "Matematik 1c",
      code: "MATMAT01c",
      subject: "Matematik",
      level: "Gymnasiet",
      description: "Algebra, funktioner och problemlösning.",
      gradeThresholds: { A: 90, B: 80, C: 65, D: 50, E: 35, F: 0 },
      students: KURS_DELTAGARE.map((n, i) => s(`kd-${i + 1}`, n)),
      createdAt: daysAgo(30),
    },
  ] as BackendCourse[],

  classes: [
    {
      id: "klass-ma1ca",
      name: "Ma1c A",
      kursId: "kurs-ma1c",
      students: KLASS_ELEVER.map((n, i) => s(`ke-${i + 1}`, n)),
      gradingParams: {
        allowPartialCredit: true,
        unitErrorPenalty: 0.5,
        roundingTolerance: 5,
        requireWorkShown: true,
        significantFigures: true,
        customRules: [],
      },
      gradeThresholds: { A: 90, B: 80, C: 65, D: 50, E: 35, F: 0 },
      createdAt: daysAgo(28),
    },
  ] as BackendClass[],

  tests: [
    {
      id: "prov-klass-1",
      klassId: "klass-ma1ca",
      kursId: null,
      title: "test_3",
      date: daysAgo(2).slice(0, 10),
      maxPoints: 10,
      facitMode: "none",
      facit: null,
      customParams: null,
      questions: [
        { id: "q1", number: "1", maxPoints: 2 },
        { id: "q2", number: "2", maxPoints: 2 },
        { id: "q3", number: "3", maxPoints: 3 },
        { id: "q4", number: "4", maxPoints: 3 },
      ],
      status: "review",
      createdAt: daysAgo(2),
    },
    {
      id: "prov-kurs-1",
      klassId: null,
      kursId: "kurs-ma1c",
      title: "Kursprov — Algebra",
      date: daysAgo(5).slice(0, 10),
      maxPoints: 10,
      facitMode: "uploaded",
      facit: "1) x = 5\n2) 6x + 7\n3) x₁ = 3, x₂ = −5\n4) 48 cm³",
      customParams: null,
      questions: [
        { id: "q1", number: "1", maxPoints: 2 },
        { id: "q2", number: "2", maxPoints: 2 },
        { id: "q3", number: "3", maxPoints: 3 },
        { id: "q4", number: "4", maxPoints: 3 },
      ],
      status: "published",
      createdAt: daysAgo(5),
    },
  ] as BackendTest[],

  results: [] as BackendGradingResult[],
};

// --- Stegmallar — speglar en verklig rättning av Ma1c-provet ----------------

const Q = [
  { no: "1", text: "Lös ekvationen 3x − 7 = 8", max: 2, answer: "x = 5" },
  { no: "2", text: "Förenkla uttrycket 2(3x + 4) − 1", max: 2, answer: "6x + 7" },
  { no: "3", text: "Lös andragradsekvationen x² + 2x − 15 = 0", max: 3, answer: "x₁ = 3, x₂ = −5" },
  { no: "4", text: "Beräkna lådans volym (4 × 3 × 4 cm)", max: 3, answer: "48 cm³" },
];

type StepStatus = "correct" | "partial" | "incorrect" | "needs_review";

function mkStep(
  resultId: string,
  i: number,
  status: StepStatus,
  earned: number,
  work: string,
  feedback: string,
): BackendGradingStep {
  const q = Q[i];
  return {
    id: `${resultId}-s${i + 1}`,
    questionId: q.no,
    label: `Uppgift ${q.no}`,
    questionText: q.text,
    maxPoints: q.max,
    earnedPoints: earned,
    status,
    feedback,
    studentWork: work,
    correctAnswer: q.answer,
    found: true,
    transcriptionConfidence: 0.96,
    annotation: status === "correct" ? { summary: feedback, issues: [], evidence: [feedback], suggestions: [] } : undefined,
    error: status === "needs_review" ? null : null,
    outsideAnswerKey: false,
    sourceRegions: [],
    mathVerification: null,
    feedbackProvider: null,
    reviewed: false,
    reviewedAt: null,
    teacherNote: null,
    aiEarnedPoints: null,
    aiStatus: null,
  };
}

function mkResult(
  testId: string,
  studentId: string,
  studentName: string,
  statuses: StepStatus[],
  earned: number[],
  opts: { ambiguous?: boolean } = {},
): BackendGradingResult {
  const id = `res-${testId}-${studentId}`;
  const works = [
    "3x − 7 = 8 → 3x = 15 → x = 5",
    "2(3x + 4) − 1 = 6x + 8 − 1 = 6x + 7",
    "x = −1 ± √(1 + 15) = −1 ± 4 → x₁ = 3, x₂ = −5",
    "V = 4 · 3 · 4 = 48 cm³",
  ];
  const steps = statuses.map((st, i) =>
    mkStep(
      id, i, st, earned[i], works[i],
      st === "correct" ? "Korrekt lösning med tydlig uträkning."
        : st === "partial" ? "Rätt metod men slarvfel i beräkningen."
        : st === "incorrect" ? "Svaret stämmer inte — se facit."
        : "Handstilen är svårläst — kontrollera mot originalet.",
    ),
  );
  const total = steps.reduce((a, st) => a + st.earnedPoints, 0);
  const max = steps.reduce((a, st) => a + st.maxPoints, 0);
  return {
    id,
    provId: testId,
    studentId,
    studentName,
    identificationMethod: opts.ambiguous ? "name_field_ambiguous" : "name_field",
    identificationConfidence: opts.ambiguous ? 0.72 : 0.97,
    steps,
    totalScore: total,
    maxScore: max,
    percentage: max ? Math.round((total / max) * 100) : 0,
    grade: null,
    feedback: null,
    scannedAt: now,
    gradedAt: now,
    scanPages: [MOCK_SCAN_PAGE],
    document: {
      pageCount: 1,
      model: "gemini-3.6-flash",
      latencyMs: 4200,
      attempts: 1,
      questionsFound: statuses.length,
      questionsExpected: 4,
      needsReviewCount: statuses.filter((x) => x === "needs_review").length,
      error: null,
      answerKeySource: "inferred_question_sheet",
      documentType: "student_submission",
    },
    customInstructions: null,
  };
}

// Klassprovet — samma tiotal elever som i den riktiga testkörningen.
const classStatuses: Record<string, [StepStatus[], number[]]> = {
  "ke-1":  [["correct", "correct", "correct", "correct"], [2, 2, 3, 3]],
  "ke-2":  [["correct", "partial", "correct", "correct"], [2, 1, 3, 3]],
  "ke-3":  [["correct", "correct", "correct", "correct"], [2, 2, 3, 3]],
  "ke-4":  [["needs_review", "incorrect", "partial", "correct"], [0, 0, 1.5, 3]],
  "ke-5":  [["correct", "incorrect", "incorrect", "correct"], [2, 0, 0, 3]],
  "ke-6":  [["correct", "correct", "correct", "correct"], [2, 2, 3, 3]],
  "ke-7":  [["correct", "correct", "incorrect", "correct"], [2, 2, 0, 3]],
  "ke-8":  [["correct", "correct", "correct", "partial"], [2, 2, 3, 2.5]],
  "ke-9":  [["correct", "incorrect", "incorrect", "incorrect"], [2, 0, 0, 0]],
  "ke-10": [["correct", "correct", "correct", "correct"], [2, 2, 3, 3]],
};

mockDb.classes[0].students.forEach((st) => {
  const [statuses, earned] = classStatuses[st.id];
  mockDb.results.push(
    mkResult("prov-klass-1", st.id, st.name, statuses, earned, { ambiguous: st.id === "ke-4" }),
  );
});

// Provblanketten — flaggas som referensdokument, inte elev.
mockDb.results.push({
  id: "res-prov-klass-1-blankett",
  provId: "prov-klass-1",
  studentId: null,
  studentName: "Provblankett",
  identificationMethod: "name_field",
  identificationConfidence: 1,
  steps: [],
  totalScore: 0,
  maxScore: 0,
  percentage: 0,
  grade: null,
  feedback: null,
  scannedAt: now,
  gradedAt: now,
  scanPages: [MOCK_SCAN_PAGE],
  document: {
    pageCount: 1,
    model: "gemini-3.6-flash",
    latencyMs: 1800,
    attempts: 1,
    questionsFound: 0,
    questionsExpected: 4,
    needsReviewCount: 0,
    error: null,
    answerKeySource: "inferred_question_sheet",
    documentType: "not_student_submission",
  },
  customInstructions: null,
});

// Kursprovet — tre deltagare utan klass.
const courseStatuses: [StepStatus[], number[]][] = [
  [["correct", "correct", "correct", "correct"], [2, 2, 3, 3]],
  [["correct", "partial", "correct", "correct"], [2, 1, 3, 3]],
  [["correct", "incorrect", "needs_review", "correct"], [2, 0, 0, 3]],
];
mockDb.courses[0].students.forEach((st, i) => {
  const [statuses, earned] = courseStatuses[i];
  const r = mkResult("prov-kurs-1", st.id, st.name, statuses, earned);
  mockDb.results.push(r);
});
