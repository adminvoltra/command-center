import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Reminder } from '@/lib/context';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const REMINDERS_KEY = 'voltra-reminders';

interface IncomingReminder {
  id?: string;
  title: string;
  notes?: string;
  dueDate?: string;
  isCompleted?: boolean;
  list?: string;
  priority?: number;
}

// POST: Receive reminders from iOS Shortcuts and store them
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Accept either a single reminder or an array
    let incoming: IncomingReminder[] = Array.isArray(body) ? body : [body];

    // Handle iOS Shortcuts bug: values come as newline-separated strings
    // e.g., title: "Reminder1\nReminder2\nReminder3"
    if (incoming.length === 1 && incoming[0].title && incoming[0].title.includes('\n')) {
      const titles = incoming[0].title.split('\n').filter(t => t.trim());
      const lists = incoming[0].list?.split('\n') || [];
      const completedValues = String(incoming[0].isCompleted || '').split('\n');

      incoming = titles.map((title, i) => ({
        title: title.trim(),
        list: lists[i]?.trim(),
        isCompleted: completedValues[i]?.toLowerCase() === 'yes' || completedValues[i] === 'true',
        notes: undefined,
        dueDate: undefined,
        priority: undefined,
      }));
    }

    const newReminders: Reminder[] = incoming.map((r, index) => ({
      id: r.id || `ios-${Date.now()}-${index}`,
      title: r.title || 'Untitled',
      notes: r.notes,
      dueDate: r.dueDate,
      isCompleted: r.isCompleted ?? false,
      list: r.list,
      priority: r.priority,
      syncedAt: new Date().toISOString(),
    }));

    let finalReminders = newReminders;

    // Store in Redis (append new reminders, avoid duplicates by title)
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const existing = await redis.get(REMINDERS_KEY);
      let allReminders: Reminder[] = [];
      if (existing) {
        allReminders = typeof existing === 'string' ? JSON.parse(existing) : existing;
      }
      // Merge: add new reminders, update existing by title match
      for (const newR of newReminders) {
        const existingIndex = allReminders.findIndex(r => r.title === newR.title);
        if (existingIndex >= 0) {
          allReminders[existingIndex] = newR; // Update existing
        } else {
          allReminders.push(newR); // Add new
        }
      }
      await redis.set(REMINDERS_KEY, JSON.stringify(allReminders));
      finalReminders = allReminders;
    }

    return NextResponse.json({
      success: true,
      count: finalReminders.length,
      reminders: finalReminders,
      message: `Synced ${newReminders.length} new reminder(s)`,
    });
  } catch (error) {
    console.error('POST reminders error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}

// DELETE: Clear all reminders from Redis
export async function DELETE() {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      await redis.del(REMINDERS_KEY);
    }
    return NextResponse.json({ success: true, message: 'All reminders cleared' });
  } catch (error) {
    console.error('DELETE reminders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear' }, { status: 500 });
  }
}

// GET: Fetch stored reminders from server
export async function GET() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return NextResponse.json({
        success: false,
        reminders: [],
        message: 'Redis not configured - add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN',
      });
    }

    const stored = await redis.get(REMINDERS_KEY);
    let reminders: Reminder[] = [];
    if (stored) {
      reminders = typeof stored === 'string' ? JSON.parse(stored) : stored;
    }

    return NextResponse.json({
      success: true,
      count: reminders.length,
      reminders,
    });
  } catch (error) {
    console.error('Failed to fetch reminders:', error);
    return NextResponse.json({
      success: false,
      reminders: [],
      error: 'Failed to fetch reminders',
    });
  }
}
