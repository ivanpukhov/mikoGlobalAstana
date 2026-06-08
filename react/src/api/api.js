import axios from "axios";

export const getApiErrorMessage = (error, fallback = 'Ошибка запроса') => (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
);

const api = axios.create({
    baseURL: "https://miko-astana.kz/api", // Замените на ваш базовый URL, если он другой
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
        const message = getApiErrorMessage(error, '');
        const isTokenError = /токен/i.test(message);
        const isAdminPage = window.location.pathname.startsWith('/admin');
        const isLoginPage = window.location.pathname === '/admin/login';

        if ([401, 403].includes(status) && isTokenError && isAdminPage && !isLoginPage) {
            localStorage.removeItem('token');
            localStorage.removeItem('adminName');
            localStorage.removeItem('adminCity');
            localStorage.removeItem('phoneNumber');
            window.location.assign('/admin/login');
        }

        return Promise.reject(error);
    }
);

export default api;
