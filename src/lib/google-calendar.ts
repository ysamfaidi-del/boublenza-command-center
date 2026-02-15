import { google, type Auth } from "googleapis";
import type { V2CalendarEvent } from "@/types/v2";

/**
 * Fetch upcoming events from the authenticated user's Google Calendar.
 * Returns events from now to `daysAhead` days in the future.
 */
export async function getUpcomingEvents(
  auth: Auth.OAuth2Client,
  daysAhead = 14,
): Promise<V2CalendarEvent[]> {
  const calendar = google.calendar({ version: "v3", auth });

  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = res.data.items || [];

  return events.map((ev) => ({
    id: ev.id || "",
    title: ev.summary || "(No title)",
    start: ev.start?.dateTime || ev.start?.date || "",
    end: ev.end?.dateTime || ev.end?.date || "",
    attendees: (ev.attendees || []).map((a) => a.email || "").filter(Boolean),
    location: ev.location || undefined,
    description: ev.description || undefined,
  }));
}

/**
 * Create a new event on the authenticated user's Google Calendar.
 */
export async function createEvent(
  auth: Auth.OAuth2Client,
  event: {
    title: string;
    start: string;      // ISO string
    end: string;        // ISO string
    attendees?: string[];
    location?: string;
    description?: string;
  },
): Promise<V2CalendarEvent> {
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.title,
      location: event.location,
      description: event.description,
      start: { dateTime: event.start, timeZone: "Africa/Algiers" },
      end: { dateTime: event.end, timeZone: "Africa/Algiers" },
      attendees: (event.attendees || []).map((email) => ({ email })),
      conferenceData: undefined,
    },
    sendUpdates: "all",
  });

  return {
    id: res.data.id || "",
    title: res.data.summary || event.title,
    start: res.data.start?.dateTime || event.start,
    end: res.data.end?.dateTime || event.end,
    attendees: (res.data.attendees || []).map((a) => a.email || "").filter(Boolean),
    location: res.data.location || event.location,
    description: res.data.description || event.description,
  };
}
