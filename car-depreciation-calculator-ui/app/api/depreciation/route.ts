import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch("http://car-depreciation-calculator.fyi/api/predict/future", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Depreciation API error (${res.status}): ${text}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
