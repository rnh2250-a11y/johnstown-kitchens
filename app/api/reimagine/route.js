import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { competitorContent, brandSettings } = await request.json();
    if (!competitorContent) return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

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

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: `You are a content writer. Your job is to reimagine competitor content in the client's own brand voice.
Produce original, publish-ready content — not a paraphrase. Cover the same topic/angle but written entirely in the brand's style.
Return ONLY a JSON object with these fields: title, content, metaDescription, hashtags, rationale.`,
        messages: [{
          role: 'user',
          content: `BRAND SETTINGS:
${brandContext}${examplesSection}

COMPETITOR CONTENT TO REIMAGINE:
Competitor: ${competitorContent.competitor || 'Unknown'}
Title: ${competitorContent.title || ''}
Source type: ${sourceType}
Content: ${competitorContent.content || ''}

TASK: ${formatInstr}
Write this entirely in the brand's voice — original content, not a rewrite. The topic/angle is what performed well; the content should be genuinely fresh.

Return JSON:
{
  "title": "Suggested headline or post title",
  "content": "The full publish-ready content",
  "metaDescription": "SEO meta description (for blog/web content, else empty string)",
  "hashtags": "#suggested #hashtags",
  "rationale": "1-2 sentences explaining the strategic angle taken"
}`
        }],
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      console.error('Reimagine error:', r.status, e);
      return NextResponse.json({ error: `API ${r.status}` }, { status: 500 });
    }

    const data = await r.json();
    const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '';
    let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        const result = JSON.parse(objMatch[0]);
        return NextResponse.json({ result });
      } catch {}
    }
    // Fallback: return raw text
    return NextResponse.json({ result: { title: 'Reimagined Content', content: text, metaDescription: '', hashtags: '', rationale: '' } });
  } catch (err) {
    console.error('Reimagine error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
