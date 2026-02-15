import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient, isOAuthConfigured } from "@/lib/google-oauth";
import { getUpcomingEvents, createEvent } from "@/lib/google-calendar";
import { demoCalendarEvents } from "@/lib/demo/sales-demo-data";

/**
 * GET /api/v2/sales/calendar?repId=xxx
 * Returns upcoming calendar events for a connected sales rep.
 */
export async function GET(req: NextRequest) {
  try {
    const repId = req.nextUrl.searchParams.get("repId");
    if (!repId) {
      return NextResponse.json({ error: "Missing repId" }, { status: 400 });
    }

    if (!isOAuthConfigured()) {
      return NextResponse.json({ events: demoCalendarEvents, demo: true });
    }

    const client = await getAuthenticatedClient(repId);
    if (!client) {
      return NextResponse.json({ events: demoCalendarEvents, demo: true, notConnected: true });
    }

    const events = await getUpcomingEvents(client, 14);
    return NextResponse.json({ events, demo: false });
  } catch (error) {
    console.error("[Calendar API] Error:", error);
    return NextResponse.json({ events: demoCalendarEvents, demo: true, error: "Failed to fetch events" });
  }
}

/**
 * POST /api/v2/sales/calendar
 * Creates a new calendar event for a connected sales rep.
 * Body: { repId, title, start, end, attendees?, location?, description? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repId, title, start, end, attendees, location, description } = body;

    if (!repId || !title || !start || !end) {
      return NextResponse.json({ error: "Missing required fields: repId, title, start, end" }, { status: 400 });
    }

    if (!isOAuthConfigured()) {
      return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
    }

    const client = await getAuthenticatedClient(repId);
    if (!client) {
      return NextResponse.json({ error: "Sales rep not connected to Google" }, { status: 403 });
    }

    const event = await createEvent(client, { title, start, end, attendees, location, description });
    return NextResponse.json({ event, created: true });
  } catch (error) {
    console.error("[Calendar API] Create event error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
