import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, isOAuthConfigured } from "@/lib/google-oauth";

/**
 * GET /api/auth/google?repId=xxx
 * Redirects the user to Google's OAuth2 consent screen.
 */
export async function GET(req: NextRequest) {
  try {
    if (!isOAuthConfigured()) {
      return NextResponse.json(
        { error: "Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env" },
        { status: 500 },
      );
    }

    const repId = req.nextUrl.searchParams.get("repId");
    if (!repId) {
      return NextResponse.json({ error: "Missing repId parameter" }, { status: 400 });
    }

    const url = getAuthUrl(repId);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[Google Auth] Error generating auth URL:", error);
    return NextResponse.json({ error: "Failed to initiate OAuth flow" }, { status: 500 });
  }
}
