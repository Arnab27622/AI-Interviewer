import axios from "axios";

const authApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/user/`,
    withCredentials: true,
});

export default authApi;
