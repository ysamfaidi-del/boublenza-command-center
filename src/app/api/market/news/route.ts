import { NextResponse } from "next/server";
import { generateNewsItems } from "@/lib/market-data";

export async function GET() {
  const news = generateNewsItems();
  return NextResponse.json({ news });
}
