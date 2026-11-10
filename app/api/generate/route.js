import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { system, prompt } = await request.json();
    if (!system || !prompt) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No ANTHROPIC_API_KEY set' }, { status: 500 });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      console.error('Anthropic error:', r.status, e);
      return NextResponse.json({ error: `API error: ${r.status}` }, { status: 500 });
    }

    const data = await r.json();
    const text = data.content?.[0]?.text || '';
    return NextResponse.json({ text });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
