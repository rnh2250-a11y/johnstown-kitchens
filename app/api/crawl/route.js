import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function geminiSearch(apiKey, searchQuery, extractionPrompt) {
  const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: searchQuery + '\n\n' + extractionPrompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
    }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  return (data.candidates?.[0]?.content?.parts || []).filter(p => p.text).map(p => p.text).join('\n');
}

function parseItems(raw, compName, source) {
  if (!raw) return [];
  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  // Balanced-brace extraction — find first [ and walk to its closing ]
  const start = stripped.indexOf('[');
  if (start === -1) return [];
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (ch === '[' || ch === '{') depth++;
      else if (ch === ']' || ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
  }
  if (end === -1) return [];
  try {
    let out = '', inS = false, es = false;
    for (const ch of stripped.slice(start, end + 1)) {
      const code = ch.charCodeAt(0);
      if (es) { out += ch; es = false; continue; }
      if (ch === '\\' && inS) { es = true; out += ch; continue; }
      if (ch === '"') { inS = !inS; out += ch; continue; }
      if (inS && code < 0x20) { out += ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : ch === '\t' ? '\\t' : '\\u' + code.toString(16).padStart(4, '0'); continue; }
      out += ch;
    }
    const items = JSON.parse(out);
    return Array.isArray(items) ? items.map(item => ({
      ...item,
      competitor: compName,
      source: item.source || source,
      id: Math.random().toString(36).slice(2, 10),
      scannedAt: new Date().toISOString(),
      performanceScore: item.performanceScore || 5,
      engagementData: item.engagementData || { likes: 0, shares: 0, comments: 0 },
      seoData: item.seoData || { estimatedTraffic: '', keywords: [] },
    })) : [];
  } catch { return []; }
}

const ITEM_SCHEMA = `[{"title":"post title or caption","content":"what this post is about in 2 sentences","source":"instagram|facebook|blog|website","url":"post URL or empty string","publishedAt":"YYYY-MM-DD or empty string","performanceScore":6,"engagementData":{"likes":120,"shares":15,"comments":8},"seoData":{"estimatedTraffic":"","keywords":[]}}]`;

export async function POST(request) {
  try {
    const { competitor } = await request.json();
    if (!competitor?.name) return NextResponse.json({ content: [] });
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY set' }, { status: 500 });

    const { name, website, instagram, facebook } = competitor;
    const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 6 months ago

    const extractInstruction = `List up to 20 posts from the results as a JSON array. Include only posts published after ${since}. Estimate likes/comments/shares from any visible signals. If nothing found, return []. Use this schema:\n${ITEM_SCHEMA}\nReturn ONLY the JSON array, no other text.`;

    // Run three targeted platform searches in parallel
    const [igRaw, fbRaw, blogRaw] = await Promise.all([

      // ── INSTAGRAM ────────────────────────────────────────────────────────────
      geminiSearch(apiKey,
        instagram
          ? `Find Instagram posts from ${instagram} published since ${since}. Look for all posts, reels, and stories visible in search. Sort findings by engagement (likes + comments).`
          : `Search Google for: "${name}" site:instagram.com\nFind all their Instagram posts visible in search results since ${since}.`,
        extractInstruction
      ),

      // ── FACEBOOK ─────────────────────────────────────────────────────────────
      geminiSearch(apiKey,
        facebook
          ? `Find Facebook posts from ${facebook} published since ${since}. Include all posts, videos, and updates visible in search.`
          : `Search Google for: "${name}" site:facebook.com\nFind all their Facebook page posts visible in search results since ${since}.`,
        extractInstruction
      ),

      // ── BLOG / WEBSITE ───────────────────────────────────────────────────────
      geminiSearch(apiKey,
        website
          ? `Find all blog posts, news articles, project pages, and new content on ${website} published since ${since}.`
          : `Search Google for: "${name}" kitchen blog OR news OR "new project" OR article\nFind all website/blog content published since ${since}.`,
        extractInstruction
      ),
    ]);

    const igItems   = parseItems(igRaw,   name, 'instagram');
    const fbItems   = parseItems(fbRaw,   name, 'facebook');
    const blogItems = parseItems(blogRaw, name, 'blog');

    // De-duplicate by URL; sort highest engagement first within each platform
    const engScore = item => (item.engagementData?.likes || 0) + (item.engagementData?.comments || 0) * 2 + (item.engagementData?.shares || 0) * 3 + (item.performanceScore || 5);
    const dedup = (items) => {
      const seen = new Set();
      return items
        .filter(item => { const key = item.url || item.title; if (seen.has(key)) return false; seen.add(key); return true; })
        .sort((a, b) => engScore(b) - engScore(a));
    };

    const content = [...dedup(igItems), ...dedup(fbItems), ...dedup(blogItems)];
    console.log(`Crawl ${name}: ${igItems.length} IG, ${fbItems.length} FB, ${blogItems.length} blog → ${content.length} total`);
    return NextResponse.json({ content });

  } catch (err) {
    console.error('Crawl error:', err);
    return NextResponse.json({ error: 'Failed', content: [] }, { status: 500 });
  }
}
