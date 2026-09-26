import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINT } from "@/lib/api";

export async function GET() {
  try {
    const response = await fetch(`${API_ENDPOINT}/review/list`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json([]);
    }
    const data = await response.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await fetch(`${API_ENDPOINT}/review/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to submit review to server" },
      { status: 500 }
    );
  }
}
