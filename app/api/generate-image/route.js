import { NextResponse } from 'next/server';
const URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No key' }, { status: 500 });
    const r = await fetch(`${URL}?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `You are a creative director for Johnstown Kitchens, a bespoke kitchen maker in Ireland. Generate a detailed image brief for social media. Return ONLY JSON: {"imagePrompt":"Detailed 50-100 word scene description for AI image generation — lighting, style, colours, mood, editorial kitchen photography","pexelsQuery":"3-4 word search","canvaPrompt":"20 word Canva AI prompt","style":"editorial|lifestyle|close-up|overhead"}` }] },
        contents: [{ role: 'user', parts: [{ text: `Image brief for this post:\n"${prompt}"` }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
      }),
    });
    if (!r.ok) return NextResponse.json({ error: 'Failed' }, { status: 500 });
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.filter(p => p.text).map(p => p.text).join('\n') || '';
    const m = text.match(/\{[\s\S]*\}/);
    return NextResponse.json(m ? JSON.parse(m[0]) : { imagePrompt: text });
  } catch (err) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
