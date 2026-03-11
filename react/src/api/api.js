import axios from "axios";

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
        return Promise.reject(error);
    }
);

export default api;
