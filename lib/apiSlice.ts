/**
 * Centralized API Slice for Ugbekun 2.0
 * Define the Base URL and manage all endpoints and fetch requests in one place.
 */

// 1. Centralized Base URL (can be easily changed here or overridden via env variable)
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// 2. Centralized Endpoints Catalog
export const endpoints = {
  auth: {
    login: `${BASE_URL}/auth/login`,
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
    promoteStudent: (id: number) => `${BASE_URL}/admin/students/${id}/promote`,
    onboardTeacher: `${BASE_URL}/admin/teachers/onboard`,
    updateTeacher: (id: number) => `${BASE_URL}/admin/teachers/${id}`,
    deleteTeacher: (id: number) => `${BASE_URL}/admin/teachers/${id}`,
    siblingRequests: `${BASE_URL}/admin/sibling-requests`,
    approveSiblingRequest: (id: number) => `${BASE_URL}/admin/sibling-requests/${id}/approve`,
    rejectSiblingRequest: (id: number) => `${BASE_URL}/admin/sibling-requests/${id}/reject`,
    onlineAdmissions: `${BASE_URL}/admin/online-admissions`,
    updateOnlineAdmissionStatus: (id: number) => `${BASE_URL}/admin/online-admissions/${id}/status`,
    
    // Credentials & Accounting
    idCards: (query = '') => `${BASE_URL}/admin/id-cards${query}`,
    provisionStudentIdCard: (studentId: number) => `${BASE_URL}/admin/id-cards/provision/student/${studentId}`,
    provisionStaffIdCard: (userId: number) => `${BASE_URL}/admin/id-cards/provision/staff/${userId}`,
    provisionBatchIdCard: `${BASE_URL}/admin/id-cards/provision/batch`,
    revokeIdCard: (cardId: number) => `${BASE_URL}/admin/id-cards/${cardId}/revoke`,
    downloadIdCard: (cardId: number) => `${BASE_URL}/admin/id-cards/${cardId}/download`,
    certificates: (query = '') => `${BASE_URL}/admin/certificates${query}`,
    issueCertificate: `${BASE_URL}/admin/certificates/issue`,
    downloadCertificate: (certId: number) => `${BASE_URL}/admin/certificates/${certId}/download`,
    financesOverview: `${BASE_URL}/admin/finances/overview`,
    feeTypes: `${BASE_URL}/admin/finances/fee-types`,
    invoices: (query = '') => `${BASE_URL}/admin/finances/invoices${query}`,
    createInvoice: `${BASE_URL}/admin/finances/invoices`,
    recordPayment: `${BASE_URL}/admin/finances/payments`,
    exportFinancesCsv: `${BASE_URL}/admin/finances/export/csv`,
    exportFinancesPdf: `${BASE_URL}/admin/finances/export/pdf`,
    pendingCommentaries: `${BASE_URL}/admin/commentary/pending`,
    reviewCommentary: `${BASE_URL}/admin/commentary/review`,
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
  },
};

// Helper to get authorization headers
const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ugbekun_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Robust, lightweight API client mimicking the apiSlice pattern.
 * Manages request headers, authentication tokens, and standardized error handling.
 */
export const apiSlice = {
  /**
   * GET Request
   */
  async get<T = any>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
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
   * POST Request
   */
  async post<T = any>(url: string, body: any, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
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
  async download(url: string, filename: string): Promise<void> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
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
