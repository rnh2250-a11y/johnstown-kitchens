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

Use your knowledge to identify companies that compete with this business:
- Direct competitors in the same geographic area (Ireland/Tipperary)
- Companies offering bespoke kitchen design and installation in Ireland
- Aspirational kitchen brands Irish customers might compare against

For each competitor return an object with fields: name, website, rationale, category (direct/aspirational/regional), instagram, facebook, linkedin.`;

    const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You are a competitive intelligence analyst specialising in the Irish kitchen and home interiors market. Return valid JSON only.' }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name:      { type: 'STRING' },
                website:   { type: 'STRING' },
                rationale: { type: 'STRING' },
                category:  { type: 'STRING' },
                instagram: { type: 'STRING' },
                facebook:  { type: 'STRING' },
                linkedin:  { type: 'STRING' },
              },
              required: ['name', 'website', 'rationale', 'category'],
            },
          },
        },
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      console.error('Gemini discover error:', r.status, e);
      return NextResponse.json({ error: `Gemini ${r.status}` }, { status: 500 });
    }

    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    let competitors = [];
    try {
      competitors = JSON.parse(text);
      if (!Array.isArray(competitors)) competitors = [];
    } catch (e) {
      console.error('Discover JSON parse error:', e.message, 'text:', text.slice(0, 300));
    }

    return NextResponse.json({ competitors });
  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
