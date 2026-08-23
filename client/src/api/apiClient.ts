import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
} from "axios";
import { API_CONFIG } from "./apiConfig";

const apiClient = axios.create({
    baseURL: API_CONFIG.API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const publicRoutes = [
            "/",
            "/login",
            "/forgot-password",
            "/signup",
        ];

        const currentPath = window.location.pathname;

        const isPublicRoute =
            publicRoutes.includes(currentPath) ||
            currentPath.startsWith("/reset-password");

        if (
            error.response?.status === 401 &&
            !isPublicRoute
        ) {
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default apiClient;