import axios from "axios";

const normalizeBaseUrl = (value?: string) => {
    const rawValue = value?.trim();
    if (!rawValue) return "http://localhost:8000";
    return rawValue.replace(/\/+$/, "");
};

const resolveEffectiveApiUrl = (): string => {
    const configured = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_ENDPOINT);
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "http://localhost:8000";
        }
    }
    return configured;
};

export const API_ENDPOINT = resolveEffectiveApiUrl();

export const APP_URL = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000"
);

export const isProductionEnv = process.env.NODE_ENV === "production";

// Configure default axios timeout to 6000ms to eliminate hanging requests
if (typeof window !== "undefined") {
    axios.defaults.timeout = 6000;
}

export const getApiUrl = (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_ENDPOINT}${cleanPath}`;
};

export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
};