import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINT, fetchWithTimeout } from "@/lib/api";
import { promises as fs } from "fs";
import path from "path";

const REVIEWS_FILE = path.join(process.cwd(), "data", "reviews.json");

let GLOBAL_REVIEWS_CACHE: any[] = [];

async function readStoredReviewsFile(): Promise<any[]> {
  const map = new Map<number, any>();

  // 1. In-memory cache
  if (Array.isArray(GLOBAL_REVIEWS_CACHE)) {
    GLOBAL_REVIEWS_CACHE.forEach((r) => {
      if (r && r.orderId) map.set(Number(r.orderId), r);
    });
  }

  // 2. Local file
  try {
    const raw = await fs.readFile(REVIEWS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      parsed.forEach((r) => {
        if (r && r.orderId) map.set(Number(r.orderId), r);
      });
    }
  } catch {}

  // 3. Central database backend
  try {
    const response = await fetchWithTimeout(`${API_ENDPOINT}/review/list`, {
      cache: "no-store",
    }, 3000);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((r) => {
          if (r && r.orderId) map.set(Number(r.orderId), r);
        });
      }
    }
  } catch {}

  const result = Array.from(map.values());
  GLOBAL_REVIEWS_CACHE = [...result];
  return result;
}

async function writeStoredReviewsFile(reviews: any[]): Promise<void> {
  GLOBAL_REVIEWS_CACHE = [...reviews];
  try {
    const dir = path.dirname(REVIEWS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf-8");
  } catch {}
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const reviews = await readStoredReviewsFile();
  return NextResponse.json(reviews, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const existing = await readStoredReviewsFile();
    const updated = [
      ...existing.filter((r) => Number(r.orderId) !== Number(body.orderId)),
      { ...body, createdAt: new Date().toISOString() },
    ];
    await writeStoredReviewsFile(updated);

    // Sync to PostgreSQL backend database
    try {
      await fetchWithTimeout(`${API_ENDPOINT}/review/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }, 3000);
    } catch (e) {
      console.warn("Backend database review sync notice:", e);
    }

    return NextResponse.json(
      { message: "Review saved successfully", review: body },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}
