import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const ITEM_SCHEMA = `{"title":"post title","content":"2-sentence summary of what the post is about","source":"instagram|facebook|blog|website","url":"direct URL or empty string","publishedAt":"YYYY-MM-DD or empty string","performanceScore":6,"engagementData":{"likes":0,"shares":0,"comments":0}}`;

async function searchPlatform(apiKey, query, source, compName, since) {
  const prompt = `${query}

Search for real content published by this business since ${since}. For each post or article you find, return it in a JSON array using this schema:
[${ITEM_SCHEMA}]

Rules:
- Only include content you actually found in search results, not invented content
- Estimate engagement numbers from any visible signals (likes, reactions, shares shown)
- performanceScore 1-10 based on visible engagement and relevance
- source must be "${source}"
- If nothing found, return exactly: []

Return ONLY the JSON array. No explanation, no markdown fences.`;

  try {
    const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.1 },
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error(`searchPlatform ${source} HTTP ${r.status}:`, errText.slice(0, 200));
      return [];
    }

    const data = await r.json();
    const raw = (data.candidates?.[0]?.content?.parts || []).filter(p => p.text).map(p => p.text).join('\n');
    console.log(`  ${compName} [${source}] raw snippet:`, raw.slice(0, 150));

    return parseJSON(raw, compName, source);
  } catch (e) {
    console.error(`searchPlatform ${source} error:`, e.message);
    return [];
  }
}

function parseJSON(raw, compName, source) {
  if (!raw) return [];
  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Find the first '[' and walk balanced braces to find the closing ']'
  const start = stripped.indexOf('[');
  if (start === -1) return [];

  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (ch === '[' || ch === '{') depth++;
      else if (ch === ']' || ch === '}') {
        depth--;
        if (depth === 0) {
          const chunk = stripped.slice(start, i + 1);
          try {
            // Sanitise unescaped control chars inside strings
            let out = '', inS = false, es = false;
            for (const c of chunk) {
              const code = c.charCodeAt(0);
              if (es) { out += c; es = false; continue; }
              if (c === '\\' && inS) { es = true; out += c; continue; }
              if (c === '"') { inS = !inS; out += c; continue; }
              if (inS && code < 0x20) { out += c === '\n' ? '\\n' : c === '\r' ? '\\r' : c === '\t' ? '\\t' : '\\u' + code.toString(16).padStart(4, '0'); continue; }
              out += c;
            }
            const items = JSON.parse(out);
            if (!Array.isArray(items)) return [];
            return items.map(item => ({
              ...item,
              competitor: compName,
              source: item.source || source,
              id: Math.random().toString(36).slice(2, 10),
              scannedAt: new Date().toISOString(),
              performanceScore: Number(item.performanceScore) || 5,
              engagementData: item.engagementData || { likes: 0, shares: 0, comments: 0 },
              seoData: item.seoData || { keywords: [] },
            }));
          } catch (e) {
            console.error(`parseJSON [${source}] error:`, e.message, '| chunk:', chunk.slice(0, 100));
            return [];
          }
        }
      }
    }
  }
  return [];
}

export async function POST(request) {
  try {
    const { competitor } = await request.json();
    if (!competitor?.name) return NextResponse.json({ content: [] });
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY set' }, { status: 500 });

    const { name, website, instagram, facebook } = competitor;
    const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    console.log(`\n=== Crawl: ${name} (since ${since}) ===`);

    const content = [];

    // ── FACEBOOK ──────────────────────────────────────────────────────────────
    // Facebook blocks site: searches. Instead search for the page by name + "facebook"
    // and look for any indexed posts, mentions, or shared content.
    const fbQuery = facebook
      ? `Search for recent posts and updates from the Facebook page at ${facebook}. Also search for "${name}" facebook posts OR updates OR photos to find any indexed content.`
      : `Search for "${name}" facebook posts OR facebook page OR facebook updates. Find any content from their Facebook page visible in search results.`;
    const fbItems = await searchPlatform(apiKey, fbQuery, 'facebook', name, since);
    content.push(...fbItems);
    console.log(`  → ${fbItems.length} FB items`);

    // ── INSTAGRAM ─────────────────────────────────────────────────────────────
    const igQuery = instagram
      ? `Search for recent Instagram posts from ${instagram}. Also try searching "${name}" instagram to find any indexed posts.`
      : `Search for "${name}" instagram posts OR instagram page. Find any Instagram content visible in search results.`;
    const igItems = await searchPlatform(apiKey, igQuery, 'instagram', name, since);
    content.push(...igItems);
    console.log(`  → ${igItems.length} IG items`);

    // ── BLOG / WEBSITE ────────────────────────────────────────────────────────
    const blogQuery = website
      ? `Search for recent blog posts, news, project pages, and new content published on ${website} since ${since}. Also search "${name}" new project OR blog OR news to find any press coverage.`
      : `Search for "${name}" kitchen blog OR news article OR new project OR case study. Find website content and press coverage published recently.`;
    const blogItems = await searchPlatform(apiKey, blogQuery, 'blog', name, since);
    content.push(...blogItems);
    console.log(`  → ${blogItems.length} blog items`);

    // De-duplicate by URL or title
    const seen = new Set();
    const unique = content.filter(item => {
      const key = item.url || item.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by engagement score
    const engScore = i => (i.engagementData?.likes || 0) + (i.engagementData?.comments || 0) * 2 + (i.engagementData?.shares || 0) * 3 + (i.performanceScore || 5);
    unique.sort((a, b) => engScore(b) - engScore(a));

    console.log(`=== ${name}: ${unique.length} total unique items ===\n`);
    return NextResponse.json({ content: unique });

  } catch (err) {
    console.error('Crawl error:', err);
    return NextResponse.json({ error: 'Failed', content: [] }, { status: 500 });
  }
}
