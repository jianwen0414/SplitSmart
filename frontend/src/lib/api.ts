"use client";
import axios, { AxiosError } from "axios";
import { supabase } from "./supabase";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL && typeof window !== "undefined") {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Add it to frontend/.env.local (see .env.local.example)."
  );
}

// Axios request timeout (ms). Generous enough for AI/OCR calls, short enough to
// surface a stuck backend instead of hanging the UI indefinitely.
export const REQUEST_TIMEOUT_MS = 15000;

export const api = axios.create({
  baseURL: `${baseURL || "http://localhost:8000"}/api/v1`,
  timeout: REQUEST_TIMEOUT_MS,
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Shape of the backend's standard error body: `{ detail: { code, message, field? } }`. */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Extract a human-readable message from an unknown thrown value.
 * Centralizes the `err?.response?.data?.detail?.message` access so components
 * never have to type their catch clauses as `any`.
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ detail?: ApiError | string }>;
    const detail = axiosErr.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (detail?.message) return detail.message;
    if (axiosErr.message) return axiosErr.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
