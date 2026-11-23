"use client";

import { useEffect } from "react";
import { API_ENDPOINT } from "@/lib/api";

export default function KeepAliveHeartbeat() {
    useEffect(() => {
        const pingBackend = () => {
            fetch("/api/keep-alive", { cache: "no-store" }).catch(() => {});
            if (API_ENDPOINT && !API_ENDPOINT.includes("localhost") && !API_ENDPOINT.includes("127.0.0.1")) {
                fetch(`${API_ENDPOINT}/health`, { mode: "cors", cache: "no-store" }).catch(() => {});
            }
        };

        // Wake / keep warm immediately on mount
        pingBackend();

        // Ping every 4 minutes while a tab is open (well below Render's 15-minute idle threshold)
        const interval = window.setInterval(pingBackend, 4 * 60 * 1000);
        return () => window.clearInterval(interval);
    }, []);

    return null;
}
