import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request) {
  try {
    const { competitor } = await request.json();
    if (!competitor?.name) return NextResponse.json({ content: [] });
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY set' }, { status: 500 });

    const comp = competitor;
    const targets = [comp.website, comp.instagram, comp.facebook, comp.linkedin].filter(Boolean).join(', ');

    const prompt = `Search the web for recent content published by "${comp.name}" (an Irish kitchen business).${targets ? ` Check these sources: ${targets}` : ''}

Find their blog posts, social media posts, and notable web pages from the last 90 days.

Return ONLY a JSON array. If nothing is found, return []. Each item in the array must follow this exact structure:
{
  "competitor": "${comp.name}",
  "title": "post or page title",
  "content": "2-3 sentence summary of the content",
  "source": "blog|instagram|facebook|linkedin|website",
  "url": "direct URL if known, otherwise empty string",
  "publishedAt": "YYYY-MM-DD or empty string",
  "performanceScore": 5,
  "engagementData": { "likes": 0, "shares": 0, "comments": 0 },
  "seoData": { "estimatedTraffic": "", "keywords": [] }
}

Return ONLY the JSON array. No explanation, no markdown, no other text.`;

    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));

      const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.2 },
        }),
      });

      if (r.status === 429 || r.status >= 500) { lastError = r.status; continue; }
      if (!r.ok) { lastError = r.status; break; }

      const data = await r.json();
      const rawText = (data.candidates?.[0]?.content?.parts || []).filter(p => p.text).map(p => p.text).join('\n');

      // Strip markdown fences, find JSON array
      const stripped = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const arrMatch = stripped.match(/\[[\s\S]*\]/);
      if (!arrMatch) {
        console.log('Crawl: no JSON array found for', comp.name, '| snippet:', rawText.slice(0, 200));
        return NextResponse.json({ content: [] });
      }

      try {
        // Sanitise unescaped control characters inside strings
        let out = '', inStr = false, esc = false;
        for (const ch of arrMatch[0]) {
          const code = ch.charCodeAt(0);
          if (esc) { out += ch; esc = false; continue; }
          if (ch === '\\' && inStr) { esc = true; out += ch; continue; }
          if (ch === '"') { inStr = !inStr; out += ch; continue; }
          if (inStr && code < 0x20) { out += ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : ch === '\t' ? '\\t' : '\\u' + code.toString(16).padStart(4, '0'); continue; }
          out += ch;
        }
        const items = JSON.parse(out);
        const content = items.map(item => ({
          ...item,
          competitor: comp.name,
          id: Math.random().toString(36).slice(2, 10),
          scannedAt: new Date().toISOString(),
          performanceScore: item.performanceScore || 5,
          engagementData: item.engagementData || { likes: 0, shares: 0, comments: 0 },
          seoData: item.seoData || { estimatedTraffic: '', keywords: [] },
        }));
        return NextResponse.json({ content });
      } catch (e) {
        console.error('Crawl parse error:', e.message, '| snippet:', arrMatch[0].slice(0, 200));
        return NextResponse.json({ content: [] });
      }
    }

    return NextResponse.json({ error: `API error ${lastError}`, content: [] }, { status: 500 });
  } catch (err) {
    console.error('Crawl error:', err);
    return NextResponse.json({ error: 'Failed', content: [] }, { status: 500 });
  }
}
