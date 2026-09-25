import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINT } from "@/lib/api";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> },
) {
    const { filename } = await params;
    let response = await fetch(
        `${API_ENDPOINT}/customer/auth/getimage/${encodeURIComponent(filename)}`,
        {
            headers: {
                cookie: request.headers.get("cookie") || "",
            },
            cache: "no-store",
        },
    );

    if (!response.ok) {
        response = await fetch(
            `${API_ENDPOINT}/customer/getimage/${encodeURIComponent(filename)}`,
            {
                headers: {
                    cookie: request.headers.get("cookie") || "",
                },
                cache: "no-store",
            },
        );
    }

    if (!response.ok) {
        response = await fetch(
            `${API_ENDPOINT}/uploads/${encodeURIComponent(filename)}`,
            {
                cache: "no-store",
            },
        );
    }

    if (!response.ok) {
        return new NextResponse(null, { status: response.status });
    }

    return new NextResponse(await response.arrayBuffer(), {
        status: 200,
        headers: {
            "Content-Type": response.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "private, max-age=300",
        },
    });
}