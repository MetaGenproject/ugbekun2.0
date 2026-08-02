/**
 * Centralized API Slice for Ugbekun 2.0
 * Define the Base URL and manage all endpoints and fetch requests in one place.
 */

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local development loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || /^192\.168\.\d+\.\d+$/.test(hostname) || /^10\.\d+\.\d+\.\d+$/.test(hostname)) {
      return `${window.location.protocol}//${hostname}:5001/api`;
    }
    // Mobile & Production deployments: Use same-origin proxy to eliminate CORS preflight blocks
    return '/api/proxy';
  }

  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  return 'https://ugbekunsmp-backend.onrender.com/api';
};

export const BASE_URL = getBaseUrl();

// 2. Centralized Endpoints Catalog
export const endpoints = {
  auth: {
    login: typeof window !== 'undefined' ? '/api/auth/login' : `${BASE_URL}/auth/login`,
    register: `${BASE_URL}/auth/register`,
    me: `${BASE_URL}/auth/me`,
  },
  health: `${BASE_URL}/health`,
  onboarding: {
    plans: `${BASE_URL}/onboarding/plans`,
    planSummary: (slug: string) => `${BASE_URL}/onboarding/plans/${slug}/summary`,
    register: `${BASE_URL}/onboarding/register`,
  },
  superadmin: {
    stats: `${BASE_URL}/superadmin/stats`,
    branches: `${BASE_URL}/superadmin/branches`,
    addBranch: `${BASE_URL}/superadmin/branches`,
    branch: (id: number) => `${BASE_URL}/superadmin/branches/${id}`,
    exportCsv: `${BASE_URL}/superadmin/branches/export.csv`,
    exportPdf: `${BASE_URL}/superadmin/branches/export.pdf`,
    sessions: `${BASE_URL}/superadmin/sessions`,
    setActiveSession: `${BASE_URL}/superadmin/sessions/active`,
    subscriptions: `${BASE_URL}/superadmin/subscriptions`,
    renewSubscription: (id: number) => `${BASE_URL}/superadmin/branches/${id}/renew-subscription`,
    extendSubscription: (id: number) => `${BASE_URL}/superadmin/branches/${id}/extend-subscription`,
    analytics: `${BASE_URL}/superadmin/analytics`,
  },
  admin: {
    stats: `${BASE_URL}/admin/stats`,
    studentsParents: `${BASE_URL}/admin/students-parents`,
    teachersStaff: `${BASE_URL}/admin/teachers-staff`,
    classesSections: `${BASE_URL}/admin/classes-sections`,
    classroomStudents: (classId: number, sectionId: number) => `${BASE_URL}/admin/classroom-students?classId=${classId}&sectionId=${sectionId}`,
    classes: `${BASE_URL}/admin/classes`,
    toggleEcdClass: `${BASE_URL}/admin/classes/toggle-ecd`,
    sections: `${BASE_URL}/admin/sections`,
    allocateSections: `${BASE_URL}/admin/classes/allocate-sections`,
    subjects: `${BASE_URL}/admin/subjects`,
    assignSubject: `${BASE_URL}/admin/subjects/assign`,
    assignSubjectBulk: `${BASE_URL}/admin/subjects/assign-bulk`,
    exams: `${BASE_URL}/admin/exams`,
    onboardStudent: `${BASE_URL}/admin/students/onboard`,
    importStudentsBulk: `${BASE_URL}/admin/students/import-bulk`,
    student: (id: number) => `${BASE_URL}/admin/students/${id}`,
    updateStudent: (id: number) => `${BASE_URL}/admin/students/${id}`,
    deleteStudent: (id: number) => `${BASE_URL}/admin/students/${id}`,
    promoteStudent: (id: number) => `${BASE_URL}/admin/students/${id}/promote`,
    toggleStudentStatus: (id: number) => `${BASE_URL}/admin/students/${id}/toggle-status`,
    onboardTeacher: `${BASE_URL}/admin/teachers/onboard`,
    updateTeacher: (id: number) => `${BASE_URL}/admin/teachers/${id}`,
    deleteTeacher: (id: number) => `${BASE_URL}/admin/teachers/${id}`,
    toggleTeacherStatus: (id: number) => `${BASE_URL}/admin/teachers/${id}/toggle-status`,
    toggleStaffStatus: (id: number) => `${BASE_URL}/admin/staff/${id}/toggle-status`,
    roles: `${BASE_URL}/admin/roles`,
    roleDetail: (id: number | string) => `${BASE_URL}/admin/roles/${id}`,
    timetable: (classId?: number, sectionId?: number, teacherId?: number) =>
      `${BASE_URL}/admin/timetable?${classId ? `classId=${classId}` : ''}${sectionId ? `&sectionId=${sectionId}` : ''}${teacherId ? `&teacherId=${teacherId}` : ''}`,
    timetableSlot: `${BASE_URL}/admin/timetable/slot`,
    deleteTimetableSlot: (id: number) => `${BASE_URL}/admin/timetable/slot/${id}`,
    timetableClear: `${BASE_URL}/admin/timetable/clear`,
    timetableAiGenerate: `${BASE_URL}/admin/timetable/ai-generate`,
    evaluationMatrices: `${BASE_URL}/admin/evaluation-matrices`,
    evaluationMatrixDetail: (id: number | string) => `${BASE_URL}/admin/evaluation-matrices/${id}`,
    setEvaluationMatrixDefault: (id: number | string) => `${BASE_URL}/admin/evaluation-matrices/${id}/set-default`,
    examHalls: `${BASE_URL}/admin/exam-halls`,
    examHallDetail: (id: number | string) => `${BASE_URL}/admin/exam-halls/${id}`,
    examSchedule: (classId?: number, sectionId?: number, hallId?: number) =>
      `${BASE_URL}/admin/exam-schedule?${classId ? `classId=${classId}` : ''}${sectionId ? `&sectionId=${sectionId}` : ''}${hallId ? `&hallId=${hallId}` : ''}`,
    examScheduleSlot: `${BASE_URL}/admin/exam-schedule/slot`,
    deleteExamScheduleSlot: (id: number) => `${BASE_URL}/admin/exam-schedule/slot/${id}`,
    publishExamSchedule: `${BASE_URL}/admin/exam-schedule/publish`,
    clearExamSchedule: `${BASE_URL}/admin/exam-schedule/clear`,
    marksEntry: (classId?: number, sectionId?: number, subjectId?: number, sessionId?: number) =>
      `${BASE_URL}/admin/marks-entry?${classId ? `classId=${classId}` : ''}${sectionId ? `&sectionId=${sectionId}` : ''}${subjectId ? `&subjectId=${subjectId}` : ''}${sessionId ? `&sessionId=${sessionId}` : ''}`,
    saveMarksBatch: `${BASE_URL}/admin/marks-entry/batch-save`,
    assignClassMatrix: `${BASE_URL}/admin/evaluation-matrices/assign-class`,
    aiDistributeMarks: `${BASE_URL}/admin/marks-entry/ai-distribute`,
    cbtGroups: (subjectId?: number) => `${BASE_URL}/admin/cbt/groups${subjectId ? `?subjectId=${subjectId}` : ''}`,
    cbtGroupDetail: (id: number) => `${BASE_URL}/admin/cbt/groups/${id}`,
    cbtDistributions: (classId?: number, sectionId?: number, subjectId?: number) =>
      `${BASE_URL}/admin/cbt/distributions?${classId ? `classId=${classId}` : ''}${sectionId ? `&sectionId=${sectionId}` : ''}${subjectId ? `&subjectId=${subjectId}` : ''}`,
    cbtDistributionDetail: (id: number) => `${BASE_URL}/admin/cbt/distributions/${id}`,
    toggleCbtDistributionPublish: (id: number) => `${BASE_URL}/admin/cbt/distributions/${id}/toggle-publish`,
    onlineExams: `${BASE_URL}/admin/online-exams`,
    studentAttendance: (classId?: number, sectionId?: number, date?: string) =>
      `${BASE_URL}/admin/attendance/students?${classId ? `classId=${classId}` : ''}${sectionId ? `&sectionId=${sectionId}` : ''}${date ? `&date=${date}` : ''}`,
    saveStudentAttendanceBatch: `${BASE_URL}/admin/attendance/students/batch-save`,
    staffAttendance: (date?: string) => `${BASE_URL}/admin/attendance/staff${date ? `?date=${date}` : ''}`,
    saveStaffAttendanceBatch: `${BASE_URL}/admin/attendance/staff/batch-save`,
    siblingRequests: `${BASE_URL}/admin/sibling-requests`,
    approveSiblingRequest: (id: number) => `${BASE_URL}/admin/sibling-requests/${id}/approve`,
    rejectSiblingRequest: (id: number) => `${BASE_URL}/admin/sibling-requests/${id}/reject`,
    onlineAdmissions: `${BASE_URL}/admin/online-admissions`,
    updateOnlineAdmissionStatus: (id: number) => `${BASE_URL}/admin/online-admissions/${id}/status`,
    syncCbtMarks: `${BASE_URL}/admin/cbt/sync`,

    // Credentials & Accounting
    idCards: (query = '') => `${BASE_URL}/admin/id-cards${query}`,
    provisionStudentIdCard: (studentId: number) => `${BASE_URL}/admin/id-cards/provision/student/${studentId}`,
    provisionStaffIdCard: (userId: number) => `${BASE_URL}/admin/id-cards/provision/staff/${userId}`,
    provisionBatchIdCard: `${BASE_URL}/admin/id-cards/provision/batch`,
    revokeIdCard: (cardId: number) => `${BASE_URL}/admin/id-cards/${cardId}/revoke`,
    downloadIdCard: (cardId: number) => `${BASE_URL}/admin/id-cards/${cardId}/download`,
    cardTemplate: `${BASE_URL}/admin/card-template`,
    idCardStats: `${BASE_URL}/admin/id-cards/stats`,
    certificates: (query = '') => `${BASE_URL}/admin/certificates${query}`,
    issueCertificate: `${BASE_URL}/admin/certificates/issue`,
    downloadCertificate: (certId: number) => `${BASE_URL}/admin/certificates/${certId}/download`,
    financesOverview: `${BASE_URL}/admin/finances/overview`,
    feeTypes: `${BASE_URL}/admin/finances/fee-types`,
    feeTypesBulk: `${BASE_URL}/admin/finances/fee-types/bulk`,
    feeAssignments: `${BASE_URL}/admin/finances/fee-assignments`,
    invoices: (query = '') => `${BASE_URL}/admin/finances/invoices${query}`,
    createInvoice: `${BASE_URL}/admin/finances/invoices`,
    bulkInvoice: `${BASE_URL}/admin/finances/invoices/bulk`,
    recordPayment: `${BASE_URL}/admin/finances/payments`,
    exportFinancesCsv: `${BASE_URL}/admin/finances/export/csv`,
    exportFinancesPdf: `${BASE_URL}/admin/finances/export/pdf`,
    pendingCommentaries: `${BASE_URL}/admin/commentary/pending`,
    reviewCommentary: `${BASE_URL}/admin/commentary/review`,
    staffActivities: `${BASE_URL}/admin/reports/staff-activities`,
    events: `${BASE_URL}/admin/events`,
    eventItem: (id: number) => `${BASE_URL}/admin/events/${id}`,
    leaveCategories: `${BASE_URL}/admin/hr/leave-categories`,
    leaveCategory: (id: number) => `${BASE_URL}/admin/hr/leave-categories/${id}`,
    leaveRequests: `${BASE_URL}/admin/hr/leave-requests`,
    reviewLeaveRequest: (id: number) => `${BASE_URL}/admin/hr/leave-requests/${id}/review`,
    payrollComponents: `${BASE_URL}/admin/hr/payroll/components`,
    payrollRuns: `${BASE_URL}/admin/hr/payroll/runs`,
    updatePayrollStatus: (id: number) => `${BASE_URL}/admin/hr/payroll/runs/${id}/status`,
    downloadPayslipPdf: (id: number) => `${BASE_URL}/admin/hr/payroll/payslips/${id}/pdf`,
    salaryAdvances: `${BASE_URL}/admin/hr/salary-advances`,
    reviewSalaryAdvance: (id: number) => `${BASE_URL}/admin/hr/salary-advances/${id}/review`,
    staffConduct: `${BASE_URL}/admin/hr/staff-conduct`,
    staffConductItem: (id: number) => `${BASE_URL}/admin/hr/staff-conduct/${id}`,
    employmentLetters: `${BASE_URL}/admin/hr/employment-letters`,
    generateAiEmploymentLetter: `${BASE_URL}/admin/hr/employment-letters/ai-generate`,
    downloadEmploymentLetterPdf: (id: number) => `${BASE_URL}/admin/hr/employment-letters/${id}/pdf`,
    promotionsClassStudents: `${BASE_URL}/admin/promotions/class-students`,
    batchPromoteStudents: `${BASE_URL}/admin/promotions/batch`,
    promotionsHistory: `${BASE_URL}/admin/promotions/history`,
    libraryResources: `${BASE_URL}/admin/library/resources`,
    aiEbookDraft: `${BASE_URL}/admin/library/resources/ai-ebook-draft`,
    libraryIssues: `${BASE_URL}/admin/library/issues`,
    returnLibraryBook: (id: number) => `${BASE_URL}/admin/library/issues/${id}/return`,
    deleteLibraryResource: (id: number) => `${BASE_URL}/admin/library/resources/${id}`,
    feeGroups: `${BASE_URL}/admin/finances/fee-groups`,
    bulkDuesPost: `${BASE_URL}/admin/finances/bulk-dues-post`,
    bulkPaymentsPost: `${BASE_URL}/admin/finances/bulk-payments-post`,
    sendParentReminder: `${BASE_URL}/admin/finances/send-parent-reminder`,
    financesCollectionsReport: `${BASE_URL}/admin/finances/reports/collections`,
    voucherHeads: `${BASE_URL}/admin/finances/voucher-heads`,
    officeTransactions: `${BASE_URL}/admin/finances/office-transactions`,
    schoolBank: `${BASE_URL}/admin/finances/school-bank`,
    comprehensiveReports: `${BASE_URL}/admin/reports/comprehensive`,
    systemSettings: `${BASE_URL}/admin/settings`,
    uploadSchoolLogo: `${BASE_URL}/admin/settings/upload-logo`,
    uploadProfilePhoto: `${BASE_URL}/admin/profile/upload-photo`,
    schoolInfo: `${BASE_URL}/admin/school-info`,
    inventory: `${BASE_URL}/admin/inventory`,
    inventoryItems: `${BASE_URL}/admin/inventory/items`,
    inventoryPurchase: `${BASE_URL}/admin/inventory/purchase`,
    inventorySale: `${BASE_URL}/admin/inventory/sale`,
    inventoryItemDelete: (id: number) => `${BASE_URL}/admin/inventory/items/${id}`,
  },
  teacher: {
    profile: `${BASE_URL}/teacher/profile`,
    exams: `${BASE_URL}/teacher/exams`,
    students: `${BASE_URL}/teacher/students`,
    scores: `${BASE_URL}/teacher/scores`,
    attendance: `${BASE_URL}/teacher/attendance`,
    commentary: `${BASE_URL}/teacher/commentary`,
    generateAiCommentary: `${BASE_URL}/teacher/commentary/generate-ai`,
    reportCards: `${BASE_URL}/teacher/report-cards`,
    montessoriSheet: (classId: number, sectionId: number, examId: number) =>
      `${BASE_URL}/teacher/montessori/sheet?classId=${classId}&sectionId=${sectionId}&examId=${examId}`,
    saveMontessoriSingle: `${BASE_URL}/teacher/montessori/save-single`,
    homeworks: `${BASE_URL}/teacher/homeworks`,
    onlineExams: `${BASE_URL}/teacher/online-exams`,
    onlineExamItem: (id: number) => `${BASE_URL}/teacher/online-exams/${id}`,
    questionBank: `${BASE_URL}/teacher/question-bank`,
    questionBankItem: (id: number) => `${BASE_URL}/teacher/question-bank/${id}`,
    distributeExam: `${BASE_URL}/teacher/online-exams/distribute`,
    homeworkSubmissions: (homeworkId: number) => `${BASE_URL}/teacher/homeworks/${homeworkId}/submissions`,
    onlineExamSubmissions: (examId: number) => `${BASE_URL}/teacher/online-exams/${examId}/submissions`,
    gradeHomework: (submissionId: number) => `${BASE_URL}/teacher/homeworks/submissions/${submissionId}/grade`,
    gradeOnlineExam: (submissionId: number) => `${BASE_URL}/teacher/online-exams/submissions/${submissionId}/grade`,
    exportPdf: (studentId: number, classId: number, sectionId: number, rankingType: string, rankingLimit?: number) =>
      `${BASE_URL}/teacher/report-cards/export-pdf?studentId=${studentId}&classId=${classId}&sectionId=${sectionId}&rankingType=${rankingType}${rankingLimit ? `&rankingLimit=${rankingLimit}` : ''}`,
    gradebookSheet: `${BASE_URL}/teacher/gradebook/sheet`,
    gradebookSaveSingle: `${BASE_URL}/teacher/gradebook/save-single`,
    gradebookCsvUpload: `${BASE_URL}/teacher/gradebook/csv-upload`,
    scanScoreSheet: `${BASE_URL}/teacher/grades/scan`,
    getScanRecord: (scanId: number) => `${BASE_URL}/teacher/grades/scan/${scanId}`,
    commitScanRecord: (scanId: number) => `${BASE_URL}/teacher/grades/scan/${scanId}/commit`,
    gamificationProfile: `${BASE_URL}/teacher/gamification/profile`,
    gamificationLeaderboard: (periodType: string) => `${BASE_URL}/teacher/gamification/leaderboard?periodType=${periodType}`,
    attritionDashboard: `${BASE_URL}/teacher/attrition/dashboard`,
    attritionDetail: (studentId: number) => `${BASE_URL}/teacher/attrition/detail/${studentId}`,
    attritionAction: (alertId: number) => `${BASE_URL}/teacher/attrition/action/${alertId}`,
    events: `${BASE_URL}/teacher/events`,
  },
  student: {
    profile: `${BASE_URL}/student/profile`,
    attendance: `${BASE_URL}/student/attendance`,
    tasks: `${BASE_URL}/student/tasks`,
    submitHomework: (homeworkId: number) => `${BASE_URL}/student/homeworks/${homeworkId}/submit`,
    submitOnlineExam: (examId: number) => `${BASE_URL}/student/online-exams/${examId}/submit`,
    startOnlineExam: (examId: number) => `${BASE_URL}/student/online-exams/${examId}/start`,
    grades: `${BASE_URL}/student/grades`,
    exportPdf: (rankingType: string, rankingLimit?: number) =>
      `${BASE_URL}/student/grades/export-pdf?rankingType=${rankingType}${rankingLimit ? `&rankingLimit=${rankingLimit}` : ''}`,
    events: `${BASE_URL}/student/events`,
  },
  common: {
    upload: `${BASE_URL}/upload`,
  },
  parent: {
    children: `${BASE_URL}/parent/children`,
    childProfile: (studentId: number) => `${BASE_URL}/parent/child/${studentId}/profile`,
    childAttendance: (studentId: number) => `${BASE_URL}/parent/child/${studentId}/attendance`,
    childTasks: (studentId: number) => `${BASE_URL}/parent/child/${studentId}/tasks`,
    childGrades: (studentId: number) => `${BASE_URL}/parent/child/${studentId}/grades`,
    childExportPdf: (studentId: number, rankingType: string, rankingLimit?: number) =>
      `${BASE_URL}/parent/child/${studentId}/export-pdf?rankingType=${rankingType}${rankingLimit ? `&rankingLimit=${rankingLimit}` : ''}`,
    classesSections: `${BASE_URL}/parent/classes-sections`,
    siblingRequests: `${BASE_URL}/parent/sibling-requests`,
    createSiblingRequest: `${BASE_URL}/parent/sibling-requests`,
    events: `${BASE_URL}/parent/events`,
  },
};

