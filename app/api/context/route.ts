import { NextRequest, NextResponse } from 'next/server';
import { redis, CONTEXT_KEY } from '@/lib/redis';
import { defaultContext, VoltraContext } from '@/lib/context';

// GET - Fetch context from Redis
export async function GET() {
  try {
    const context = await redis.get<VoltraContext>(CONTEXT_KEY);

    if (!context) {
      return NextResponse.json({
        success: true,
        context: defaultContext,
        source: 'default',
      });
    }

    return NextResponse.json({
      success: true,
      context,
      source: 'redis',
    });
  } catch (error) {
    console.error('Redis GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch context',
      context: defaultContext,
    }, { status: 500 });
  }
}

// POST - Save context to Redis
export async function POST(req: NextRequest) {
  try {
    const { context } = await req.json();

    if (!context) {
      return NextResponse.json({
        success: false,
        error: 'No context provided',
      }, { status: 400 });
    }

    const updatedContext: VoltraContext = {
      ...context,
      lastUpdated: new Date().toISOString(),
    };

    await redis.set(CONTEXT_KEY, updatedContext);

    return NextResponse.json({
      success: true,
      context: updatedContext,
    });
  } catch (error) {
    console.error('Redis POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save context',
    }, { status: 500 });
  }
}

// DELETE - Reset context to default
export async function DELETE() {
  try {
    await redis.del(CONTEXT_KEY);

    return NextResponse.json({
      success: true,
      message: 'Context reset to default',
    });
  } catch (error) {
    console.error('Redis DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to reset context',
    }, { status: 500 });
  }
}
