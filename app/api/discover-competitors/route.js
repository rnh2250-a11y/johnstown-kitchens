import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request) {
  try {
    const { website, brandName, industry, region, services } = await request.json();
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY set' }, { status: 500 });

    const context = [
      brandName && `Business: ${brandName}`,
      website && `Website: ${website}`,
      industry && `Industry: ${industry}`,
      region && `Region: ${region}`,
      services && `Services: ${services}`,
    ].filter(Boolean).join('. ');

    const prompt = `List 6 to 8 real competitors for this Irish kitchen business: ${context}

Include direct local competitors, other Irish kitchen companies, and 1-2 aspirational brands.
For each, provide: company name, website URL, one sentence rationale, and category (direct/aspirational/regional).
Keep rationale to ONE short sentence only. Keep all text fields very brief.`;

    const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You are a competitive intelligence analyst. Return ONLY a valid JSON array of competitor objects. Each object must have: name (string), website (string), rationale (string, max 20 words), category (string: direct|aspirational|regional), instagram (string, empty if unknown), facebook (string, empty if unknown), linkedin (string, empty if unknown).' }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      console.error('Gemini discover error:', r.status, e);
      return NextResponse.json({ error: `Gemini ${r.status}` }, { status: 500 });
    }

    const data = await r.json();
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    let competitors = [];
    try {
      const parsed = JSON.parse(text);
      competitors = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // JSON mode should return valid JSON — if truncated, extract whatever completed objects we have
      console.error('Discover parse error:', e.message, '| text length:', text.length);
      try {
        // Try to recover partial array by finding complete objects
        const matches = [...text.matchAll(/\{[^{}]*"name"[^{}]*\}/g)];
        competitors = matches.map(m => { try { return JSON.parse(m[0]); } catch { return null; } }).filter(Boolean);
        console.log('Recovered', competitors.length, 'partial competitors');
      } catch {}
    }

    return NextResponse.json({ competitors });
  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
