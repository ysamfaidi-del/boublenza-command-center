import { NextResponse } from "next/server";
import { fetchRealCocoaPrices, fetchForexRates, generateRealMarketNews } from "@/lib/market-data-real";
import { generateNewsItems } from "@/lib/market-data";

export async function GET() {
  try {
    const [cocoaData, forexResult] = await Promise.all([
      fetchRealCocoaPrices("3m"),
      fetchForexRates(),
    ]);
    const news = await generateRealMarketNews(cocoaData.currentPrice, forexResult.current);
    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({ news: generateNewsItems() });
  }
}
