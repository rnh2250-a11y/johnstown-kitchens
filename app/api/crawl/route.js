import { NextResponse } from 'next/server';

// Accepts a single competitor object to avoid Vercel timeout.
// The frontend calls this once per competitor and streams results progressively.
export async function POST(request) {
  try {
    const { competitor } = await request.json();
    if (!competitor?.name) return NextResponse.json({ content: [] });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

    const comp = competitor;
    const targets = [comp.website, comp.instagram, comp.facebook, comp.linkedin].filter(Boolean).join(', ');
    const searchNote = targets ? `Check: ${targets}` : '';

    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2500,
          system: 'You are a content intelligence analyst. Search the web for recent published content from the specified competitor. Return ONLY a valid JSON array. Be accurate and specific about what you find.',
          messages: [{
            role: 'user',
            content: `Search for recent content published by "${comp.name}" (an Irish kitchen company). ${searchNote}

Find their latest blog posts, social media posts, and notable web pages published in the last 90 days.

For each piece of content found, return a JSON object:
{
  "competitor": "${comp.name}",
  "title": "exact or paraphrased content title/headline",
  "source": "blog|instagram|facebook|linkedin|website",
  "content": "excerpt or full text if short (200-400 chars)",
  "url": "direct URL if found, else empty string",
  "publishedAt": "YYYY-MM-DD or rough estimate",
  "engagementData": { "likes": 0, "shares": 0, "comments": 0 },
  "engagementScore": 5,
  "seoData": { "estimatedTraffic": "low|medium|high", "keywords": ["kw1", "kw2"], "domainAuthority": 30 },
  "performanceScore": 5
}

Return a JSON array of 3-6 items. If you cannot find recent content, return [].`
          }],
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        }),
      });

      if (r.status === 429 || r.status >= 500) { lastError = r.status; continue; }
      if (!r.ok) break;

      const data = await r.json();
      const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '';
      let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const arrMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        try {
          const items = JSON.parse(arrMatch[0]);
          const content = items.map(item => ({ ...item, id: Math.random().toString(36).slice(2, 10), scannedAt: new Date().toISOString() }));
          return NextResponse.json({ content });
        } catch {}
      }
      return NextResponse.json({ content: [] });
    }

    return NextResponse.json({ error: lastError ? `API error ${lastError}` : 'Failed', content: [] }, { status: 500 });
  } catch (err) {
    console.error('Crawl error:', err);
    return NextResponse.json({ error: 'Failed', content: [] }, { status: 500 });
  }
}
