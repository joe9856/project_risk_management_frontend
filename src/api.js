/**
 * src/api.js
 * ตัวกลางเชื่อมต่อกับ Node.js + Express Backend
 */

const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
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
    const response = await fetch(`${API_URL}/risks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(riskData)
    });
    return response.json();
};

export const getActivities = async () => {
    const response = await fetch(`${API_URL}/activities`, {
        headers: getHeaders()
    });
    return response.json();
};

export const getAdminUsers = async () => {
    const response = await fetch(`${API_URL}/admin/users`, {
        headers: getHeaders()
    });
    return response.json();
};

export const createAdminUser = async (data) => {
    const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    return response.json();
};

export const updateAdminUser = async (id, data) => {
    const response = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    return response.json();
};

export const deleteAdminUser = async (id) => {
    const response = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return response.json();
};

export const getAIAnalysis = async (data) => {
    const response = await fetch(`${API_URL}/ai/analyze`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    return response.json();
};
