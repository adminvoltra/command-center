import { NextResponse } from 'next/server';
import { redis, CONTEXT_KEY } from '@/lib/redis';
import type { VoltraContext } from '@/lib/context';

export async function POST() {
  try {
    // Fetch current context
    const raw = await redis.get(CONTEXT_KEY);
    if (!raw) {
      return NextResponse.json({ error: 'No context found' }, { status: 404 });
    }

    const ctx: VoltraContext = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // Filter out bad projects:
    // - Missing id
    // - status === 'removed'
    // - Duplicates (keep first occurrence by id)
    const seenIds = new Set<string>();
    const cleanedProjects = ctx.projects.filter(p => {
      // Must have id
      if (!p.id) {
        console.log('Removing project without id:', p.name);
        return false;
      }
      // Must not be 'removed' (cast to string since this is invalid data)
      if ((p.status as string) === 'removed') {
        console.log('Removing project with status removed:', p.name);
        return false;
      }
      // Must not be duplicate
      if (seenIds.has(p.id)) {
        console.log('Removing duplicate project:', p.name);
        return false;
      }
      seenIds.add(p.id);
      return true;
    });

    const removedCount = ctx.projects.length - cleanedProjects.length;

    // Save cleaned context
    const updatedCtx = {
      ...ctx,
      projects: cleanedProjects,
      lastUpdated: new Date().toISOString(),
    };

    await redis.set(CONTEXT_KEY, JSON.stringify(updatedCtx));

    return NextResponse.json({
      success: true,
      removed: removedCount,
      remaining: cleanedProjects.length,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
