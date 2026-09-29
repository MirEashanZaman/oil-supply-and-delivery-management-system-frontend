import { NextResponse } from "next/server";
import { API_ENDPOINT, fetchWithTimeout } from "@/lib/api";

export async function GET() {
    try {
        const response = await fetchWithTimeout(`${API_ENDPOINT}/product/list`, {
            cache: "no-store",
        }, 4000);
        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch {
        return NextResponse.json(
            { message: "Unable to load products" },
            { status: 502 },
        );
    }
}