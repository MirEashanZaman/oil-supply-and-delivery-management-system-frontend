import { NextResponse } from "next/server";
import { API_ENDPOINT, fetchWithTimeout } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    const targets = Array.from(
        new Set(
            [
                `${API_ENDPOINT}/health`,
                "https://oil-supply-delivery-management-system.onrender.com/health",
                "https://oil-supply-delivery-management-system-backend.onrender.com/health",
            ].filter((url) => !url.includes("localhost") && !url.includes("127.0.0.1") && !url.includes("192.168."))
        )
    );

    const pingTargets = targets.length > 0 ? targets : [`${API_ENDPOINT}/health`];

    const results = await Promise.allSettled(
        pingTargets.map(async (url) => {
            const res = await fetchWithTimeout(
                url,
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        "Cache-Control": "no-cache",
                        "User-Agent": "OSDMS-Vercel-KeepAlive/1.0",
                    },
                },
                25000
            );
            return { url, status: res.status, ok: res.ok };
        })
    );

    return NextResponse.json(
        {
            status: "ok",
            timestamp: new Date().toISOString(),
            pings: results.map((r) => (r.status === "fulfilled" ? r.value : { status: "timeout_or_offline" })),
        },
        {
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        }
    );
}
