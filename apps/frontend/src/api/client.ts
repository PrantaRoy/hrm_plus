import axios from "axios";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { clearSession, getSession } from "../auth/authStore";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const session = getSession();
  if (session) {
    config.headers[TENANT_HEADER] = session.tenantSlug;
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
