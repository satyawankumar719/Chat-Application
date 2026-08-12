import axios from "axios";
import { API_CONFIG } from "./apiConfig";

const apiClient = axios.create({
  baseURL: API_CONFIG.API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        const token = parsed?.state?.user?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {}
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const publicRoutes = ["/", "/login", "/forgot-password", "/signup"];
    const isPublicRoute = publicRoutes.includes(window.location.pathname) || 
                          window.location.pathname.startsWith("/reset-password");

    if (error.response?.status === 401 && !isPublicRoute) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;

