/**
 * DESIGN-POOL — mockad API-klient. Samma metodsignaturer som produktionens
 * api.ts men all data kommer från ./mock-data (minnet) — inga nätverksanrop,
 * ingen backend, inga credentials. Mutationer lever tills sidan laddas om.
 */
import { mockDb, MOCK_SCAN_PAGE } from "./mock-data";
import type {
  AnswerKeyItem,
  BackendClass,
  BackendCourse,
  BackendGradingResult,
  BackendGradingStep,
  BackendQuestion,
  BackendStudent,
  BackendTest,
  BatchGradeRequest,
  BatchGradeResponse,
  ClaudeAnalyzeResult,
  OcrResult,
  StudentDocumentResult,
} from "./api.types";

export * from "./api.types";

export const API_URL = "mock://design-pool";

const uid = () => `mock-${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const mustFindTest = (id: string) => {
  const t = mockDb.tests.find((x) => x.id === id);
  if (!t) throw new Error("Test not found");
  return t;
};

export const api = {
  // --- Classes / students ---
  listClasses: async () => clone(mockDb.classes),
  getClass: async (id: string) => {
    const found = mockDb.classes.find((c) => c.id === id);
    if (!found) throw new Error("Class not found");
    return clone(found);
  },
  createClass: async (data: {
    name: string;
    kursId: string;
    students?: { name: string; identifier?: string }[];
    gradingParams?: BackendClass["gradingParams"];
    gradeThresholds?: BackendClass["gradeThresholds"];
  }): Promise<BackendClass> => {
    const klass: BackendClass = {
      id: uid(),
      name: data.name,
      kursId: data.kursId,
      students: (data.students ?? []).map((x) => ({ id: uid(), name: x.name, identifier: x.identifier ?? null })),
      gradingParams: data.gradingParams ?? null,
      gradeThresholds: data.gradeThresholds ?? null,
      createdAt: now(),
    };
    mockDb.classes.unshift(klass);
    return clone(klass);
  },
  addStudent: async (classId: string, data: { name: string; identifier?: string }) => {
    const klass = mockDb.classes.find((c) => c.id === classId);
    if (!klass) throw new Error("Class not found");
    const student: BackendStudent = { id: uid(), name: data.name, identifier: data.identifier ?? null };
    klass.students.push(student);
    return clone(student);
  },
  updateClass: async (
    classId: string,
    data: { name?: string; gradingParams?: BackendClass["gradingParams"]; gradeThresholds?: BackendClass["gradeThresholds"] },
  ) => {
    const klass = mockDb.classes.find((c) => c.id === classId);
    if (!klass) throw new Error("Class not found");
    Object.assign(klass, data);
    return clone(klass);
  },
  deleteClass: async (classId: string) => {
    mockDb.classes = mockDb.classes.filter((c) => c.id !== classId);
    const dead = mockDb.tests.filter((t) => t.klassId === classId).map((t) => t.id);
    mockDb.tests = mockDb.tests.filter((t) => t.klassId !== classId);
    mockDb.results = mockDb.results.filter((r) => !dead.includes(r.provId));
  },
  // --- Courses ---
  listCourses: async () => clone(mockDb.courses),
  createCourse: async (data: {
    name: string;
    code?: string;
    subject: string;
    level?: string;
    description?: string;
    gradeThresholds?: BackendCourse["gradeThresholds"];
  }): Promise<BackendCourse> => {
    const course: BackendCourse = {
      id: uid(),
      name: data.name,
      code: data.code ?? "",
      subject: data.subject,
      level: data.level ?? null,
      description: data.description ?? "",
      gradeThresholds: data.gradeThresholds ?? { A: 90, B: 80, C: 65, D: 50, E: 35, F: 0 },
      students: [],
      createdAt: now(),
    };
    mockDb.courses.unshift(course);
    return clone(course);
  },
  deleteCourse: async (courseId: string) => {
    mockDb.courses = mockDb.courses.filter((c) => c.id !== courseId);
    const dead = mockDb.tests.filter((t) => t.kursId === courseId).map((t) => t.id);
    mockDb.tests = mockDb.tests.filter((t) => t.kursId !== courseId);
    mockDb.results = mockDb.results.filter((r) => !dead.includes(r.provId));
  },
  getCourse: async (courseId: string) => {
    const found = mockDb.courses.find((c) => c.id === courseId);
    if (!found) throw new Error("Course not found");
    return clone(found);
  },
  addCourseStudent: async (courseId: string, data: { name: string; identifier?: string }) => {
    const course = mockDb.courses.find((c) => c.id === courseId);
    if (!course) throw new Error("Course not found");
    const student: BackendStudent = { id: uid(), name: data.name, identifier: data.identifier ?? null };
    course.students.push(student);
    return clone(student);
  },
  deleteCourseStudent: async (courseId: string, studentId: string) => {
    const course = mockDb.courses.find((c) => c.id === courseId);
    if (course) course.students = course.students.filter((x) => x.id !== studentId);
  },
  listCourseTests: async (courseId: string) =>
    clone(mockDb.tests.filter((t) => t.kursId === courseId)),
  createCourseTest: async (courseId: string, data: Partial<BackendTest> & { title: string }) => {
    const test: BackendTest = {
      id: uid(),
      klassId: null,
      kursId: courseId,
      title: data.title,
      date: data.date ?? null,
      maxPoints: data.maxPoints ?? 0,
      facitMode: data.facitMode ?? "none",
      facit: data.facit ?? null,
      customParams: data.customParams ?? null,
      questions: data.questions ?? [],
      status: data.status ?? "draft",
      createdAt: now(),
    };
    mockDb.tests.unshift(test);
    return clone(test);
  },
  // --- Tests / Prov ---
  listAllTests: async () => clone(mockDb.tests),
  listTests: async (classId: string) =>
    clone(mockDb.tests.filter((t) => t.klassId === classId)),
  createTest: async (classId: string, data: Partial<BackendTest> & { title: string }) => {
    const test: BackendTest = {
      id: uid(),
      klassId: classId,
      kursId: null,
      title: data.title,
      date: data.date ?? null,
      maxPoints: data.maxPoints ?? 0,
      facitMode: data.facitMode ?? "none",
      facit: data.facit ?? null,
      customParams: data.customParams ?? null,
      questions: data.questions ?? [],
      status: data.status ?? "draft",
      createdAt: now(),
    };
    mockDb.tests.unshift(test);
    return clone(test);
  },
  getTest: async (testId: string) => clone(mustFindTest(testId)),
  updateTest: async (testId: string, data: Partial<BackendTest>) => {
    const test = mustFindTest(testId);
    Object.assign(test, data);
    return clone(test);
  },
  // --- Grading results ---
  listGradingResults: async (testId?: string) =>
    clone(testId ? mockDb.results.filter((r) => r.provId === testId) : mockDb.results),
  getResult: async (resultId: string) => {
    const found = mockDb.results.find((r) => r.id === resultId);
    if (!found) throw new Error("Result not found");
    return clone(found);
  },
  createResult: async (data: {
    testId: string;
    studentName: string;
    studentId?: string;
    identificationMethod?: string;
    identificationConfidence?: number;
    steps: BackendGradingStep[];
    totalScore: number;
    maxScore: number;
    percentage: number;
    grade?: string;
    feedback?: string;
  }) => {
    const result: BackendGradingResult = {
      id: uid(),
      provId: data.testId,
      studentId: data.studentId ?? null,
      studentName: data.studentName,
      identificationMethod: data.identificationMethod ?? "name_field",
      identificationConfidence: data.identificationConfidence ?? 0.9,
      steps: data.steps,
      totalScore: data.totalScore,
      maxScore: data.maxScore,
      percentage: data.percentage,
      grade: data.grade ?? null,
      feedback: data.feedback ?? null,
      scannedAt: now(),
      gradedAt: now(),
      scanPages: [MOCK_SCAN_PAGE],
      document: null,
      customInstructions: null,
    };
    mockDb.results.push(result);
    return clone(result);
  },
  updateResult: async (resultId: string, data: Partial<BackendGradingResult>) => {
    const found = mockDb.results.find((r) => r.id === resultId);
    if (!found) throw new Error("Result not found");
    Object.assign(found, data);
    return clone(found);
  },
  regradeResult: async (resultId: string, _data: { customInstructions?: string }) => {
    // Pool-mock: returnerar resultatet oförändrat (design-läge, ingen AI).
    const found = mockDb.results.find((r) => r.id === resultId);
    if (!found) throw new Error("Result not found");
    return clone(found);
  },
  regradeTest: async (_testId: string) => ({ regraded: 0, skipped: 0 }),
  // --- AI ---
  claudeAnalyze: async (_data: { problem: string; studentAnswer: string; correctAnswer: string; context?: string }): Promise<ClaudeAnalyzeResult> => ({
    feedback: "Design-pool: AI-analys är mockad.",
    isCorrect: true,
    confidence: 0.9,
    provider: "mock",
  }),
  ocrUpload: async (_file: File): Promise<OcrResult> => ({
    latex: "x = 5",
    text: "x = 5",
    confidence: 0.9,
    provider: "mock",
    status: "completed",
  }),
  answerKeyUpload: async (_file: File): Promise<AnswerKeyItem[]> => [
    { question_number: "1", question_text: "", final_answer: "x = 5", derivation_steps: [], max_points: 2 },
    { question_number: "2", question_text: "", final_answer: "6x + 7", derivation_steps: [], max_points: 2 },
    { question_number: "3", question_text: "", final_answer: "x₁ = 3, x₂ = −5", derivation_steps: [], max_points: 3 },
    { question_number: "4", question_text: "", final_answer: "48 cm³", derivation_steps: [], max_points: 3 },
  ],
  answerKeyGenerate: async (_description: string, _n = 4): Promise<AnswerKeyItem[]> => [
    { question_number: "1", question_text: "", final_answer: "x = 5", derivation_steps: [], max_points: 2 },
    { question_number: "2", question_text: "", final_answer: "6x + 7", derivation_steps: [], max_points: 2 },
  ],
  batchGrade: async (req: BatchGradeRequest, _signal?: AbortSignal): Promise<BatchGradeResponse> => {
    // Pool-mock: ett simulerat resultat per uppladdad fil — filnamnet blir
    // elevnamn så att griden fylls realistiskt utan riktig AI.
    const test = mustFindTest(req.provId);
    const results: StudentDocumentResult[] = req.files.map((f, i) => {
      const name = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
      return {
        id: uid(),
        provId: test.id,
        studentId: null,
        studentName: name,
        identificationMethod: "name_field",
        identificationConfidence: 0.95,
        scanPages: [MOCK_SCAN_PAGE],
        sourceFiles: [f.name],
        document: {
          pageCount: 1,
          model: "mock",
          latencyMs: 100,
          attempts: 1,
          questionsExpected: test.questions.length,
          questionsFound: test.questions.length,
          needsReviewCount: 0,
          error: null,
          documentType: "student_submission",
          answerKeySource: "none",
        },
        questions: test.questions.map((q: BackendQuestion, qi: number) => ({
          questionNumber: q.number,
          found: true,
          inAnswerKey: true,
          questionText: "",
          studentWork: "(mockat elevsteg)",
          transcriptionConfidence: 0.95,
          correctAnswer: "",
          assessment: { status: "correct" as const, points: q.maxPoints, maxPoints: q.maxPoints, confidence: 0.95 },
          feedback: "Design-pool: mockat resultat.",
          annotation: { summary: "Mockat", evidence: [], issues: [], suggestions: [] },
          sourceRegions: [],
          mathVerification: null as unknown as never,
          feedbackProvider: "mock",
          error: null,
          pointsTeacher: null,
          teacherComment: null,
          reviewStatus: "pending",
        })),
      };
    });
    return {
      provId: test.id,
      results,
      activeRules: [],
      totalStudents: results.length,
      totalQuestions: test.questions.length,
      integrations: { mock: true },
    };
  },
  getBatchStatus: async (_testId: string) => ({
    running: false,
    total: 0,
    done: 0,
    active: [] as string[],
    error: null,
  }),
};
