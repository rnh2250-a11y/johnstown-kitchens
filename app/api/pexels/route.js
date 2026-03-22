import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query) return NextResponse.json({ photos: [] });

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'PEXELS_API_KEY not configured' }, { status: 500 });

  try {
    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!r.ok) return NextResponse.json({ error: `Pexels ${r.status}` }, { status: r.status });
    const data = await r.json();
    return NextResponse.json({ photos: data.photos || [] });
  } catch (err) {
    console.error('Pexels error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
