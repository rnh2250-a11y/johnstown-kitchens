import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Escape control characters ONLY inside JSON string literals using a state machine.
function sanitizeJsonStrings(str) {
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = ch.charCodeAt(0);
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; result += ch; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString && code < 0x20) {
      if (ch === '\n') result += '\\n';
      else if (ch === '\r') result += '\\r';
      else if (ch === '\t') result += '\\t';
      else result += '\\u' + code.toString(16).padStart(4, '0');
      continue;
    }
    result += ch;
  }
  return result;
}

// Accepts a single competitor object to avoid Vercel timeout.
export async function POST(request) {
  try {
    const { competitor } = await request.json();
    if (!competitor?.name) return NextResponse.json({ content: [] });
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY set' }, { status: 500 });

    const comp = competitor;
    const targets = [comp.website, comp.instagram, comp.facebook, comp.linkedin].filter(Boolean).join(', ');
    const searchNote = targets ? `Check: ${targets}` : '';

    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));

      const prompt = `Search for recent content published by "${comp.name}" (an Irish kitchen company). ${searchNote}

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

Return a JSON array of 3-6 items. If you cannot find recent content, return [].`;

      const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'You are a content intelligence analyst. Search the web for recent published content from the specified competitor. Return ONLY a valid JSON array. Be accurate and specific about what you find.' }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { maxOutputTokens: 2500, temperature: 0.3 },
        }),
      });

      if (r.status === 429 || r.status >= 500) { lastError = r.status; continue; }
      if (!r.ok) break;

      const data = await r.json();
      const text = data.candidates?.[0]?.content?.parts?.filter(p => p.text).map(p => p.text).join('\n') || '';
      const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const arrMatch = stripped.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        try {
          const items = JSON.parse(sanitizeJsonStrings(arrMatch[0]));
          const content = items.map(item => ({ ...item, id: Math.random().toString(36).slice(2, 10), scannedAt: new Date().toISOString() }));
          return NextResponse.json({ content });
        } catch (e) {
          console.error('Crawl JSON parse error:', e.message);
        }
      }
      return NextResponse.json({ content: [] });
    }

    return NextResponse.json({ error: lastError ? `API error ${lastError}` : 'Failed', content: [] }, { status: 500 });
  } catch (err) {
    console.error('Crawl error:', err);
    return NextResponse.json({ error: 'Failed', content: [] }, { status: 500 });
  }
}
