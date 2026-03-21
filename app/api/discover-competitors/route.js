import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { website, brandName, industry, region, services } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

    const context = [
      brandName && `Business: ${brandName}`,
      website && `Website: ${website}`,
      industry && `Industry: ${industry}`,
      region && `Region: ${region}`,
      services && `Services: ${services}`,
    ].filter(Boolean).join('. ');

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'You are a competitive intelligence analyst. Search the web to find real competitors for the given business. Return ONLY a valid JSON array with accurate, real companies.',
        messages: [{
          role: 'user',
          content: `Find 6-10 real competitors for this business: ${context}

Search the web to find companies that compete with this business. Look for:
- Direct competitors in the same geographic area
- Companies offering the same/similar services
- Aspirational brands in the same industry the business might benchmark against

For each competitor found, return:
{
  "name": "Company Name",
  "website": "https://...",
  "rationale": "1-2 sentences explaining why they are a competitor",
  "category": "direct|aspirational|regional",
  "instagram": "",
  "facebook": "",
  "linkedin": ""
}

Return a JSON array. Only include real, verifiable companies you can find evidence of online.`
        }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      console.error('Discover competitors error:', r.status, e);
      return NextResponse.json({ error: `API ${r.status}` }, { status: 500 });
    }

    const data = await r.json();
    const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '';
    let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        const competitors = JSON.parse(arrMatch[0]);
        return NextResponse.json({ competitors });
      } catch {}
    }
    return NextResponse.json({ competitors: [] });
  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
