import { NextRequest, NextResponse } from "next/server";
import { handleCallback } from "@/lib/google-oauth";

/**
 * GET /api/auth/google/callback?code=xxx&state=repId
 * Handles the OAuth2 callback from Google, exchanges the code for tokens,
 * stores them, and redirects back to the sales page.
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const repId = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
      console.error("[Google OAuth Callback] User denied access:", error);
      return NextResponse.redirect(new URL("/v2/sales?auth=denied", req.url));
    }

    if (!code || !repId) {
      return NextResponse.redirect(new URL("/v2/sales?auth=error", req.url));
    }

    await handleCallback(code, repId);

    // Redirect back to sales page with success indicator
    return NextResponse.redirect(new URL("/v2/sales?auth=success", req.url));
  } catch (err) {
    console.error("[Google OAuth Callback] Error:", err);
    return NextResponse.redirect(new URL("/v2/sales?auth=error", req.url));
  }
}
