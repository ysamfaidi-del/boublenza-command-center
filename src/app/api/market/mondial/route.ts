import { NextResponse } from "next/server";
import { fetchRealCocoaPrices, fetchForexRates, generateRealMarketNews } from "@/lib/market-data-real";
import { getMarketTrends } from "@/lib/market-data";
import { demoMarketMondial } from "@/lib/demo-data";
import type { MarketMondialData } from "@/types";

export async function GET() {
  try {
    const [cocoaData, forexResult, trends] = await Promise.all([
      fetchRealCocoaPrices("3m"),
      fetchForexRates(),
      Promise.resolve(getMarketTrends()),
    ]);

    // Build forex rates array with 24h changes
    const yesterday = forexResult.history.length >= 2
      ? forexResult.history[forexResult.history.length - 2]
      : null;
    const forex = [
      {
        pair: "EUR/USD",
        rate: forexResult.current.USD || 1.085,
        change24h: yesterday ? +(forexResult.current.USD - yesterday.USD).toFixed(4) : 0,
        changePercent: yesterday ? +((forexResult.current.USD - yesterday.USD) / yesterday.USD * 100).toFixed(2) : 0,
      },
      {
        pair: "EUR/GBP",
        rate: forexResult.current.GBP || 0.843,
        change24h: yesterday ? +(forexResult.current.GBP - yesterday.GBP).toFixed(4) : 0,
        changePercent: yesterday ? +((forexResult.current.GBP - yesterday.GBP) / yesterday.GBP * 100).toFixed(2) : 0,
      },
      {
        pair: "EUR/DZD",
        rate: forexResult.current.DZD || 146.5,
        change24h: yesterday ? +(forexResult.current.DZD - yesterday.DZD).toFixed(2) : 0,
        changePercent: yesterday ? +((forexResult.current.DZD - yesterday.DZD) / yesterday.DZD * 100).toFixed(2) : 0,
      },
    ];

    // AI-generated news
    const news = await generateRealMarketNews(cocoaData.currentPrice, forexResult.current);

    // Carob vs Cocoa spread
    const carobPrice = 4500; // Boublenza average selling price/tonne
    const carobVsCocoa = {
      carobPrice,
      cocoaPrice: cocoaData.currentPrice,
      spread: cocoaData.currentPrice - carobPrice,
      spreadPercent: +((cocoaData.currentPrice - carobPrice) / cocoaData.currentPrice * 100).toFixed(1),
    };

    const data: MarketMondialData = {
      cocoa: {
        currentPrice: cocoaData.currentPrice,
        change: cocoaData.change24h,
        changePercent: cocoaData.changePercent,
        history: cocoaData.history,
      },
      forex,
      forexHistory: forexResult.history,
      trends,
      news,
      carobVsCocoa,
    };

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(demoMarketMondial);
  }
}
