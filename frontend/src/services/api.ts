import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../stores/authStore";
import { useSyncStore } from "../stores/syncStore";

/* ── Base Axios instance ─────────────────────────────── */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

/* ── Request interceptor: attach JWT ─────────────────── */

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Attach device ID to every request
  const deviceId = useAuthStore.getState().deviceId;
  if (deviceId) {
    config.headers["X-Device-Id"] = deviceId;
  }
  return config;
});

/* ── Response interceptor: handle 401 → refresh ──────── */

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post("/api/v1/auth/refresh", {
          refresh_token: refreshToken,
        });

        const newAccessToken = data.access_token;
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user!,
          newAccessToken,
          data.refresh_token || refreshToken
        );

        processQueue(null, newAccessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/* ── Typed API helpers ───────────────────────────────── */

export async function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await api.get<T>(url, config);
  return data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
) {
  const { data } = await api.post<T>(url, body, config);
  return data;
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
) {
  const { data } = await api.put<T>(url, body, config);
  return data;
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
) {
  const { data } = await api.patch<T>(url, body, config);
  return data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await api.delete<T>(url, config);
  return data;
}

/* ── Offline-aware wrapper ───────────────────────────── */

export async function offlineAwareRequest<T>(
  onlineRequest: () => Promise<T>,
  offlineFallback: () => Promise<T>
): Promise<T> {
  const { isOnline } = useSyncStore.getState();
  if (isOnline) {
    try {
      return await onlineRequest();
    } catch {
      // If network fails, fall back to offline
      return offlineFallback();
    }
  }
  return offlineFallback();
}

export default api;
