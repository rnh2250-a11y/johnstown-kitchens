import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request) {
  try {
    const { website, brandName, industry, region, services } = await request.json();
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY set' }, { status: 500 });

    const prompt = `Search the web right now to find REAL, verifiable competitors for this business:
Business: ${brandName}
Website: ${website}
Industry: ${industry}
Region: ${region}
Services: ${services}

CRITICAL RULES:
- Only include businesses that ACTUALLY EXIST and you can verify from search results
- Do NOT invent or hallucinate company names or websites
- Only include a website URL if you found it in search results — leave it empty string if unsure
- If you cannot find enough real local competitors, include fewer results rather than fabricating any

Find 5-8 real competitors across these categories:
- direct: Real local/regional kitchen companies competing for the same customers in Tipperary/Munster
- regional: Established Irish kitchen brands operating nationally
- aspirational: High-profile UK/international bespoke kitchen brands that set the market standard

Return ONLY a JSON array with no other text. Each item:
{"name":"<real company name>","website":"<verified URL or empty string>","rationale":"<one sentence why they compete>","category":"direct|regional|aspirational","instagram":"","facebook":"","linkedin":""}`;

    const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.1,
        },
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      console.error('Gemini discover error:', r.status, e);
      return NextResponse.json({ error: `Gemini ${r.status}` }, { status: 500 });
    }

    const data = await r.json();

    // With googleSearch tool, response is plain text — extract the JSON array from it
    const text = (data.candidates?.[0]?.content?.parts || [])
      .filter(p => p.text)
      .map(p => p.text)
      .join('');

    let competitors = [];
    try {
      // Strip markdown fences
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const arrMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrMatch) competitors = JSON.parse(arrMatch[0]);
    } catch (e) {
      console.error('Discover parse error:', e.message, '| text snippet:', text.slice(0, 300));
    }

    // Filter out any with obviously fabricated/empty names
    competitors = competitors.filter(c => c.name && c.name.trim().length > 1);

    return NextResponse.json({ competitors });
  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
