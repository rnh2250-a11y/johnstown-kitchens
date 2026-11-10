import { NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemma-4-26b-a4b-it:free';

export async function POST(request) {
  try {
    const { system, prompt } = await request.json();
    if (!system || !prompt) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No OPENROUTER_API_KEY set' }, { status: 500 });

    const body = {
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    };

    let lastError;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));

      const r = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://johnstown-kitchens-three.vercel.app',
        },
        body: JSON.stringify(body),
      });

      if (r.status === 429 || r.status >= 500) { lastError = `OpenRouter ${r.status}`; continue; }
      if (!r.ok) {
        const e = await r.text();
        console.error('OpenRouter error:', r.status, e);
        return NextResponse.json({ error: `OpenRouter ${r.status}: ${e}` }, { status: 500 });
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
