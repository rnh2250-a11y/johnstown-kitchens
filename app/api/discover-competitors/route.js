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

    const prompt = `Find 6-10 real competitors for this business: ${context}

Search the web to find companies that compete with this business. Look for:
- Direct competitors in the same geographic area
- Companies offering the same/similar services
- Aspirational brands in the same industry the business might benchmark against

For each competitor found, return a JSON object with these exact fields:
{
  "name": "Company Name",
  "website": "https://...",
  "rationale": "1-2 sentences explaining why they are a competitor",
  "category": "direct",
  "instagram": "",
  "facebook": "",
  "linkedin": ""
}

Return ONLY a raw JSON array with no markdown formatting, no code fences, no explanation text. Just the array starting with [ and ending with ].`;

    const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are a competitive intelligence analyst. Search the web to find real competitors for the given business. Return ONLY a raw JSON array — no markdown, no code fences, no explanation. Start with [ and end with ].' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.3 },
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      console.error('Gemini discover error:', r.status, e);
      return NextResponse.json({ error: `Gemini ${r.status}` }, { status: 500 });
    }

    const data = await r.json();
    console.log('Gemini discover raw candidates:', JSON.stringify(data.candidates?.[0]?.content?.parts?.slice(0, 2)));

    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(p => p.text).map(p => p.text).join('\n').trim();

    console.log('Gemini discover text (first 500):', text.slice(0, 500));

    // Try to extract JSON array from response
    let competitors = [];
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        // Remove control characters inside JSON string values that break JSON.parse
        const cleaned = arrMatch[0].replace(/[\u0000-\u001F\u007F]/g, (c) => {
          if (c === '\n') return '\\n';
          if (c === '\r') return '\\r';
          if (c === '\t') return '\\t';
          return ' ';
        });
        competitors = JSON.parse(cleaned);
      } catch (e) {
        console.error('JSON parse error:', e.message, 'Raw match:', arrMatch[0].slice(0, 300));
      }
    } else {
      console.warn('No JSON array found in response. Full text:', text.slice(0, 800));
    }

    return NextResponse.json({ competitors });
  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
