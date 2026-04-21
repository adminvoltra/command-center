import { NextResponse } from 'next/server';

interface FbPost {
  id: string;
  message: string | null;
  createdTime: string;
  permalinkUrl: string | null;
  reactions: number;
  comments: number;
  attachment: {
    type: string | null;
    mediaUrl: string | null;
    targetUrl: string | null;
  } | null;
}

interface FbAttachmentData {
  type?: string;
  media?: { image?: { src?: string } };
  url?: string;
}

interface FbGraphPost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  reactions?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  attachments?: { data?: FbAttachmentData[] };
}

export async function GET() {
  const pageId = process.env.FB_PAGE_ID || process.env.META_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

  if (!pageId || !token) {
    return NextResponse.json(
      {
        configured: false,
        error: 'Missing FB_PAGE_ID/FB_PAGE_ACCESS_TOKEN (or META_PAGE_ID/META_ACCESS_TOKEN) in .env.local',
        posts: [],
      },
      { status: 200 }
    );
  }

  const fields = [
    'id',
    'message',
    'created_time',
    'permalink_url',
    'reactions.summary(true).limit(0)',
    'comments.summary(true).limit(0)',
    'attachments{media,url,type}',
  ].join(',');

  const url = `https://graph.facebook.com/v21.0/${pageId}/posts?fields=${fields}&limit=10&access_token=${token}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const raw = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          configured: true,
          error: raw?.error?.message || `Graph API error (${res.status})`,
          code: raw?.error?.code,
          posts: [],
        },
        { status: 200 }
      );
    }

    const posts: FbPost[] = (raw.data as FbGraphPost[]).map((p) => {
      const att = p.attachments?.data?.[0];
      return {
        id: p.id,
        message: p.message || null,
        createdTime: p.created_time,
        permalinkUrl: p.permalink_url || null,
        reactions: p.reactions?.summary?.total_count ?? 0,
        comments: p.comments?.summary?.total_count ?? 0,
        attachment: att
          ? {
              type: att.type || null,
              mediaUrl: att.media?.image?.src || null,
              targetUrl: att.url || null,
            }
          : null,
      };
    });

    return NextResponse.json({ configured: true, posts });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        error: err instanceof Error ? err.message : 'Request failed',
        posts: [],
      },
      { status: 200 }
    );
  }
}
