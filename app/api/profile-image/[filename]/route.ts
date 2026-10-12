import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { API_ENDPOINT } from "@/lib/api";

const UPLOADS_CACHE_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> },
) {
    const { filename } = await params;
    const cleanFilename = path.basename(decodeURIComponent(filename));

    try {
        const localCachedPath = path.join(UPLOADS_CACHE_DIR, cleanFilename);
        const fileBuffer = await fs.readFile(localCachedPath);
        const ext = path.extname(cleanFilename).toLowerCase();
        const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".svg" ? "image/svg+xml" : "image/jpeg";
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            },
        });
    } catch {}

    const isLocalPrivateIp = !API_ENDPOINT || API_ENDPOINT.includes("localhost") || API_ENDPOINT.includes("127.0.0.1") || API_ENDPOINT.includes("192.168.") || API_ENDPOINT.includes("10.0.");
    const shouldFetchBackend = !(process.env.VERCEL && isLocalPrivateIp);

    if (shouldFetchBackend) {
        let response = await fetch(
            `${API_ENDPOINT}/customer/auth/getimage/${encodeURIComponent(cleanFilename)}`,
            {
                headers: {
                    cookie: request.headers.get("cookie") || "",
                },
                cache: "no-store",
            },
        ).catch(() => null);

        if (!response || !response.ok) {
            response = await fetch(
                `${API_ENDPOINT}/customer/getimage/${encodeURIComponent(cleanFilename)}`,
                {
                    headers: {
                        cookie: request.headers.get("cookie") || "",
                    },
                    cache: "no-store",
                },
            ).catch(() => null);
        }

        if (!response || !response.ok) {
            response = await fetch(
                `${API_ENDPOINT}/uploads/${encodeURIComponent(cleanFilename)}`,
                {
                    cache: "no-store",
                },
            ).catch(() => null);
        }

        if (response && response.ok) {
            const arrayBuf = await response.arrayBuffer();
            try {
                await fs.mkdir(UPLOADS_CACHE_DIR, { recursive: true });
                await fs.writeFile(path.join(UPLOADS_CACHE_DIR, cleanFilename), Buffer.from(arrayBuf));
            } catch {}

            return new NextResponse(arrayBuf, {
                status: 200,
                headers: {
                    "Content-Type": response.headers.get("content-type") || "image/jpeg",
                    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                },
            });
        }
    }

    return new NextResponse(null, { status: 404 });
}