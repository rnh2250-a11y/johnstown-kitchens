import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { system, prompt } = await request.json();
    if (!system || !prompt) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No ANTHROPIC_API_KEY set' }, { status: 500 });

    let lastError;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system,
          messages: [{ role: 'user', content: prompt }],
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        }),
      });

      if (r.status === 429 || r.status >= 500) {
        lastError = `Claude ${r.status}`;
        continue;
      }
      if (!r.ok) {
        const e = await r.text();
        console.error('Claude:', r.status, e);
        return NextResponse.json({ error: `Claude ${r.status}` }, { status: 500 });
      }

      const data = await r.json();
      const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '';
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: lastError || 'Rate limit exceeded, try again shortly' }, { status: 429 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
