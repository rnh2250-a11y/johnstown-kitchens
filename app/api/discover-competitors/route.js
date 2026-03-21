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

For each competitor found, return:
{
  "name": "Company Name",
  "website": "https://...",
  "rationale": "1-2 sentences explaining why they are a competitor",
  "category": "direct|aspirational|regional",
  "instagram": "",
  "facebook": "",
  "linkedin": ""
}

Return a JSON array. Only include real, verifiable companies you can find evidence of online.`;

    const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are a competitive intelligence analyst. Search the web to find real competitors for the given business. Return ONLY a valid JSON array with accurate, real companies.' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.3 },
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      console.error('Gemini discover:', r.status, e);
      return NextResponse.json({ error: `Gemini ${r.status}` }, { status: 500 });
    }

    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.filter(p => p.text).map(p => p.text).join('\n') || '';
    let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        const competitors = JSON.parse(arrMatch[0]);
        return NextResponse.json({ competitors });
      } catch {}
    }
    return NextResponse.json({ competitors: [] });
  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
