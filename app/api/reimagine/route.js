import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request) {
  try {
    const { competitorContent, brandSettings } = await request.json();
    if (!competitorContent) return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY set' }, { status: 500 });

    const {
      brandName = '',
      website = '',
      toneOfVoice = '',
      voiceGuidelines = '',
      targetAudience = '',
      exampleContent = [],
      topicsToAvoid = '',
      preferredFormats = [],
      cta = '',
      tagline = '',
    } = brandSettings || {};

    const brandContext = [
      brandName && `Brand: ${brandName}`,
      website && `Website: ${website}`,
      tagline && `Tagline: "${tagline}"`,
      toneOfVoice && `Tone of voice: ${toneOfVoice}`,
      voiceGuidelines && `Voice guidelines: ${voiceGuidelines}`,
      targetAudience && `Target audience: ${targetAudience}`,
      cta && `Default CTA: ${cta}`,
      topicsToAvoid && `Topics to avoid: ${topicsToAvoid}`,
      preferredFormats.length && `Preferred formats: ${preferredFormats.join(', ')}`,
    ].filter(Boolean).join('\n');

    const examples = Array.isArray(exampleContent) && exampleContent.filter(Boolean);
    const examplesSection = examples?.length
      ? `\n\nEXAMPLE CONTENT FROM THIS BRAND (match this style):\n${examples.map((e, i) => `Example ${i + 1}: ${e}`).join('\n\n')}`
      : '';

    const sourceType = competitorContent.source || 'post';
    const formatInstr = {
      blog: 'Write a full blog article (600-1200 words) with a headline, introduction, body sections, and conclusion.',
      instagram: 'Write an Instagram caption with a punchy first line hook, storytelling body, clear CTA, and relevant hashtags.',
      facebook: 'Write a Facebook post — conversational, storytelling, with a call to action.',
      linkedin: 'Write a LinkedIn post — professional thought leadership tone, 150-300 words.',
      website: 'Write a website page section or landing page copy — benefit-led, clear headings.',
    }[sourceType] || 'Write a social media post suitable for the content type.';

    const prompt = `BRAND SETTINGS:
${brandContext}${examplesSection}

COMPETITOR CONTENT TO REIMAGINE:
Competitor: ${competitorContent.competitor || 'Unknown'}
Title: ${competitorContent.title || ''}
Source type: ${sourceType}
Content: ${competitorContent.content || ''}

TASK: ${formatInstr}
Write this entirely in the brand's voice — original content, not a rewrite. The topic/angle is what performed well; the content should be genuinely fresh.

Return fields: title (headline), content (full publish-ready text), metaDescription (SEO description or empty), hashtags (space-separated or empty), rationale (1-2 sentences on strategic angle).`;

    const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You are a content writer. Reimagine competitor content in the client's brand voice. Produce original, publish-ready content." }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 3000,
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title:           { type: 'STRING' },
              content:         { type: 'STRING' },
              metaDescription: { type: 'STRING' },
              hashtags:        { type: 'STRING' },
              rationale:       { type: 'STRING' },
            },
            required: ['title', 'content', 'rationale'],
          },
        },
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      console.error('Gemini reimagine:', r.status, e);
      return NextResponse.json({ error: `Gemini ${r.status}` }, { status: 500 });
    }

    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('Reimagine parse error:', e.message);
      result = { title: 'Reimagined Content', content: text, metaDescription: '', hashtags: '', rationale: '' };
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.error('Reimagine error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
