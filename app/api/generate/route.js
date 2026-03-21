import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request) {
  try {
    const { system, prompt } = await request.json();
    if (!system || !prompt) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY set' }, { status: 500 });

    let lastError;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));

      const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
        }),
      });

      if (r.status === 429 || r.status >= 500) { lastError = `Gemini ${r.status}`; continue; }
      if (!r.ok) {
        const e = await r.text();
        console.error('Gemini:', r.status, e);
        return NextResponse.json({ error: `Gemini ${r.status}` }, { status: 500 });
      }

      const data = await r.json();
      const text = data.candidates?.[0]?.content?.parts?.filter(p => p.text).map(p => p.text).join('\n') || '';
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: lastError || 'Rate limit exceeded, try again shortly' }, { status: 429 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
