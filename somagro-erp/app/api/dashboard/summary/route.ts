import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/data/summary";

export async function GET() {
  const summary = await getDashboardSummary();
  return NextResponse.json(summary);
}
