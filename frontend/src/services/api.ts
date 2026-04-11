import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/sessions`;

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((request) => {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    if (user?.token) {
        request.headers.Authorization = `Bearer ${user.token}`;
    }
    return request;
});

export default api;