import { safeStorage } from './safeStorage';
import { getCacheBustingHeaders, appendCacheBuster } from './cacheBuster';
export { getCacheBustingHeaders, appendCacheBuster };

// Helper to get authorization headers
const getAuthHeaders = (): HeadersInit => {
  const token = safeStorage.getItem('ugbekun_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const impersonatedTeacherId = safeStorage.getItem('ugbekun_admin_impersonated_teacher_id');
  if (impersonatedTeacherId) {
    headers['x-admin-teacher-id'] = impersonatedTeacherId;
  }
  return headers;
};

/**
 * Robust, lightweight API client mimicking the apiSlice pattern.
 * Manages request headers, authentication tokens, and standardized error handling.
 */
export const apiSlice = {
  /**
   * GET Request
   */
  async get<T = any>(url: string, options?: RequestInit & { cacheBust?: boolean }): Promise<T> {
    const hasAbort = typeof AbortController !== 'undefined';
    const controller = hasAbort ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => {
      try { controller.abort(); } catch (e) {}
    }, 25000) : null;

    try {
      const finalUrl = options?.cacheBust ? appendCacheBuster(url) : url;
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...getCacheBustingHeaders(),
        ...((options?.headers as Record<string, string>) || {}),
      };

      const fetchOpts: RequestInit = {
        method: 'GET',
        headers,
        ...options,
      };

      if (controller && controller.signal) {
        fetchOpts.signal = controller.signal;
      }

      const response = await fetch(finalUrl, fetchOpts);
      return handleResponse<T>(response);
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        throw new Error('Connection timed out. Please check your internet connection or server availability.');
      }
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  },

  /**
   * POST Request
   */
  async post<T = any>(url: string, body: any, options?: RequestInit): Promise<T> {
    const hasAbort = typeof AbortController !== 'undefined';
    const controller = hasAbort ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => {
      try { controller.abort(); } catch (e) {}
    }, 25000) : null;

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...((options?.headers as Record<string, string>) || {}),
      };

      const fetchOpts: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        ...options,
      };

      if (controller && controller.signal) {
        fetchOpts.signal = controller.signal;
      }

      const response = await fetch(url, fetchOpts);
      return handleResponse<T>(response);
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        throw new Error('Server connection timed out. If using remote backend, please wait a moment for server wake up and try again.');
      }
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  },

  /**
   * PUT Request
   */
  async put<T = any>(url: string, body: any, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options?.headers || {}),
      },
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse<T>(response);
  },

  /**
   * DELETE Request
   */
  async delete<T = any>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options?.headers || {}),
      },
      ...options,
    });
    return handleResponse<T>(response);
  },

  /**
   * Download a file (CSV, PDF, etc.) with auth headers.
   */
  async download(url: string, filename: string, options?: { cacheBust?: boolean }): Promise<void> {
    const finalUrl = options?.cacheBust ? appendCacheBuster(url) : url;
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        ...getCacheBustingHeaders(),
      },
    });

    if (!response.ok) {
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;
      throw new Error(data?.message || `Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  },
};

/**
 * Standardized Response and Error Handler
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}
