import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.YOUTUBE_API_KEY;

// In-memory cache: handle → { data, expires }
const cache = new Map<string, { data: ChannelStats; expires: number }>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12시간

export interface VideoStat {
  title: string;
  views: number;
  publishedAt: string;
}

export interface ChannelStats {
  subscribers: number;
  avgViews: number;
  videos: VideoStat[];
  updatedAt: string;
}

function parseDurationSec(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle');
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 });
  if (!API_KEY)  return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  // 캐시 히트
  const cached = cache.get(handle);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  try {
    // 1. 채널 정보 (구독자 수)
    const chRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${encodeURIComponent(handle)}&key=${API_KEY}`
    );
    const chData = await chRes.json();

    if (!chData.items?.length) {
      return NextResponse.json({ error: `Channel not found: ${handle}` }, { status: 404 });
    }

    const channel = chData.items[0];
    const channelId: string = channel.id;
    const subscribers = parseInt(channel.statistics?.subscriberCount || '0');

    // 2. 최근 업로드 10개 검색 (쇼츠 필터링 위해 넉넉히)
    const srRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&maxResults=10&order=date&type=video&key=${API_KEY}`
    );
    const srData = await srRes.json();
    const videoIds: string = (srData.items || []).map((i: any) => i.id.videoId).join(',');

    let avgViews = 0;
    let videos: VideoStat[] = [];

    if (videoIds) {
      // 3. 영상 통계 + duration (쇼츠 제외용)
      const vRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${API_KEY}`
      );
      const vData = await vRes.json();

      // 60초 초과 = 롱폼만 필터
      const longform = (vData.items || [])
        .filter((v: any) => parseDurationSec(v.contentDetails?.duration || '') > 60)
        .slice(0, 5);

      if (longform.length) {
        const total = longform.reduce((s: number, v: any) => s + parseInt(v.statistics?.viewCount || '0'), 0);
        avgViews = Math.round(total / longform.length);
        videos = longform.map((v: any) => ({
          title: v.snippet.title,
          views: parseInt(v.statistics?.viewCount || '0'),
          publishedAt: v.snippet.publishedAt,
        }));
      }
    }

    const result: ChannelStats = {
      subscribers,
      avgViews,
      videos,
      updatedAt: new Date().toISOString(),
    };

    cache.set(handle, { data: result, expires: Date.now() + CACHE_TTL });
    return NextResponse.json(result);

  } catch (err) {
    console.error('YouTube API error:', err);
    return NextResponse.json({ error: 'YouTube API request failed' }, { status: 500 });
  }
}
