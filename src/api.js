/**
 * src/api.js
 * ตัวกลางเชื่อมต่อกับ Node.js + Express Backend
 */

const API_URL = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');
export const SESSION_EXPIRED_EVENT = 'risk:session-expired';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// Only protected requests can expire a session. A late response from an old
// token must not sign out an account that has since logged in again.
const authenticatedRequest = async (path, options = {}) => {
    const headers = getHeaders();
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    const currentToken = localStorage.getItem('token');
    const requestToken = headers.Authorization;
    if (response.status === 401 && requestToken === (currentToken ? `Bearer ${currentToken}` : undefined)) {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return response.json();
};

export const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return response.json();
};

export const register = async (name, email, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    return response.json();
};

export const saveRisk = async (riskData) => {
    return authenticatedRequest('/risks', {
        method: 'POST',
        body: JSON.stringify(riskData)
    });
};

export const getActivities = async () => {
    return authenticatedRequest('/activities');
};

// Dashboard totals must include saved assessments from every page, rather than
// treating the first page of activity logs as the assessment database.
export const getRiskAssessments = async ({ signal } = {}) => {
    const data = [];
    let page = 1;
    let pages = 1;
    do {
        const result = await authenticatedRequest(`/risks?limit=100&page=${page}`, { signal });
        if (!result.success) return result;
        data.push(...result.data);
        pages = result.pagination?.pages ?? 1;
        page++;
    } while (page <= pages);
    return { success: true, data };
};

export const getAdminUsers = async () => {
    return authenticatedRequest('/admin/users');
};

export const createAdminUser = async (data) => {
    return authenticatedRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const updateAdminUser = async (id, data) => {
    return authenticatedRequest(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

export const deleteAdminUser = async (id) => {
    return authenticatedRequest(`/admin/users/${id}`, {
        method: 'DELETE',
    });
};

export const getAIAnalysis = async (data) => {
    return authenticatedRequest('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};
