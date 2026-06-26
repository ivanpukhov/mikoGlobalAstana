import axios from "axios";

const ADMIN_STORAGE_KEYS = ['token', 'adminName', 'adminCity', 'phoneNumber'];

export const getApiErrorMessage = (error, fallback = 'Ошибка запроса') => (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
);

export const clearAdminSession = (redirect = true) => {
    ADMIN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

    if (redirect && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
    }
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://miko-astana.kz/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // Таймаут запросов
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token"); // Получение токена из localStorage
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`; // Добавление токена в заголовки
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error.response || error.message);
        const status = error.response?.status;
        const isAdminPage = window.location.pathname.startsWith('/admin');
        const isLoginPage = window.location.pathname === '/admin/login';

        if ([401, 403].includes(status) && isAdminPage && !isLoginPage) {
            clearAdminSession(true);
        }

        return Promise.reject(error);
    }
);

export default api;
