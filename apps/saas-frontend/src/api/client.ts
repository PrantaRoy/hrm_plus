import axios from "axios";
import { clearSession, getSession } from "../auth/saasAuthStore";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const session = getSession();
  if (session) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
    }
    return Promise.reject(error);
  }
);
