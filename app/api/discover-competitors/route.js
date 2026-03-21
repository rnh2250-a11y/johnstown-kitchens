import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Escape control characters ONLY inside JSON string literals using a state machine.
// Structural whitespace (newlines between tokens) is left intact.
function sanitizeJsonStrings(str) {
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = ch.charCodeAt(0);
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; result += ch; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString && code < 0x20) {
      if (ch === '\n') result += '\\n';
      else if (ch === '\r') result += '\\r';
      else if (ch === '\t') result += '\\t';
      else result += '\\u' + code.toString(16).padStart(4, '0');
      continue;
    }
    result += ch;
  }
  return result;
}

export async function POST(request) {
  try {
    const { website, brandName, industry, region, services } = await request.json();
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY set' }, { status: 500 });

    const context = [
      brandName && `Business: ${brandName}`,
      website && `Website: ${website}`,
      industry && `Industry: ${industry}`,
      region && `Region: ${region}`,
      services && `Services: ${services}`,
    ].filter(Boolean).join('. ');

    const prompt = `Find 6-10 real competitors for this business: ${context}

Search the web to find companies that compete with this business. Look for:
- Direct competitors in the same geographic area
- Companies offering the same/similar services
- Aspirational brands in the same industry the business might benchmark against

For each competitor found, return a JSON object with these exact fields:
{
  "name": "Company Name",
  "website": "https://...",
  "rationale": "1-2 sentences explaining why they are a competitor",
  "category": "direct",
  "instagram": "",
  "facebook": "",
  "linkedin": ""
}

Return ONLY a raw JSON array with no markdown formatting, no code fences, no explanation text. Just the array starting with [ and ending with ].`;

    const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are a competitive intelligence analyst. Search the web to find real competitors for the given business. Return ONLY a raw JSON array — no markdown, no code fences, no explanation. Start with [ and end with ].' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.3 },
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      console.error('Gemini discover error:', r.status, e);
      return NextResponse.json({ error: `Gemini ${r.status}` }, { status: 500 });
    }

    const data = await r.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(p => p.text).map(p => p.text).join('\n').trim();

    let competitors = [];
    // Strip markdown fences if present
    const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const arrMatch = stripped.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        competitors = JSON.parse(sanitizeJsonStrings(arrMatch[0]));
      } catch (e) {
        console.error('JSON parse error after sanitize:', e.message);
        // Last resort: try the raw match directly
        try { competitors = JSON.parse(arrMatch[0]); } catch {}
      }
    } else {
      console.warn('No JSON array found. Text:', text.slice(0, 500));
    }

    return NextResponse.json({ competitors });
  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
