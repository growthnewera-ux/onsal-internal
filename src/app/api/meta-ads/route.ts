import { NextRequest, NextResponse } from 'next/server';

const MONTH_DATES: Record<string, {since: string; until: string}> = {
  '1월':  { since:'2026-01-01', until:'2026-01-31' },
  '2월':  { since:'2026-02-01', until:'2026-02-28' },
  '3월':  { since:'2026-03-01', until:'2026-03-31' },
  '4월':  { since:'2026-04-01', until:'2026-04-30' },
  '5월':  { since:'2026-05-01', until:'2026-05-31' },
  '6월':  { since:'2026-06-01', until:'2026-06-30' },
  '7월':  { since:'2026-07-01', until:'2026-07-31' },
  '8월':  { since:'2026-08-01', until:'2026-08-31' },
  '9월':  { since:'2026-09-01', until:'2026-09-30' },
  '10월': { since:'2026-10-01', until:'2026-10-31' },
  '11월': { since:'2026-11-01', until:'2026-11-30' },
  '12월': { since:'2026-12-01', until:'2026-12-31' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const account = searchParams.get('account') || '';
  const token   = searchParams.get('token')   || '';
  const month   = searchParams.get('month')   || '6월';

  if (!account || !token) {
    return NextResponse.json({ error: 'account and token required' }, { status: 400 });
  }

  const dates = MONTH_DATES[month] || MONTH_DATES['6월'];
  const fields = 'campaign_name,impressions,clicks,spend,cpc,ctr,actions,objective';
  const timeRange = JSON.stringify({ since: dates.since, until: dates.until });

  try {
    const url = `https://graph.facebook.com/v21.0/${account}/insights?` +
      `fields=${encodeURIComponent(fields)}&` +
      `time_range=${encodeURIComponent(timeRange)}&` +
      `level=campaign&` +
      `access_token=${token}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const campaigns = (data.data || []).map((c: any) => {
      const purchases = (c.actions || []).find((a: any) => a.action_type === 'purchase');
      const conv = purchases ? parseInt(purchases.value || '0') : 0;
      const spend = parseFloat(c.spend || '0') / 10000; // 원 → 만원
      const roas = spend > 0 ? conv / spend : 0;

      const objectiveMap: Record<string, string> = {
        BRAND_AWARENESS: 'awareness', REACH: 'awareness',
        LINK_CLICKS: 'traffic', TRAFFIC: 'traffic',
        CONVERSIONS: 'conversion', PURCHASE: 'conversion',
        RETARGETING: 'retargeting',
      };

      return {
        id: Date.now().toString() + Math.random(),
        campaign: c.campaign_name,
        objective: objectiveMap[c.objective] || 'awareness',
        dayBudget: 0,
        impr: parseInt(c.impressions || '0'),
        clicks: parseInt(c.clicks || '0'),
        spend: Math.round(spend * 100) / 100,
        conv,
        roas: Math.round(roas * 100) / 100,
      };
    });

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error('Meta Ads API error:', err);
    return NextResponse.json({ error: 'Meta API request failed' }, { status: 500 });
  }
}
