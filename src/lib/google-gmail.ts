import { google, type Auth } from "googleapis";
import type { V2GmailMessage } from "@/types/v2";

/**
 * Fetch recent emails from the authenticated user's Gmail.
 * Returns the last `maxResults` messages from the inbox.
 */
export async function getRecentEmails(
  auth: Auth.OAuth2Client,
  maxResults = 15,
): Promise<V2GmailMessage[]> {
  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    labelIds: ["INBOX"],
  });

  const messageIds = listRes.data.messages || [];
  if (messageIds.length === 0) return [];

  // Fetch message details in parallel (batch of IDs)
  const messages = await Promise.all(
    messageIds.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      return {
        id: detail.data.id || msg.id!,
        from: getHeader("From"),
        subject: getHeader("Subject"),
        snippet: detail.data.snippet || "",
        date: getHeader("Date"),
        unread: (detail.data.labelIds || []).includes("UNREAD"),
      } satisfies V2GmailMessage;
    }),
  );

  return messages;
}

/**
 * Fetch a single email thread by message ID.
 * Returns the full message body (text/plain preferred).
 */
export async function getEmailThread(
  auth: Auth.OAuth2Client,
  messageId: string,
): Promise<{ subject: string; from: string; body: string; date: string }> {
  const gmail = google.gmail({ version: "v1", auth });

  const detail = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = detail.data.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

  // Extract body from parts
  let body = "";
  const parts = detail.data.payload?.parts || [];
  const textPart = parts.find((p) => p.mimeType === "text/plain");
  if (textPart?.body?.data) {
    body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
  } else if (detail.data.payload?.body?.data) {
    body = Buffer.from(detail.data.payload.body.data, "base64").toString("utf-8");
  }

  return {
    subject: getHeader("Subject"),
    from: getHeader("From"),
    body,
    date: getHeader("Date"),
  };
}
