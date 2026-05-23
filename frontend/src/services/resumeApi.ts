import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/resume`;

const resumeApi = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Reuse the same auth interceptor
resumeApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export const uploadResume = async (file: File, jdText?: string) => {
    const formData = new FormData();
    formData.append("resume", file);
    if (jdText) {
        formData.append("jdText", jdText);
    }

    const response = await resumeApi.post("/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const getUserResumes = async () => {
    const response = await resumeApi.get("/");
    return response.data?.data ?? response.data;
};

export const getResume = async (id: string) => {
    const response = await resumeApi.get(`/${id}`);
    // Backend wraps in { success, data: resumeDoc } — unwrap it
    return response.data?.data ?? response.data;
};

export const getResumeStatus = async (id: string) => {
    const response = await resumeApi.get(`/${id}/status`);
    return response.data?.data ?? response.data;
};

export default resumeApi;
