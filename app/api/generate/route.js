import { NextResponse } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-70b-8192';

export async function POST(request) {
  try {
    const { system, prompt } = await request.json();
    if (!system || !prompt) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GROQ_API_KEY set' }, { status: 500 });

    const body = {
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_tokens: 8192,
      temperature: 0.7,
    };

    let lastError;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));

      const r = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });

      if (r.status === 429 || r.status >= 500) { lastError = `Groq ${r.status}`; continue; }
      if (!r.ok) {
        const e = await r.text();
        console.error('Groq:', r.status, e);
        return NextResponse.json({ error: `Groq ${r.status}` }, { status: 500 });
      }

      const data = await r.json();
      const text = data.choices?.[0]?.message?.content || '';
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: lastError || 'Rate limit exceeded, try again shortly' }, { status: 429 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
