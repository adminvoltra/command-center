import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// NOTION INTEGRATION PLACEHOLDER
// When ready: set NOTION_API_KEY and NOTION_DATABASE_ID in Vercel env vars
// then uncomment and fill in the Notion fetch logic below.

interface CalendarEvent {
  id: string | null | undefined;
  title: string | null | undefined;
  start?: string | null;
  end?: string | null;
  source: string;
}

interface CalendarError {
  source: string;
  message: string;
}

export async function GET() {
  const events: CalendarEvent[] = [];
  const errors: CalendarError[] = [];

  // ── Google Calendar ──────────────────────────────────────
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: weekOut.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20,
    });

    const items = res.data.items || [];
    items.forEach(event => {
      events.push({
        id: event.id,
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        source: 'google_calendar',
      });
    });
  } catch (err) {
    errors.push({ source: 'google_calendar', message: 'Not configured — add GOOGLE_* env vars' });
  }

  // ── Notion (placeholder) ──────────────────────────────────
  // Uncomment when NOTION_API_KEY and NOTION_DATABASE_ID are set
  /*
  try {
    const notionRes = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sorts: [{ timestamp: 'created_time', direction: 'descending' }], page_size: 20 }),
    });
    const notionData = await notionRes.json();
    // Map Notion pages to events as needed
    events.push(...notionData.results.map(page => ({
      id: page.id,
      title: page.properties?.Name?.title?.[0]?.plain_text || 'Untitled',
      source: 'notion',
    })));
  } catch (err) {
    errors.push({ source: 'notion', message: 'Not configured — add NOTION_API_KEY' });
  }
  */

  return NextResponse.json({ events, errors });
}
