import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  ChatMessage,
  Review,
  ReviewListResponse,
  TokenResponse,
  User,
  UserStats,
} from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Silent refresh on 401
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;
  try {
    const { data } = await axios.post<TokenResponse>(`${API_URL}/auth/refresh`, {
      refresh_token: refresh,
    });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  } catch {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (body: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
  }) => api.post<User>("/auth/register", body).then((r) => r.data),

  login: (body: { email: string; password: string }) =>
    api.post<TokenResponse>("/auth/login", body).then((r) => r.data),

  me: () => api.get<User>("/auth/me").then((r) => r.data),
};

// ── Users ─────────────────────────────────────────────
export const usersApi = {
  updateProfile: (body: Partial<User>) =>
    api.patch<User>("/users/me", body).then((r) => r.data),

  changePassword: (body: { current_password: string; new_password: string }) =>
    api.post("/users/me/password", body),

  stats: () => api.get<UserStats>("/users/me/stats").then((r) => r.data),
};

// ── Reviews ───────────────────────────────────────────
export const reviewsApi = {
  create: (body: {
    title?: string;
    language: string;
    source_code: string;
    filename?: string;
    ai_provider?: string;
  }) => api.post<Review>("/reviews", body).then((r) => r.data),

  list: (params?: {
    page?: number;
    page_size?: number;
    q?: string;
    language?: string;
    favorites_only?: boolean;
  }) => api.get<ReviewListResponse>("/reviews", { params }).then((r) => r.data),

  get: (id: number) => api.get<Review>(`/reviews/${id}`).then((r) => r.data),

  update: (id: number, body: { title?: string; is_favorite?: boolean }) =>
    api.patch<Review>(`/reviews/${id}`, body).then((r) => r.data),

  remove: (id: number) => api.delete(`/reviews/${id}`),

  toggleFavorite: (id: number) =>
    api.post<Review>(`/reviews/${id}/favorite`).then((r) => r.data),

  action: (id: number, action: string, ai_provider?: string) =>
    api
      .post<{ action: string; content: string }>(`/reviews/${id}/actions`, {
        action,
        ai_provider,
      })
      .then((r) => r.data),

  convert: (body: {
    source_code: string;
    source_language: string;
    target_language: string;
    ai_provider?: string;
  }) =>
    api
      .post<{
        source_language: string;
        target_language: string;
        converted_code: string;
        notes?: string;
      }>("/reviews/convert", body)
      .then((r) => r.data),

  pdf: async (id: number) => {
    const res = await api.get(`/reviews/${id}/pdf`, { responseType: "blob" });
    return res.data as Blob;
  },
};

// ── Chat ──────────────────────────────────────────────
export const chatApi = {
  history: (reviewId: number) =>
    api
      .get<{ messages: ChatMessage[] }>(`/reviews/${reviewId}/chat`)
      .then((r) => r.data.messages),

  send: (
    reviewId: number,
    body: { content: string; action?: string; ai_provider?: string }
  ) => api.post<ChatMessage>(`/reviews/${reviewId}/chat`, body).then((r) => r.data),
};
