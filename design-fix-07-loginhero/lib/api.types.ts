// Pool-läge: inga nätverksanrop — typerna delas, implementationen är mockad.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";





export type OcrResult = { latex: string; text: string; confidence: number; provider: string; status: "completed" | "degraded" };
export type AnswerKeyItem = {
  question_number: string;
  question_text: string;
  final_answer: string;
  acceptable_answers?: string[];
  derivation_steps: string[];
  important_concepts?: string[];
  reasoning_requirements?: string[];
  mathematical_verification?: boolean | null;
  max_points: number;
};

// ---------------------------------------------------------------------------
// KANONISKT RESULTATSCHEMA
// Detta speglar exakt backendens app/schemas.py. Frontenden härleder INTE egna
// tolkningar av resultatet och hittar aldrig på innehåll som backend inte skickat.
// ---------------------------------------------------------------------------

export type GradingStatus = "correct" | "partial" | "incorrect" | "needs_review";

export type SourceRegion = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Strukturerad AI-annotering. Varje punkt refererar till elevens faktiska arbete. */
export type Annotation = {
  summary: string;
  evidence: string[];
  issues: string[];
  suggestions: string[];
};

export type Assessment = {
  status: GradingStatus;
  points: number;
  maxPoints: number;
  confidence: number;
};

export type MathVerification = {
  provider: string;
  status: "not_applicable" | "verified" | "not_equivalent" | "degraded" | "unavailable" | "failed";
  isEquivalent: boolean | null;
  confidence: number;
  message: string;
};

export type QuestionResult = {
  questionNumber: string;
  /** false = uppgiften finns inte i dokumentet. Oläslig handstil ger true + låg confidence. */
  found: boolean;
  /** false = uppgiften hittades i bilden men saknas i facit. */
  inAnswerKey: boolean;
  questionText: string;
  studentWork: string;
  transcriptionConfidence: number;
  correctAnswer: string;
  assessment: Assessment;
  feedback: string;
  annotation: Annotation;
  sourceRegions: SourceRegion[];
  mathVerification: MathVerification;
  feedbackProvider: string;
  /** Satt när ett tekniskt fel hindrade bedömning. */
  error: string | null;
  pointsTeacher: number | null;
  teacherComment: string | null;
  reviewStatus: string;
};

export type DocumentMeta = {
  pageCount: number;
  model: string;
  latencyMs: number;
  attempts: number;
  questionsExpected: number;
  questionsFound: number;
  needsReviewCount: number;
  error: string | null;
  /** "student_submission" | "not_student_submission" | "unverified" */
  documentType?: string;
  classificationReason?: string;
  /** "uploaded" | "generated" | "inferred_question_sheet" | "none" */
  answerKeySource?: string;
};

export type StudentDocumentResult = {
  id: string;
  provId: string;
  studentId: string | null;
  studentName: string;
  identificationMethod: string;
  identificationConfidence: number;
  scanPages: string[];
  /** Ursprungsfilnamn per sida — mappar frontendens filkort mot rätt resultat. */
  sourceFiles?: string[];
  document: DocumentMeta;
  questions: QuestionResult[];
};

export type BatchGradeResponse = {
  provId: string;
  results: StudentDocumentResult[];
  activeRules: string[];
  totalStudents: number;
  totalQuestions: number;
  integrations: Record<string, boolean | string>;
};

export type BatchGradeRequest = {
  provId: string;
  classGradingParameters: string;
  testSpecificParameters: string;
  answerKey: AnswerKeyItem[];
  files: File[];
  identificationMethod?: 'name_field' | 'qr_code' | 'barcode' | 'student_id';
};

// ============================================================================
// V2 — Kurs → Klass → Test(Prov) → GradingResult (backend-persisterat)
// ============================================================================

export type BackendStudent = { id: string; name: string; identifier: string | null };

export type BackendGradingParams = {
  allowPartialCredit: boolean;
  unitErrorPenalty: number;
  roundingTolerance: number;
  requireWorkShown: boolean;
  significantFigures: boolean;
  customRules: string[];
};

export type BackendGradeThresholds = { A: number; B: number; C: number; D: number; E: number; F: number };

export type BackendClass = {
  id: string;
  name: string;
  kursId: string;
  students: BackendStudent[];
  gradingParams: BackendGradingParams | null;
  gradeThresholds: BackendGradeThresholds | null;
  createdAt: string;
};

export type BackendCourse = {
  id: string;
  name: string;
  code: string;
  subject: string;
  level: string | null;
  description: string;
  gradeThresholds: BackendGradeThresholds;
  students: BackendStudent[];
  createdAt: string;
};

export type BackendQuestion = { id: string; number: string; maxPoints: number };

export type BackendTest = {
  id: string;
  /** Klass-prov har klassId, kurs-prov har kursId — aldrig båda. */
  klassId: string | null;
  kursId: string | null;
  title: string;
  date: string | null;
  maxPoints: number;
  facitMode: string;
  facit: string | null;
  customParams: string | null;
  questions: BackendQuestion[];
  status: string;
  createdAt: string;
};

export type BackendGradingStep = {
  id: string;
  questionId?: string | null;
  label: string;
  questionText?: string | null;
  maxPoints: number;
  earnedPoints: number;
  status: string;
  feedback?: string | null;
  studentWork?: string | null;
  correctAnswer?: string | null;
  found?: boolean | null;
  transcriptionConfidence?: number | null;
  annotation?: Annotation | null;
  error?: string | null;
  outsideAnswerKey?: boolean;
  sourceRegions?: SourceRegion[];
  mathVerification?: MathVerification | null;
  feedbackProvider?: string | null;
  /** Lärarens granskning — separerad från AI:s verdict. */
  reviewed?: boolean;
  reviewedAt?: string | null;
  teacherNote?: string | null;
  /** AI:s originalbedömning — snapshot vid första läraröverstyrning. */
  aiEarnedPoints?: number | null;
  aiStatus?: string | null;
};

export type BackendGradingResult = {
  id: string;
  provId: string;
  studentId: string | null;
  studentName: string;
  identificationMethod: string;
  identificationConfidence: number;
  steps: BackendGradingStep[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string | null;
  feedback: string | null;
  scannedAt: string;
  gradedAt: string | null;
  /** Listvyn returnerar inte scanPages — hämtas via GET /results/{id}. */
  scanPages?: string[];
  document: DocumentMeta | null;
  /** Elevspecifika AI-premisser vid om-rättning. */
  customInstructions?: string | null;
};

export type ClaudeAnalyzeResult = {
  feedback: string;
  isCorrect: boolean;
  confidence: number;
  /** Ärlig källa: 'gemini' | 'groq' | 'anthropic' | 'mock' (mock = alla AI-providers misslyckades). */
  provider: string;
};
