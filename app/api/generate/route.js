import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function POST(request) {
  try {
    const { system, prompt } = await request.json();
    if (!system || !prompt) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GEMINI_API_KEY set' }, { status: 500 });

    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    };

    let lastError;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));

      const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (r.status === 429 || r.status >= 500) { lastError = `Gemini ${r.status}`; continue; }
      if (!r.ok) {
        const e = await r.text();
        console.error('Gemini error:', r.status, e);
        return NextResponse.json({ error: `Gemini ${r.status}: ${e}` }, { status: 500 });
      }

      const data = await r.json();
      const text = (data.candidates?.[0]?.content?.parts || []).filter(p => p.text).map(p => p.text).join('\n');
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: lastError || 'Rate limit exceeded, try again shortly' }, { status: 429 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
