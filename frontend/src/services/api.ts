import axios from "axios";

/**
 * Global Axios instance for session-related API calls.
 * Configured with automatic 401 redirection and credentials support.
 */
const API_URL = `${import.meta.env.VITE_API_URL}/sessions`;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid HTTP-only cookie missing
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
