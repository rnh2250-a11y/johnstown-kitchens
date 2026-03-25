import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function geminiSearch(apiKey, searchQuery, extractionPrompt) {
  const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: searchQuery + '\n\n' + extractionPrompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.1 },
    }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  return (data.candidates?.[0]?.content?.parts || []).filter(p => p.text).map(p => p.text).join('\n');
}

function parseItems(raw, compName, source) {
  if (!raw) return [];
  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  const match = stripped.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    let out = '', inStr = false, esc = false;
    for (const ch of match[0]) {
      const code = ch.charCodeAt(0);
      if (esc) { out += ch; esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; out += ch; continue; }
      if (ch === '"') { inStr = !inStr; out += ch; continue; }
      if (inStr && code < 0x20) { out += ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : ch === '\t' ? '\\t' : '\\u' + code.toString(16).padStart(4, '0'); continue; }
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

const ITEM_SCHEMA = `[{"title":"post title or description","content":"what this post is about in 2 sentences","source":"instagram|facebook|blog|website","url":"post URL or empty string","publishedAt":"YYYY-MM-DD or empty string","performanceScore":6,"engagementData":{"likes":0,"shares":0,"comments":0},"seoData":{"estimatedTraffic":"","keywords":[]}}]`;

export async function POST(request) {
  try {
    const { competitor } = await request.json();
    if (!competitor?.name) return NextResponse.json({ content: [] });
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY set' }, { status: 500 });

    const { name, website, instagram, facebook, linkedin } = competitor;

    // Run three targeted platform searches in parallel
    const [igRaw, fbRaw, blogRaw] = await Promise.all([

      // ── INSTAGRAM ────────────────────────────────────────────────────────────
      geminiSearch(apiKey,
        instagram
          ? `Search for recent Instagram posts from this profile: ${instagram}\nFind posts from the last 30 days.`
          : `Search Google for: "${name}" site:instagram.com\nFind their Instagram account and any recent posts visible in search results.`,
        `List every Instagram post you found as a JSON array. If none found, return []. Schema:\n${ITEM_SCHEMA}\nReturn ONLY the JSON array.`
      ),

      // ── FACEBOOK ─────────────────────────────────────────────────────────────
      geminiSearch(apiKey,
        facebook
          ? `Search for recent Facebook posts from this page: ${facebook}\nFind posts from the last 30 days.`
          : `Search Google for: "${name}" site:facebook.com\nFind their Facebook page and any recent posts visible in search results.`,
        `List every Facebook post you found as a JSON array. If none found, return []. Schema:\n${ITEM_SCHEMA}\nReturn ONLY the JSON array.`
      ),

      // ── BLOG / WEBSITE ───────────────────────────────────────────────────────
      geminiSearch(apiKey,
        website
          ? `Search for recent blog posts and new pages on this website: ${website}\nLook for articles, news, project pages published in the last 30 days.`
          : `Search Google for: "${name}" kitchen blog OR news OR article\nFind any blog posts or news published recently by this company.`,
        `List every blog post or new website page you found as a JSON array. If none found, return []. Schema:\n${ITEM_SCHEMA}\nReturn ONLY the JSON array.`
      ),
    ]);

    const igItems    = parseItems(igRaw,   name, 'instagram');
    const fbItems    = parseItems(fbRaw,   name, 'facebook');
    const blogItems  = parseItems(blogRaw, name, 'blog');

    // De-duplicate by URL; keep all items from all platforms
    const seen = new Set();
    const content = [...igItems, ...fbItems, ...blogItems].filter(item => {
      const key = item.url || item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));

    console.log(`Crawl ${name}: ${igItems.length} IG, ${fbItems.length} FB, ${blogItems.length} blog → ${content.length} total`);
    return NextResponse.json({ content });

  } catch (err) {
    console.error('Crawl error:', err);
    return NextResponse.json({ error: 'Failed', content: [] }, { status: 500 });
  }
}
