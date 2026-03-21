import { NextResponse } from 'next/server';
const URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
export async function POST(request) {
  try {
    const { system, prompt } = await request.json();
    if (!system || !prompt) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No Google AI API key' }, { status: 500 });
    const r = await fetch(`${URL}?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
      }),
    });
    if (!r.ok) { const e = await r.text(); console.error('Gemini:', r.status, e); return NextResponse.json({ error: `Gemini ${r.status}` }, { status: 500 }); }
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.filter(p => p.text).map(p => p.text).join('\n') || '';
    return NextResponse.json({ text });
  } catch (err) { console.error('API:', err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
