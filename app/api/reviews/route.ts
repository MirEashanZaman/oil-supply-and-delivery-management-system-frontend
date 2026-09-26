import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINT } from "@/lib/api";
import { promises as fs } from "fs";
import path from "path";

const REVIEWS_FILE = path.join(process.cwd(), "data", "reviews.json");

async function readStoredReviewsFile(): Promise<any[]> {
  try {
    const raw = await fs.readFile(REVIEWS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStoredReviewsFile(reviews: any[]): Promise<void> {
  try {
    const dir = path.dirname(REVIEWS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf-8");
  } catch {}
}

export async function GET() {
  // 1. Try to fetch from NestJS backend if reachable
  try {
    const response = await fetch(`${API_ENDPOINT}/review/list`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch {}

  // 2. Persistent cloud/server file fallback
  const fileReviews = await readStoredReviewsFile();
  return NextResponse.json(fileReviews);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Save to cloud server persistent file immediately
    const existing = await readStoredReviewsFile();
    const updated = [
      ...existing.filter((r) => r.orderId !== body.orderId),
      { ...body, createdAt: new Date().toISOString() },
    ];
    await writeStoredReviewsFile(updated);

    // 2. Also forward to backend DB if active
    try {
      await fetch(`${API_ENDPOINT}/review/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {}

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
