import { google } from "googleapis";
import { prisma } from "@/lib/db";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

/** Create a fresh OAuth2 client instance */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

/** Generate the Google OAuth consent URL for a given sales rep */
export function getAuthUrl(repId: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: repId, // pass repId through OAuth flow
  });
}

/** Handle the OAuth callback — exchange code for tokens and store them */
export async function handleCallback(code: string, repId: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Missing tokens from Google OAuth response");
  }

  // Upsert the token record for this rep
  await prisma.googleToken.upsert({
    where: { repId },
    create: {
      repId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600_000),
      scopes: SCOPES.join(" "),
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600_000),
      scopes: SCOPES.join(" "),
    },
  });

  return tokens;
}

/** Get an authenticated OAuth2 client for a specific sales rep */
export async function getAuthenticatedClient(repId: string) {
  const token = await prisma.googleToken.findUnique({ where: { repId } });
  if (!token) return null;

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiresAt.getTime(),
  });

  // Auto-refresh listener — update stored token when refreshed
  client.on("tokens", async (newTokens) => {
    if (newTokens.access_token) {
      await prisma.googleToken.update({
        where: { repId },
        data: {
          accessToken: newTokens.access_token,
          expiresAt: new Date(newTokens.expiry_date || Date.now() + 3600_000),
        },
      });
    }
  });

  return client;
}

/** Check if Google OAuth credentials are configured */
export function isOAuthConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Check if a specific rep has connected their Google account */
export async function isRepConnected(repId: string): Promise<boolean> {
  const token = await prisma.googleToken.findUnique({ where: { repId } });
  return !!token;
}
