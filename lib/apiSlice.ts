/**
 * Centralized API Slice for Ugbekun 2.0
 * Define the Base URL and manage all endpoints and fetch requests in one place.
 */

// 1. Centralized Base URL (can be easily changed here or overridden via env variable)
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  },
  admin: {
    stats: `${BASE_URL}/admin/stats`,
    studentsParents: `${BASE_URL}/admin/students-parents`,
    teachersStaff: `${BASE_URL}/admin/teachers-staff`,
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
