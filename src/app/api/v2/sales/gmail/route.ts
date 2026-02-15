import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient, isOAuthConfigured } from "@/lib/google-oauth";
import { getRecentEmails } from "@/lib/google-gmail";
import { demoGmailMessages } from "@/lib/demo/sales-demo-data";

/**
 * GET /api/v2/sales/gmail?repId=xxx
 * Returns recent Gmail messages for a connected sales rep.
 * Falls back to demo messages if OAuth is not configured or rep is not connected.
 */
export async function GET(req: NextRequest) {
  try {
    const repId = req.nextUrl.searchParams.get("repId");
    if (!repId) {
      return NextResponse.json({ error: "Missing repId" }, { status: 400 });
    }

    if (!isOAuthConfigured()) {
      return NextResponse.json({ messages: demoGmailMessages, demo: true });
    }

    const client = await getAuthenticatedClient(repId);
    if (!client) {
      return NextResponse.json({ messages: demoGmailMessages, demo: true, notConnected: true });
    }

    const messages = await getRecentEmails(client, 15);
    return NextResponse.json({ messages, demo: false });
  } catch (error) {
    console.error("[Gmail API] Error:", error);
    return NextResponse.json({ messages: demoGmailMessages, demo: true, error: "Failed to fetch emails" });
  }
}
