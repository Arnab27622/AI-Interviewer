import axios from "axios";
import type { AxiosInstance } from "axios";

interface FailedRequestQueue {
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequestQueue[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export const setupInterceptors = (apiInstance: AxiosInstance) => {
    apiInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            const isAuthRoute = originalRequest.url?.includes("user/refresh") || 
                               originalRequest.url?.includes("user/logout") ||
                               originalRequest.url?.includes("user/login") ||
                               originalRequest.url?.includes("user/register") ||
                               originalRequest.url?.includes("user/google");

            if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
                if (isRefreshing) {
                    return new Promise(function (resolve, reject) {
                        failedQueue.push({ resolve, reject });
                    })
                        .then(() => {
                            return apiInstance(originalRequest);
                        })
                        .catch((err) => {
                            return Promise.reject(err);
                        });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
                    // Call the refresh endpoint. It will automatically use the refresh_jwt cookie
                    // and set the new jwt cookie on success.
                    await axios.post(
                        `${apiUrl}/user/refresh`,
                        {},
                        { withCredentials: true }
                    );

                    isRefreshing = false;
                    processQueue(null, "success");
                    // Notify sockets to reconnect since they might have disconnected due to auth error
                    window.dispatchEvent(new Event("auth_token_refreshed"));
                    return apiInstance(originalRequest);
                } catch (refreshError) {
                    isRefreshing = false;
                    processQueue(refreshError, null);

                    // Refresh failed (token expired/invalid) -> Logout
                    localStorage.removeItem("user");
                    window.dispatchEvent(new Event("auth_unauthorized"));
                    return Promise.reject(refreshError);
                }
            }

            const backendErrorMsg = error.response?.data?.error?.message;
            if (backendErrorMsg) {
                error.message = backendErrorMsg;
            }

            return Promise.reject(error);
        }
    );
};
