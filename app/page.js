'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

const B = { burgundy: '#5E3032', sand: '#BFBAA9', sage: '#87866C', brown: '#756158', cream: '#f3f0eb', warmWhite: '#faf8f5', dark: '#1e1e1e', white: '#ffffff' };

const ALL_PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: '📘', desc: '2/week', on: true },
  { id: 'instagram', label: 'Instagram', icon: '📸', desc: '2/week', on: true },
  { id: 'pinterest', label: 'Pinterest', icon: '📌', desc: '3/week', on: true },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', desc: '1/week', on: false },
  { id: 'gbp', label: 'Google Business', icon: '📍', desc: '2/week', on: false },
];
const DEFAULT_PILLARS = ['Behind the Scenes', 'Client Stories', 'Design Education', 'Supplier Spotlight', 'Local Life', 'Before & After'];
const AUDIENCES = ['Homeowner Renovating', 'New Build', 'Architect/Developer', 'General'];
const POST_STATES = ['Draft', 'Ready', 'Scheduled', 'Published'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COMP_CATS = { direct: { label: 'Direct', color: B.burgundy }, aspirational: { label: 'Aspirational', color: B.sage }, regional: { label: 'Regional', color: B.brown } };

const DEFAULT_BRAND = { website: 'https://www.johnstownkitchens.ie', facebook: '', instagram: '', pinterest: '', linkedin: '', phone: '', email: 'bob@johnstownkitchens.ie', address: 'Puckane, Nenagh, Co. Tipperary', tagline: 'Designs for real life', cta: 'Book a free consultation' };
const DEFAULT_COMPS = [{ name: 'Noel Dempsey Kitchens', category: 'direct' }, { name: 'McGowan Fitted Kitchens', category: 'direct' }, { name: 'Celtic Interiors', category: 'regional' }, { name: "O'Connor Kitchens", category: 'regional' }];

const CONTENT_FORMATS = ['Long-form articles', 'Short posts', 'Listicles', 'How-to guides', 'Thought leadership', 'Behind the scenes', 'Case studies', 'Product showcases'];
const DEFAULT_BRAND_STYLE = { toneOfVoice: 'warm, honest and approachable — like a trusted local expert, never pushy or salesy', voiceGuidelines: 'Bob speaks from personal experience. First-person is fine. Uses plain language, avoids jargon. Focuses on real outcomes for real families. Honest about timelines and costs.', targetAudience: 'Homeowners in Tipperary and surrounding counties planning a kitchen renovation, typically aged 35-60, family-focused, quality-conscious', exampleContent: ['', '', ''], topicsToAvoid: 'Discount deals, price wars, political opinions', preferredFormats: ['Short posts', 'Behind the scenes', 'Case studies'] };

const BIZ = `Johnstown Kitchens — bespoke kitchen design, Puckane, Nenagh, Co. Tipperary, Ireland. Bob Schweitnitz. German precision, Irish warmth. Custom kitchens, never flat-pack. "Designs for real life". Free consultations. Cabinetry from €12k. Appliances: Bora, Miele, Neff, Siemens, Bosch, Quooker. Worktops: Silestone, Dekton, Caesarstone, Corian. Tone: warm, benefit-focused, transparent. Never pushy.`;

const SEASONAL = [
  { month: 1, day: 1, label: 'New Year Planning Season', tip: 'Peak search for kitchen ideas', type: 'seasonal' },
  { month: 1, day: 15, label: 'January Planning Push', tip: 'People researching renovations', type: 'seasonal' },
  { month: 2, day: 14, label: "Valentine's Day", tip: 'Kitchen as heart of the home', type: 'cultural' },
  { month: 3, day: 1, label: 'Spring Renovation Season', tip: 'Book consultation now', type: 'seasonal' },
  { month: 3, day: 15, label: 'SEAI BER Grant Applications', tip: 'Kitchen renovation + energy efficiency', type: 'grant_deadline' },
  { month: 3, day: 17, label: "St Patrick's Day", tip: 'Irish-made pride', type: 'cultural' },
  { month: 4, day: 1, label: 'Ideal Home Show Dublin', tip: 'Attendance content', type: 'trade_show' },
  { month: 4, day: 15, label: 'Easter / Bank Holiday', tip: 'Family kitchen content', type: 'cultural' },
  { month: 5, day: 1, label: 'May Bank Holiday', tip: 'Showroom open day', type: 'cultural' },
  { month: 5, day: 10, label: 'National Self-Build Show', tip: 'Industry networking', type: 'trade_show' },
  { month: 5, day: 20, label: 'Summer Project Planning', tip: 'Book for autumn install', type: 'seasonal' },
  { month: 6, day: 1, label: 'June Bank Holiday', tip: 'Showroom visit push', type: 'cultural' },
  { month: 6, day: 15, label: "Father's Day", tip: 'Cooking together', type: 'cultural' },
  { month: 6, day: 21, label: 'Longest Day', tip: 'Light bright kitchens', type: 'seasonal' },
  { month: 7, day: 1, label: 'Summer Inspiration', tip: 'Quieter but strong for inspiration', type: 'seasonal' },
  { month: 8, day: 1, label: 'August Bank Holiday', tip: 'Autumn planning push', type: 'cultural' },
  { month: 8, day: 20, label: 'Back to School', tip: 'Family kitchen organisation', type: 'seasonal' },
  { month: 9, day: 1, label: 'Post-Summer Surge', tip: 'Still time for Christmas', type: 'seasonal' },
  { month: 10, day: 1, label: 'KBIS Kitchen Events', tip: 'International trends', type: 'trade_show' },
  { month: 10, day: 28, label: 'October Bank Holiday', tip: 'Last before Christmas', type: 'cultural' },
  { month: 11, day: 24, label: 'Black Friday', tip: 'Free consultation, NOT discount', type: 'cultural' },
  { month: 12, day: 1, label: 'Christmas Season', tip: 'Aspiration content', type: 'seasonal' },
  { month: 12, day: 15, label: 'Year in Review', tip: 'Best projects roundup', type: 'seasonal' },
];

// ═══ STORAGE ═══
const L = {
  get(k, fb) { try { if (typeof window === 'undefined') return fb; const v = localStorage.getItem('jk:' + k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set(k, v) { try { if (typeof window !== 'undefined') localStorage.setItem('jk:' + k, JSON.stringify(v)); } catch {} }
};

// ═══ API — robust JSON extraction ═══
async function callAI(system, prompt, useSearch = false) {
  const r = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system, prompt, useSearch }) });
  if (!r.ok) { const t = await r.text(); throw new Error(`API ${r.status}: ${t}`); }
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.text || '';
}

// Find the first balanced JSON value — picks whichever of [ or { appears first
// in the response, so embedded arrays in the prompt that get echoed back can't
// steal the result from the actual object the model was asked to produce.
function extractJSON(str) {
  const s = str.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const ai = s.indexOf('['), oi = s.indexOf('{');
  const starts = [[ai, '['], [oi, '{']].filter(([i]) => i !== -1).sort((a, b) => a[0] - b[0]);
  for (const [start] of starts) {
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (!inStr) {
        if (ch === '[' || ch === '{') depth++;
        else if (ch === ']' || ch === '}') { depth--; if (depth === 0) return s.slice(start, i + 1); }
      }
    }
  }
  return null;
}

// Sanitise unescaped control chars inside JSON string values before parsing
function safeJSONParse(s) {
  let out = '', inStr = false, esc = false;
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; out += ch; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr && code < 0x20) { out += ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : ch === '\t' ? '\\t' : '\\u' + code.toString(16).padStart(4, '0'); continue; }
    out += ch;
  }
  return JSON.parse(out);
}

async function callJSON(sys, usr, useSearch = false) {
  const raw = await callAI(sys, usr, useSearch);
  const chunk = extractJSON(raw);
  if (chunk) return safeJSONParse(chunk);
  throw new Error('No JSON found in response');
}

// ═══ COMPONENTS ═══
function Sp({ light, sz = 16 }) { return <div style={{ width: sz, height: sz, border: `2px solid ${light ? 'rgba(255,255,255,0.25)' : B.sand}`, borderTopColor: light ? '#fff' : B.burgundy, borderRadius: '50%', animation: 'jkspin .7s linear infinite' }} />; }
function Skel() { return <div style={{ height: 65, background: `linear-gradient(90deg,${B.cream} 25%,${B.sand}30 50%,${B.cream} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 2, marginBottom: 8 }} />; }
function SkelList({ n = 3 }) { return <>{Array.from({ length: n }).map((_, i) => <Skel key={i} />)}</>; }
function Badge({ platform }) { const c = { facebook: '#1877F2', instagram: '#E4405F', pinterest: '#E60023', linkedin: '#0A66C2', gbp: '#4285F4' }[platform] || B.brown; const p = ALL_PLATFORMS.find(x => x.id === platform); return <span style={{ padding: '3px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, background: `${c}12`, color: c, border: `1px solid ${c}22`, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '0.8px' }}>{p?.icon} {p?.label || platform}</span>; }
function Card({ children, style }) { return <div style={{ background: B.white, borderRadius: 2, border: `1px solid ${B.sand}50`, padding: 18, ...style }}>{children}</div>; }
function Sec({ title, sub, children, action }) { return <div style={{ marginBottom: 28 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}><div><h2 style={{ margin: 0, fontSize: 19, fontWeight: 400, color: B.dark, fontFamily: "'Cormorant',Georgia,serif" }}>{title}</h2>{sub && <p style={{ margin: '2px 0 0', fontSize: 12, color: B.sage }}>{sub}</p>}</div>{action}</div>{children}</div>; }

// ═══ CREATE POST MODAL ═══
function CreateModal({ onClose, onSave, platforms, pillars, initialIdea, brand, brandStyle }) {
  const [idea, setIdea] = useState(initialIdea || '');
  const [audience, setAudience] = useState('General');
  const [pillar, setPillar] = useState(pillars[0] || '');
  const [results, setResults] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState({});

  const plats = platforms.filter(p => p !== 'blog');

  const generate = async () => {
    if (!idea.trim()) return;
    setGenerating(true); setError(''); setResults(null);
    try {
      const brandInfo = [brand?.cta && `Default CTA: "${brand.cta}"`, brand?.website && `Website: ${brand.website}`, brandStyle?.toneOfVoice && `Tone: ${brandStyle.toneOfVoice}`, brandStyle?.voiceGuidelines && `Voice: ${brandStyle.voiceGuidelines}`, brandStyle?.targetAudience && `Audience: ${brandStyle.targetAudience}`].filter(Boolean).join('. ');
      const platNames = plats.map(p => ALL_PLATFORMS.find(x => x.id === p)?.label || p).join(', ');

      // Generate one platform at a time for reliability
      const allResults = {};
      for (const p of plats) {
        const platInstr = {
          facebook: 'Write a Facebook post. Longer, storytelling, conversational, include a call to action.',
          instagram: 'Write an Instagram caption. Punchy hook in the first line, visual-first, use emojis naturally.',
          pinterest: "Write a Pinterest pin description. SEO-rich with keywords like 'bespoke kitchen Ireland', 'kitchen renovation Tipperary'. 2-3 searchable sentences.",
          linkedin: 'Write a LinkedIn post. Professional thought leadership, B2B angle for architects and developers.',
          gbp: 'Write a Google Business Profile post. Short (under 150 words), local SEO focused, mention Tipperary/Ireland.',
        }[p] || 'Write a social media post.';

        const r = await callJSON(
          `You are a social media writer for Johnstown Kitchens. ${BIZ}${brandInfo} Return ONLY a JSON object with "content" and "hashtags" fields. Nothing else.`,
          `${platInstr}\n\nTopic: "${idea}"\nContent pillar: ${pillar}\nTarget audience: ${audience}\nTone: warm, honest, Bob's personal voice. Never salesy.\n\nReturn: {"content":"the full post text ready to publish","hashtags":"#relevant #hashtags"}`
        );
        allResults[p] = r;
      }
      setResults(allResults);
    } catch (e) {
      console.error('Generate error:', e);
      setError('Generation failed: ' + e.message);
    }
    setGenerating(false);
  };

  const copy = (key, text) => { navigator.clipboard.writeText(text); setCopied(c => ({ ...c, [key]: true })); setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 2000); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: B.white, borderRadius: 3, width: '100%', maxWidth: 820, maxHeight: '92vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 17, fontFamily: "'Cormorant',Georgia,serif" }}>Create a Post</h3><p style={{ margin: '2px 0 0', fontSize: 11, color: B.sage }}>Generates for {plats.length} platform{plats.length > 1 ? 's' : ''}</p></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: B.sage }}>×</button>
        </div>

        {/* Input */}
        {!results && (<>
          <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Your idea or topic</label>
          <textarea className="jk-input" rows={4} placeholder="e.g., Just finished a stunning oak kitchen in Waterford — client wanted modern but warm..." value={idea} onChange={e => setIdea(e.target.value)} style={{ resize: 'vertical', marginBottom: 12, lineHeight: 1.6 }} />
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Pillar</label><select className="jk-input" value={pillar} onChange={e => setPillar(e.target.value)}>{pillars.map(p => <option key={p}>{p}</option>)}</select></div>
            <div style={{ flex: '1 1 180px' }}><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Audience</label><select className="jk-input" value={audience} onChange={e => setAudience(e.target.value)}>{AUDIENCES.map(a => <option key={a}>{a}</option>)}</select></div>
          </div>
          {error && <p style={{ color: B.burgundy, fontSize: 13, marginBottom: 10 }}>{error}</p>}
          <button className="jk-btn" onClick={generate} disabled={generating || !idea.trim()} style={{ background: B.burgundy, color: B.white, width: '100%', justifyContent: 'center', padding: 14, opacity: generating || !idea.trim() ? 0.6 : 1 }}>
            {generating ? <><Sp light sz={14} /> Generating {plats.length} versions...</> : `✦ Generate Posts`}
          </button>
        </>)}

        {/* Results */}
        {results && (<>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12, marginBottom: 16 }}>
            {plats.filter(p => results[p]).map(p => (
              <div key={p} style={{ border: `1px solid ${B.sand}50`, borderRadius: 2, padding: 16 }}>
                <Badge platform={p} />
                <p style={{ margin: '10px 0 8px', fontSize: 13, color: B.dark, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{results[p].content}</p>
                {results[p].hashtags && <p style={{ margin: '0 0 10px', fontSize: 11, color: B.burgundy }}>{results[p].hashtags}</p>}
                <button className="jk-btn-sm" onClick={() => copy(p, results[p].content + (results[p].hashtags ? '\n\n' + results[p].hashtags : ''))} style={{ width: '100%', justifyContent: 'center' }}>{copied[p] ? '✓ Copied!' : 'Copy to Clipboard'}</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="jk-btn" onClick={() => { onSave(plats.filter(p => results[p]).map(p => ({ platform: p, content: results[p].content, hashtags: results[p].hashtags || '', pillar, audience, state: 'Draft', created_at: new Date().toISOString() }))); }} style={{ flex: 1, justifyContent: 'center', background: B.burgundy, color: B.white }}>💾 Save All as Drafts</button>
            <button className="jk-btn" onClick={() => { setResults(null); setIdea(''); setError(''); }} style={{ background: B.white, color: B.brown, border: `1px solid ${B.sand}` }}>New Post</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

// ═══ REIMAGINE MODAL ═══
function ReimagineModal({ posts, brandStyle, brand, onClose, onSave }) {
  const isBulk = Array.isArray(posts);
  const items = isBulk ? posts : [posts];
  const [results, setResults] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState({});

  const brandSettings = { ...brand, toneOfVoice: brandStyle.toneOfVoice, voiceGuidelines: brandStyle.voiceGuidelines, targetAudience: brandStyle.targetAudience, exampleContent: brandStyle.exampleContent, topicsToAvoid: brandStyle.topicsToAvoid, preferredFormats: brandStyle.preferredFormats };

  const generate = async (monitorItems) => {
    setGenerating(true); setError(''); setResults([]);
    const all = [];
    for (let i = 0; i < monitorItems.length; i++) {
      setCurrent(i + 1);
      try {
        const r = await fetch('/api/reimagine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ competitorContent: monitorItems[i], brandSettings }) });
        const d = await r.json();
        if (d.result) all.push({ ...d.result, sourceItem: monitorItems[i], id: Math.random().toString(36).slice(2, 8) });
        else setError(d.error || 'Generation failed');
      } catch (e) { setError(e.message); }
    }
    setResults(all);
    setGenerating(false);
  };

  useEffect(() => { generate(items); }, []);

  const copy = (id, text) => { navigator.clipboard.writeText(text); setCopied(c => ({ ...c, [id]: true })); setTimeout(() => setCopied(c => ({ ...c, [id]: false })), 2000); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: B.white, borderRadius: 3, width: '100%', maxWidth: 860, maxHeight: '92vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontFamily: "'Cormorant',Georgia,serif" }}>✦ Reimagine</h3>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: B.sage }}>Rewriting {items.length} piece{items.length > 1 ? 's' : ''} in your brand voice</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: B.sage }}>×</button>
        </div>

        {generating && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Sp sz={28} />
            <p style={{ margin: '14px 0 0', fontSize: 13, color: B.brown }}>Generating {isBulk ? `${current} of ${items.length}` : ''}...</p>
          </div>
        )}

        {error && <p style={{ color: B.burgundy, fontSize: 13, marginBottom: 12 }}>{error}</p>}

        {results.map((r, i) => (
          <div key={r.id} style={{ marginBottom: 20, padding: 16, border: `1px solid ${B.sand}50`, borderRadius: 2 }}>
            {isBulk && <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: B.sage, textTransform: 'uppercase', fontFamily: "'Montserrat',sans-serif" }}>From: {r.sourceItem?.competitor} — {r.sourceItem?.title}</p>}
            <h4 style={{ margin: '0 0 8px', fontSize: 16, fontFamily: "'Cormorant',Georgia,serif" }}>{r.title}</h4>
            {r.metaDescription && <div style={{ padding: '6px 10px', background: B.cream, borderRadius: 2, marginBottom: 8, fontSize: 11, color: B.brown }}><strong>Meta:</strong> {r.metaDescription}</div>}
            <p style={{ margin: '0 0 8px', fontSize: 13, color: B.dark, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.content}</p>
            {r.hashtags && <p style={{ margin: '0 0 8px', fontSize: 11, color: B.burgundy }}>{r.hashtags}</p>}
            {r.rationale && <p style={{ margin: '0 0 10px', fontSize: 11, color: B.sage, fontStyle: 'italic' }}>💡 {r.rationale}</p>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="jk-btn" onClick={() => copy(r.id, r.content + (r.hashtags ? '\n\n' + r.hashtags : ''))} style={{ background: B.white, color: B.dark, border: `1px solid ${B.sand}` }}>{copied[r.id] ? '✓ Copied!' : 'Copy'}</button>
              <button className="jk-btn" onClick={() => onSave({ platform: r.sourceItem?.source || 'facebook', content: r.content, hashtags: r.hashtags || '', state: 'Draft', created_at: new Date().toISOString() })} style={{ background: B.burgundy, color: B.white }}>💾 Save as Draft</button>
            </div>
          </div>
        ))}

        {results.length > 1 && (
          <button className="jk-btn" onClick={() => results.forEach(r => onSave({ platform: r.sourceItem?.source || 'facebook', content: r.content, hashtags: r.hashtags || '', state: 'Draft', created_at: new Date().toISOString() }))} style={{ background: B.burgundy, color: B.white, width: '100%', justifyContent: 'center', padding: 12 }}>💾 Save All {results.length} as Drafts</button>
        )}
      </div>
    </div>
  );
}

// ═══ MAIN APP ═══
export default function Page() {
  const supabase = createClient();
  const [tab, setTab] = useState('dashboard');
  const [comps, setComps] = useState([]);
  const [compResults, setCompResults] = useState(null);
  const [digest, setDigest] = useState(null);
  const [trends, setTrends] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [blog, setBlog] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [ld, setLd] = useState({});
  const [topics, setTopics] = useState('');
  const [activePlatforms, setActivePlatforms] = useState([]);
  const [calPlatforms, setCalPlatforms] = useState({ facebook: true, instagram: true, pinterest: true, linkedin: false, gbp: false });
  const [calFreq, setCalFreq] = useState({ facebook: 2, instagram: 3, pinterest: 2, linkedin: 1, gbp: 1 });
  const [calTopics, setCalTopics] = useState([]);
  const [calCustomInput, setCalCustomInput] = useState('');
  const [pillars, setPillars] = useState([]);
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [showCreate, setShowCreate] = useState(false);
  const [createIdea, setCreateIdea] = useState('');
  const [newC, setNewC] = useState('');
  const [newCCat, setNewCCat] = useState('direct');
  const [newPillar, setNewPillar] = useState('');
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [dynEvents, setDynEvents] = useState([]);
  const [eventsScanDate, setEventsScanDate] = useState(null);
  const [pexelsQ, setPexelsQ] = useState('');
  const [pexelsResults, setPexelsResults] = useState([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [brandStyle, setBrandStyle] = useState(DEFAULT_BRAND_STYLE);
  const [monitorContent, setMonitorContent] = useState([]);
  const [crawlProgress, setCrawlProgress] = useState(null); // null | { current, total, name }
  const [discoveredComps, setDiscoveredComps] = useState([]);
  const [discovering, setDiscovering] = useState(false);
  const [newCompWebsite, setNewCompWebsite] = useState('');
  const [newCompIG, setNewCompIG] = useState('');
  const [newCompFB, setNewCompFB] = useState('');
  const [newCompLI, setNewCompLI] = useState('');
  const [newCompNotes, setNewCompNotes] = useState('');
  const [monitorFilter, setMonitorFilter] = useState({ comp: 'all', type: 'all', minScore: 0 });
  const [showReimagine, setShowReimagine] = useState(false);
  const [reimaginePost, setReimaginePost] = useState(null);
  const [bulkSelected, setBulkSelected] = useState([]);

  const sl = (k, v) => setLd(p => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user));
    setComps(L.get('comps', DEFAULT_COMPS));
    setCompResults(L.get('compResults', null));
    setDigest(L.get('digest', null));
    setTrends(L.get('trends', null));
    setSchedule(L.get('schedule', null));
    setBlog(L.get('blog', null));
    setSavedPosts(L.get('savedPosts', []));
    setActivePlatforms(L.get('platforms', ALL_PLATFORMS.filter(p => p.on).map(p => p.id)));
    setPillars(L.get('pillars', DEFAULT_PILLARS));
    setBrand(L.get('brand', DEFAULT_BRAND));
    setDynEvents(L.get('dynEvents', []));
    setEventsScanDate(L.get('eventsScanDate', null));
    setBrandStyle(L.get('brandStyle', DEFAULT_BRAND_STYLE));
    setMonitorContent(L.get('monitorContent', []));
    setDiscoveredComps(L.get('discoveredComps', []));
    setCalPlatforms(L.get('calPlatforms', { facebook: true, instagram: true, pinterest: true, linkedin: false, gbp: false }));
    setCalFreq(L.get('calFreq', { facebook: 2, instagram: 3, pinterest: 2, linkedin: 1, gbp: 1 }));
    setCalTopics(L.get('calTopics', []));
    setReady(true);
  }, []);

  useEffect(() => { if (ready) L.set('comps', comps); }, [comps, ready]);
  useEffect(() => { if (ready) L.set('platforms', activePlatforms); }, [activePlatforms, ready]);
  useEffect(() => { if (ready) L.set('pillars', pillars); }, [pillars, ready]);
  useEffect(() => { if (ready) L.set('savedPosts', savedPosts); }, [savedPosts, ready]);
  useEffect(() => { if (ready) L.set('brand', brand); }, [brand, ready]);
  useEffect(() => { if (ready) L.set('brandStyle', brandStyle); }, [brandStyle, ready]);
  useEffect(() => { if (ready) L.set('monitorContent', monitorContent); }, [monitorContent, ready]);
  useEffect(() => { if (ready) L.set('discoveredComps', discoveredComps); }, [discoveredComps, ready]);
  useEffect(() => { if (ready) L.set('calPlatforms', calPlatforms); }, [calPlatforms, ready]);
  useEffect(() => { if (ready) L.set('calFreq', calFreq); }, [calFreq, ready]);
  useEffect(() => { if (ready) L.set('calTopics', calTopics); }, [calTopics, ready]);

  const now = new Date();
  const allEvents = [...SEASONAL.map(e => ({ ...e, src: 'pre' })), ...dynEvents.map(e => ({ ...e, src: 'disc' }))];
  const upcoming = allEvents.filter(e => {
    const d = e.date ? new Date(e.date) : new Date(now.getFullYear(), e.month - 1, e.day);
    if (!e.date && d < now) d.setFullYear(d.getFullYear() + 1);
    return (d - now) / 864e5 <= 90 && (d - now) / 864e5 >= 0;
  }).sort((a, b) => {
    const gd = e => { const d = e.date ? new Date(e.date) : new Date(now.getFullYear(), e.month - 1, e.day); if (!e.date && d < now) d.setFullYear(d.getFullYear() + 1); return d; };
    return gd(a) - gd(b);
  }).slice(0, 10);
  const eventStale = eventsScanDate ? (now - new Date(eventsScanDate)) / 864e5 > 30 : true;

  const getDays = (e) => { const d = e.date ? new Date(e.date) : new Date(now.getFullYear(), e.month - 1, e.day); if (!e.date && d < now) d.setFullYear(d.getFullYear() + 1); return Math.max(0, Math.ceil((d - now) / 864e5)); };

  // ═══ ACTIONS ═══
  const scanTrends = async () => {
    sl('trends', true);
    try { const r = await callJSON(`Content strategist for Irish bespoke kitchen business. Return ONLY a JSON array, no other text.`, `Search for 8 current trends in: kitchen design, Irish home renovation, BER grants, kitchen social media trends. Return: [{"topic":"...","summary":"2-3 sentences","layer":"design|market|content","relevance":"high|medium","contentAngle":"How Bob could post about this","exampleHook":"Opening line for a post"}]`, true); setTrends(r); L.set('trends', r); }
    catch (e) { console.error(e); setTrends([{ topic: 'Scan failed — try again', summary: e.message, relevance: 'medium', layer: 'design' }]); }
    sl('trends', false);
  };

  const scanEvents = async () => {
    sl('events', true);
    try { const r = await callJSON(`Events researcher for Irish kitchen business. Return ONLY a JSON array.`, `Search for upcoming kitchen, interiors, renovation events in Ireland/UK 2026: trade shows, expos, awards, grant deadlines, design weeks. Return 5-8: [{"label":"...","date":"YYYY-MM-DD","tip":"Content angle","type":"trade_show|award|grant_deadline"}]`, true); setDynEvents(r); L.set('dynEvents', r); const d = now.toISOString(); setEventsScanDate(d); L.set('eventsScanDate', d); }
    catch (e) { console.error(e); }
    sl('events', false);
  };

  const scanComps = async () => {
    sl('comps', true);
    try {
      const names = comps.map(c => c.name).join(', ');
      const r = await callJSON(`Social media analyst for Irish kitchen businesses. Public web only. All engagement = ESTIMATES. If not found, say so. Return ONLY a JSON array.`, `Search social media for: ${names}. Per competitor return: {"competitor":"...","platforms":{"instagram":{"profileFound":true,"followerEstimate":"unknown","postFrequency":"sporadic","overallScore":3,"scoreBreakdown":{"frequency":3,"contentQuality":3,"engagement":3},"topPosts":[{"content":"...","type":"showcase","whyItWorks":"..."}],"strengths":["..."],"gaps":["..."]}}}`);
      setCompResults(r); L.set('compResults', r);
      try {
        const dg = await callJSON(`Content strategist. Be specific, no waffle. Return ONLY JSON.`, `COMPETITORS: ${JSON.stringify(r)}\nTRENDS: ${JSON.stringify(trends || [])}\n\nReturn: {"competitorMoves":[{"move":"...","competitor":"..."}],"contentGaps":[{"gap":"...","opportunity":"..."}],"recommendedActions":[{"action":"...","why":"..."}]}`);
        setDigest(dg); L.set('digest', dg);
      } catch {}
    } catch (e) { console.error(e); }
    sl('comps', false);
  };

  const genSchedule = async () => {
    sl('schedule', true);
    try {
      const selectedPlatforms = ALL_PLATFORMS.filter(p => calPlatforms[p.id]);
      if (!selectedPlatforms.length) { sl('schedule', false); return; }

      // Build posting plan: each platform × its frequency
      const plan = selectedPlatforms.map(p => `${p.label}: ${calFreq[p.id] || 1} post${(calFreq[p.id] || 1) > 1 ? 's' : ''}/week`).join(', ');
      const totalPosts = selectedPlatforms.reduce((sum, p) => sum + (calFreq[p.id] || 1), 0);

      const allTopics = [...(calTopics.length ? calTopics : pillars)];
      const topicStr = allTopics.length ? allTopics.join(', ') : pillars.join(', ');
      const trendSummary = trends?.slice(0, 3).map(t => t.topic).join(', ');
      const styleCtx = [brandStyle?.toneOfVoice && `Tone: ${brandStyle.toneOfVoice}`, brandStyle?.targetAudience && `Audience: ${brandStyle.targetAudience}`, brandStyle?.voiceGuidelines && `Voice: ${brandStyle.voiceGuidelines}`].filter(Boolean).join('. ');

      const r = await callJSON(
        `You are a social media strategist for Johnstown Kitchens. ${BIZ}${styleCtx ? ' ' + styleCtx : ''} Return ONLY a valid JSON array.`,
        `Create a weekly content schedule with exactly ${totalPosts} posts.

Posting plan: ${plan}
Topics to draw from: ${topicStr}${trendSummary ? `\nCurrent trends to weave in: ${trendSummary}` : ''}
Content pillars: ${pillars.join(', ')}

Rules:
- Spread posts evenly across Mon–Sat (avoid Sunday unless needed)
- Do NOT exceed the frequency per platform stated above
- Each post must be full publish-ready content, not a placeholder
- Match platform tone: Instagram = visual/punchy, Facebook = storytelling, Pinterest = SEO-rich, LinkedIn = professional, Google Business = local/short

Return a JSON array where every item is:
{"day":"Monday","time":"10:00 AM","platform":"facebook","title":"Post title","content":"Full ready-to-post content","hashtags":"#tag1 #tag2","pillar":"Pillar name","rationale":"One sentence why"}`
      );
      setSchedule(r); L.set('schedule', r);
    } catch (e) { console.error(e); setSchedule([{ day: 'Error', platform: 'facebook', title: 'Failed', content: e.message }]); }
    sl('schedule', false);
  };

  const genBlog = async () => {
    sl('blog', true);
    try {
      // Summarise trends as plain text — not raw JSON — to avoid the model echoing
      // a JSON array before the blog object, which confuses the extractor.
      const trendSummary = trends?.slice(0, 3).map(t => t.topic).join(', ');
      const r = await callJSON(
        `You are a content strategist for Johnstown Kitchens. ${BIZ} Return ONLY a single JSON object, no arrays, no other text.`,
        `Write a monthly blog concept for johnstownkitchens.ie.${trendSummary ? ` Relevant trends: ${trendSummary}.` : ''} Optimise for Irish kitchen renovation searches. Return this exact JSON object: {"title":"...","outline":["Section 1","Section 2","Section 3","Section 4"],"introduction":"Opening two paragraphs of the article","seoKeywords":["keyword 1","keyword 2","keyword 3"],"metaDescription":"155-char meta description","rationale":"Why this topic now"}`
      );
      if (!r || Array.isArray(r) || !r.title) throw new Error('Unexpected response shape');
      setBlog(r); L.set('blog', r);
    } catch (e) {
      console.error('genBlog error:', e);
      setBlog({ title: 'Error', introduction: e.message });
    }
    sl('blog', false);
  };

  const searchPexels = async () => {
    if (!pexelsQ.trim()) return;
    setPexelsLoading(true);
    try {
      const r = await fetch(`/api/pexels?q=${encodeURIComponent(pexelsQ)}`);
      const d = await r.json();
      if (d.error) { alert(d.error); } else { setPexelsResults(d.photos || []); }
    } catch { alert('Pexels search failed'); }
    setPexelsLoading(false);
  };

  // Progressive monitor scan — one competitor at a time to avoid timeout
  const scanMonitor = async (compsToScan) => {
    const list = compsToScan || comps;
    if (!list.length) return;
    setMonitorContent([]);
    for (let i = 0; i < list.length; i++) {
      const comp = list[i];
      setCrawlProgress({ current: i + 1, total: list.length, name: comp.name });
      try {
        const r = await fetch('/api/crawl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ competitor: comp }) });
        const d = await r.json();
        if (d.content?.length) setMonitorContent(prev => { const next = [...prev, ...d.content].sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0)); L.set('monitorContent', next); return next; });
      } catch (e) { console.error('Monitor scan error:', e); }
    }
    setCrawlProgress(null);
  };

  const discoverComps = async () => {
    setDiscovering(true);
    try {
      const r = await fetch('/api/discover-competitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website: brand.website, brandName: 'Johnstown Kitchens', industry: 'Bespoke kitchen design', region: 'Tipperary, Ireland', services: 'Custom kitchens, cabinetry, kitchen design' }) });
      const d = await r.json();
      if (d.competitors?.length) { setDiscoveredComps(d.competitors); L.set('discoveredComps', d.competitors); }
    } catch (e) { console.error('Discover error:', e); }
    setDiscovering(false);
  };

  const addDiscoveredComp = (dc) => {
    if (!comps.find(c => c.name === dc.name)) setComps(prev => [...prev, { name: dc.name, category: dc.category || 'direct', website: dc.website || '', instagram: dc.instagram || '', facebook: dc.facebook || '', linkedin: dc.linkedin || '', notes: dc.rationale || '' }]);
    setDiscoveredComps(prev => prev.filter(d => d.name !== dc.name));
  };

  const fullScan = async () => { await scanTrends(); await scanComps(); await genSchedule(); };
  const scanning = ld.trends || ld.comps || ld.schedule;
  const logout = async () => { await supabase.auth.signOut(); window.location.href = '/login'; };
  const addSaved = (posts) => setSavedPosts(p => [...posts, ...p]);
  const addComp = () => { if (newC.trim()) { setComps([...comps, { name: newC.trim(), category: newCCat, website: newCompWebsite.trim(), instagram: newCompIG.trim(), facebook: newCompFB.trim(), linkedin: newCompLI.trim(), notes: newCompNotes.trim() }]); setNewC(''); setNewCompWebsite(''); setNewCompIG(''); setNewCompFB(''); setNewCompLI(''); setNewCompNotes(''); } };

  const exportCSV = () => {
    if (!schedule) return;
    const rows = ['Day,Time,Platform,Title,Content,Hashtags,Pillar'];
    schedule.forEach(p => rows.push([p.day, p.time, p.platform, `"${(p.title || '').replace(/"/g, '""')}"`, `"${(p.content || '').replace(/"/g, '""')}"`, `"${(p.hashtags || '').replace(/"/g, '""')}"`, p.pillar || ''].join(',')));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = `jk-${now.toISOString().split('T')[0]}.csv`; a.click();
  };

  const allTabs = [{ id: 'dashboard', l: 'Dashboard' }, { id: 'competitors', l: 'Competitors' }, { id: 'monitor', l: 'Monitor' }, { id: 'schedule', l: 'Calendar' }, { id: 'library', l: 'Saved' }, { id: 'images', l: 'Images' }, { id: 'blog', l: 'Blog' }, { id: 'settings', l: 'Settings' }];

  if (!ready) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: B.warmWhite }}><Sp sz={24} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: B.warmWhite, fontFamily: "'Josefin Sans',sans-serif" }}>
      <style>{`
        @keyframes jkspin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .jk-tab{padding:11px 14px;border:none;background:transparent;color:${B.sage};font-size:10px;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid transparent;white-space:nowrap}
        .jk-tab:hover{color:${B.dark};border-bottom-color:${B.sand}}
        .jk-tab.active{color:${B.burgundy};border-bottom-color:${B.burgundy};font-weight:700}
        .jk-btn{padding:9px 16px;border:none;border-radius:2px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;display:inline-flex;align-items:center;gap:6px}
        .jk-btn:disabled{opacity:.5;cursor:default}
        .jk-btn-sm{padding:5px 10px;border:1px solid ${B.sand}60;border-radius:2px;font-size:10px;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;background:${B.cream};color:${B.brown}}
        .jk-btn-sm:hover{border-color:${B.burgundy};color:${B.burgundy}}
        .jk-input{padding:9px 12px;border:1px solid ${B.sand};border-radius:2px;font-size:12px;font-family:'Josefin Sans',sans-serif;outline:none;width:100%;background:${B.white}}
        .jk-input:focus{border-color:${B.burgundy}}
        textarea.jk-input{line-height:1.6}
        .jk-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:${B.cream};color:${B.dark};font-size:11px;border:1px solid ${B.sand}60;border-radius:2px}
        .jk-chip button{background:none;border:none;color:${B.burgundy};cursor:pointer;font-size:13px;padding:0}
        .filter-btn{padding:5px 11px;border:1px solid ${B.sand}60;border-radius:2px;font-size:9px;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;text-transform:uppercase;background:${B.cream};color:${B.brown}}
        .filter-btn.on{background:${B.burgundy};color:${B.white};border-color:${B.burgundy}}
      `}</style>

      {/* HEADER */}
      <div style={{ background: B.dark, padding: '13px 24px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontFamily: "'Montserrat',sans-serif", fontWeight: 600, color: B.cream, letterSpacing: '3px', textTransform: 'uppercase' }}><span style={{ color: B.sand }}>Johnstown</span> Kitchens</h1>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {user && <span style={{ fontSize: 11, color: B.sand }}>{user.email}</span>}
            <button className="jk-btn" onClick={() => { setCreateIdea(''); setShowCreate(true); }} style={{ background: B.white, color: B.dark }}>✦ Create Post</button>
            <button className="jk-btn" onClick={fullScan} disabled={scanning} style={{ background: B.burgundy, color: B.cream }}>{scanning ? <><Sp light sz={12} /> Scanning</> : 'Full Scan'}</button>
            <button onClick={logout} style={{ background: 'none', border: 'none', color: B.sage, cursor: 'pointer', fontSize: 11 }}>Logout</button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: B.cream, borderBottom: `1px solid ${B.sand}60`, padding: '0 24px', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex' }}>{allTabs.map(t => <button key={t.id} className={`jk-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.l}</button>)}</div>
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '22px 24px 50px' }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === 'dashboard' && (<>
          <Sec title="Upcoming Events" sub={eventsScanDate ? `Scanned ${Math.floor((now - new Date(eventsScanDate)) / 864e5)}d ago` : 'Preloaded — scan for more'} action={<button className="jk-btn" onClick={scanEvents} disabled={ld.events} style={{ background: eventStale ? B.burgundy : B.white, color: eventStale ? B.white : B.dark, border: eventStale ? 'none' : `1px solid ${B.sand}` }}>{ld.events ? '...' : 'Scan Events'}</button>}>
            {ld.events ? <SkelList n={4} /> : upcoming.map((e, i) => (
              <Card key={i} style={{ marginBottom: 6, padding: 12, borderLeft: `3px solid ${e.type === 'grant_deadline' ? B.burgundy : e.type === 'trade_show' ? B.sage : B.sand}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: B.dark, fontFamily: "'Montserrat',sans-serif" }}>{e.label}</p>
                      {e.src === 'disc' && <span style={{ fontSize: 8, fontWeight: 700, color: B.white, background: B.sage, padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase' }}>Discovered</span>}
                      <span style={{ fontSize: 8, fontWeight: 600, color: B.brown, background: `${B.brown}10`, padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase' }}>{(e.type || '').replace('_', ' ')}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: B.sage }}>{e.tip}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ textAlign: 'right' }}><span style={{ fontSize: 20, fontWeight: 300, color: B.dark, fontFamily: "'Cormorant',Georgia,serif" }}>{getDays(e)}</span><p style={{ margin: 0, fontSize: 9, color: B.sage, textTransform: 'uppercase' }}>days</p></div>
                    <button className="jk-btn-sm" onClick={() => { setCreateIdea(`${e.label}: ${e.tip}`); setShowCreate(true); }}>✦ Post</button>
                  </div>
                </div>
              </Card>
            ))}
          </Sec>

          {digest && <Sec title="Weekly Digest"><Card style={{ borderLeft: `3px solid ${B.burgundy}` }}>
            {digest.competitorMoves?.map((m, i) => <p key={i} style={{ margin: '0 0 4px', fontSize: 12, color: B.brown, paddingLeft: 10, borderLeft: `2px solid ${B.sand}` }}><strong>{m.competitor}:</strong> {m.move}</p>)}
            {digest.contentGaps?.map((g, i) => <p key={i} style={{ margin: '4px 0', fontSize: 12, color: B.sage }}>Gap: <strong>{g.gap}</strong> → {g.opportunity}</p>)}
            {digest.recommendedActions?.map((a, i) => <div key={i} style={{ margin: '6px 0', padding: '6px 10px', background: B.warmWhite, borderRadius: 2, fontSize: 12 }}><strong>{a.action}</strong> <span style={{ color: B.sage }}>— {a.why}</span></div>)}
          </Card></Sec>}

          <Sec title="Trends" action={<button className="jk-btn" style={{ background: B.white, color: B.dark, border: `1px solid ${B.sand}` }} onClick={scanTrends} disabled={ld.trends}>{ld.trends ? '...' : 'Refresh'}</button>}>
            {ld.trends ? <SkelList /> : trends ? trends.map((t, i) => (
              <Card key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 2, background: B.burgundy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: B.cream, fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: "'Montserrat',sans-serif" }}>{i + 1}</div>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, fontFamily: "'Montserrat',sans-serif" }}>{t.topic}</h4>
                      <p style={{ margin: '0 0 3px', fontSize: 12, color: B.brown, lineHeight: 1.5 }}>{t.summary}</p>
                      {t.relevance && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 2, background: t.relevance === 'high' ? `${B.burgundy}12` : `${B.sage}15`, color: t.relevance === 'high' ? B.burgundy : B.sage, textTransform: 'uppercase' }}>{t.relevance}</span>}
                      {t.contentAngle && <p style={{ margin: '3px 0 0', fontSize: 11, color: B.sage, fontStyle: 'italic' }}>💡 {t.contentAngle}</p>}
                      {t.exampleHook && <p style={{ margin: '2px 0 0', fontSize: 11, color: B.burgundy }}>Hook: "{t.exampleHook}"</p>}
                    </div>
                  </div>
                  <button className="jk-btn-sm" onClick={() => { setCreateIdea(`${t.topic}: ${t.contentAngle || t.summary}`); setShowCreate(true); }} style={{ alignSelf: 'flex-start' }}>✦ Post</button>
                </div>
              </Card>
            )) : <Card><p style={{ margin: 0, color: B.sage, textAlign: 'center', padding: 20 }}>Hit Full Scan or Refresh</p></Card>}
          </Sec>
        </>)}

        {/* ═══ COMPETITORS ═══ */}
        {tab === 'competitors' && (<>
          {/* Auto-discovery */}
          <Sec title="Auto-Discover Competitors" sub="AI searches the web to find your competitors based on your business profile" action={<button className="jk-btn" onClick={discoverComps} disabled={discovering} style={{ background: B.burgundy, color: B.white }}>{discovering ? <><Sp light sz={12} /> Searching...</> : 'Discover'}</button>}>
            {discoveredComps.length > 0 ? discoveredComps.map((dc, i) => (
              <Card key={i} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <strong style={{ fontSize: 13 }}>{dc.name}</strong>
                    <span style={{ fontSize: 9, fontWeight: 700, color: (COMP_CATS[dc.category] || {}).color || B.brown, background: `${(COMP_CATS[dc.category] || {}).color || B.brown}12`, padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase' }}>{dc.category}</span>
                  </div>
                  {dc.website && <p style={{ margin: '0 0 2px', fontSize: 11, color: B.burgundy }}>{dc.website}</p>}
                  <p style={{ margin: 0, fontSize: 12, color: B.brown }}>{dc.rationale}</p>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="jk-btn-sm" onClick={() => addDiscoveredComp(dc)} style={{ color: B.burgundy, borderColor: B.burgundy }}>+ Add</button>
                  <button className="jk-btn-sm" onClick={() => setDiscoveredComps(prev => prev.filter((_, j) => j !== i))}>Dismiss</button>
                </div>
              </Card>
            )) : <Card><p style={{ margin: 0, color: B.sage, textAlign: 'center', padding: 16, fontSize: 12 }}>Click Discover to find competitors automatically, or add them manually below.</p></Card>}
          </Sec>

          {/* Manual entry */}
          <Sec title="Add Competitor Manually">
            <Card style={{ background: B.cream }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 10 }}>
                <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>Company Name *</label><input className="jk-input" placeholder="e.g. Noel Dempsey Kitchens" value={newC} onChange={e => setNewC(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComp()} /></div>
                <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>Category</label><select className="jk-input" value={newCCat} onChange={e => setNewCCat(e.target.value)}>{Object.entries(COMP_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>Website</label><input className="jk-input" placeholder="https://..." value={newCompWebsite} onChange={e => setNewCompWebsite(e.target.value)} /></div>
                <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>Instagram URL</label><input className="jk-input" placeholder="https://instagram.com/..." value={newCompIG} onChange={e => setNewCompIG(e.target.value)} /></div>
                <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>Facebook URL</label><input className="jk-input" placeholder="https://facebook.com/..." value={newCompFB} onChange={e => setNewCompFB(e.target.value)} /></div>
                <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>LinkedIn URL</label><input className="jk-input" placeholder="https://linkedin.com/..." value={newCompLI} onChange={e => setNewCompLI(e.target.value)} /></div>
              </div>
              <div style={{ marginBottom: 10 }}><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>Notes (optional)</label><input className="jk-input" placeholder="e.g. Direct competitor in UK market" value={newCompNotes} onChange={e => setNewCompNotes(e.target.value)} /></div>
              <button className="jk-btn" style={{ background: B.burgundy, color: B.cream }} onClick={addComp} disabled={!newC.trim()}>Add Competitor</button>
            </Card>
          </Sec>

          <Sec title="Monitored Competitors" sub={`${comps.length} competitor${comps.length !== 1 ? 's' : ''} — go to Monitor tab to scan content`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 8 }}>
              {comps.map((c, i) => (
                <Card key={i} style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <strong style={{ fontSize: 12, fontFamily: "'Montserrat',sans-serif" }}>{c.name}</strong>
                        <span style={{ fontSize: 9, fontWeight: 700, color: (COMP_CATS[c.category] || {}).color || B.brown, textTransform: 'uppercase' }}>{c.category}</span>
                      </div>
                      {c.website && <p style={{ margin: '0 0 1px', fontSize: 10, color: B.burgundy }}>{c.website}</p>}
                      {c.notes && <p style={{ margin: '0', fontSize: 10, color: B.sage, fontStyle: 'italic' }}>{c.notes}</p>}
                    </div>
                    <button onClick={() => setComps(comps.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: B.burgundy, cursor: 'pointer', fontSize: 16 }}>×</button>
                  </div>
                </Card>
              ))}
              {!comps.length && <Card><p style={{ margin: 0, color: B.sage, fontSize: 12, padding: 8 }}>No competitors added yet.</p></Card>}
            </div>
          </Sec>

          <Sec title="Social Media Analysis" sub="All engagement estimated from public signals" action={<button className="jk-btn" style={{ background: B.burgundy, color: B.white }} onClick={scanComps} disabled={ld.comps}>{ld.comps ? 'Scanning...' : 'Scan Competitors'}</button>}>
            {ld.comps ? <SkelList n={5} /> : compResults ? compResults.map((comp, ci) => (
              <Card key={ci} style={{ marginBottom: 10 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, fontFamily: "'Montserrat',sans-serif" }}>{comp.competitor}</h3>
                {comp.platforms && Object.entries(comp.platforms).map(([plat, d]) => (
                  <div key={plat} style={{ marginBottom: 8, padding: '10px 12px', background: B.warmWhite, borderRadius: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      <Badge platform={plat} />
                      {d.profileFound === false ? <span style={{ fontSize: 11, color: B.burgundy }}>No profile — opportunity for Johnstown</span> : <>
                        {d.postFrequency && <span style={{ fontSize: 11, color: B.brown }}>{d.postFrequency}</span>}
                        {d.overallScore && <span style={{ fontSize: 12, fontWeight: 700, background: B.cream, padding: '1px 6px', borderRadius: 2 }}>{d.overallScore}/5</span>}
                      </>}
                    </div>
                    {d.topPosts?.slice(0, 2).map((p, pi) => (
                      <div key={pi} style={{ padding: '5px 8px', marginTop: 4, background: B.white, borderRadius: 2, borderLeft: `2px solid ${B.sand}` }}>
                        <span style={{ fontSize: 10, color: B.brown, fontWeight: 600 }}>{p.type}</span>
                        <p style={{ margin: '2px 0', fontSize: 12, color: B.dark }}>{p.content}</p>
                        {p.whyItWorks && <p style={{ margin: 0, fontSize: 11, color: B.sage, fontStyle: 'italic' }}>💡 {p.whyItWorks}</p>}
                      </div>
                    ))}
                    {d.gaps?.length > 0 && <p style={{ margin: '4px 0 0', fontSize: 11, color: B.burgundy }}>Gaps: {d.gaps.join(' · ')}</p>}
                  </div>
                ))}
              </Card>
            )) : <Card><p style={{ margin: 0, color: B.sage, textAlign: 'center', padding: 24 }}>Add competitors and run a scan</p></Card>}
          </Sec>
        </>)}

        {/* ═══ MONITOR ═══ */}
        {tab === 'monitor' && (<>
          {/* Scan controls */}
          <Card style={{ marginBottom: 16, background: B.cream }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: "'Montserrat',sans-serif" }}>Content Monitoring</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: B.sage }}>Searches Instagram, Facebook and blog for each competitor — last 30 days. Results appear as each completes.</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {monitorContent.length > 0 && <button className="jk-btn" onClick={() => { setMonitorContent([]); L.set('monitorContent', []); }} style={{ background: B.white, color: B.brown, border: `1px solid ${B.sand}` }}>Clear</button>}
                <button className="jk-btn" onClick={() => scanMonitor()} disabled={!!crawlProgress} style={{ background: B.burgundy, color: B.white }}>
                  {crawlProgress ? <><Sp light sz={12} /> Scanning {crawlProgress.name} ({crawlProgress.current}/{crawlProgress.total})</> : 'Scan All Competitors'}
                </button>
              </div>
            </div>
            {bulkSelected.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: B.brown }}>{bulkSelected.length} selected</span>
                <button className="jk-btn" style={{ background: B.burgundy, color: B.white }} onClick={() => { setReimaginePost(bulkSelected); setShowReimagine(true); }}>Reimagine Selected ({bulkSelected.length})</button>
                <button className="jk-btn-sm" onClick={() => setBulkSelected([])}>Clear selection</button>
              </div>
            )}
          </Card>

          {/* Filters */}
          {monitorContent.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="jk-input" style={{ width: 'auto', fontSize: 11 }} value={monitorFilter.comp} onChange={e => setMonitorFilter(f => ({ ...f, comp: e.target.value }))}>
                <option value="all">All competitors</option>
                {[...new Set(monitorContent.map(c => c.competitor))].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select className="jk-input" style={{ width: 'auto', fontSize: 11 }} value={monitorFilter.type} onChange={e => setMonitorFilter(f => ({ ...f, type: e.target.value }))}>
                <option value="all">All types</option>
                {['blog', 'instagram', 'facebook', 'linkedin', 'website'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="jk-input" style={{ width: 'auto', fontSize: 11 }} value={monitorFilter.minScore} onChange={e => setMonitorFilter(f => ({ ...f, minScore: Number(e.target.value) }))}>
                <option value={0}>Any score</option>
                <option value={4}>Score 4+</option>
                <option value={6}>Score 6+</option>
                <option value={8}>Score 8+</option>
              </select>
              <span style={{ fontSize: 11, color: B.sage, marginLeft: 4 }}>
                {monitorContent.filter(c => (monitorFilter.comp === 'all' || c.competitor === monitorFilter.comp) && (monitorFilter.type === 'all' || c.source === monitorFilter.type) && (c.performanceScore || 0) >= monitorFilter.minScore).length} results
              </span>
            </div>
          )}

          {/* Content cards */}
          {crawlProgress && !monitorContent.length && <SkelList n={4} />}
          {monitorContent.length === 0 && !crawlProgress && (
            <Card>
              <p style={{ margin: '0 0 6px', color: B.sage, textAlign: 'center', padding: '20px 28px 4px', fontSize: 13 }}>Add competitors in the Competitors tab, then click Scan All Competitors.</p>
              <p style={{ margin: '0 0 20px', color: B.sage, textAlign: 'center', fontSize: 11 }}>Tip: add social profile URLs when adding competitors for better results — especially for smaller local businesses whose posts may not appear in general search.</p>
            </Card>
          )}
          {monitorContent.filter(c => (monitorFilter.comp === 'all' || c.competitor === monitorFilter.comp) && (monitorFilter.type === 'all' || c.source === monitorFilter.type) && (c.performanceScore || 0) >= monitorFilter.minScore).map((item, i) => {
            const isSel = bulkSelected.includes(item.id);
            return (
              <Card key={item.id || i} style={{ marginBottom: 8, borderLeft: isSel ? `3px solid ${B.burgundy}` : `3px solid ${B.sand}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                    <input type="checkbox" checked={isSel} onChange={() => setBulkSelected(prev => isSel ? prev.filter(x => x !== item.id) : [...prev, item.id])} style={{ marginTop: 3, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 12, fontFamily: "'Montserrat',sans-serif", color: B.dark }}>{item.competitor}</strong>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 2, textTransform: 'uppercase', background: item.source === 'instagram' ? '#E4405F18' : item.source === 'facebook' ? '#1877F218' : item.source === 'linkedin' ? '#0A66C218' : B.cream, color: item.source === 'instagram' ? '#E4405F' : item.source === 'facebook' ? '#1877F2' : item.source === 'linkedin' ? '#0A66C2' : B.brown }}>{item.source === 'instagram' ? '📸 Instagram' : item.source === 'facebook' ? '📘 Facebook' : item.source === 'linkedin' ? '💼 LinkedIn' : item.source === 'blog' ? '✍️ Blog' : '🌐 Website'}</span>
                        {item.publishedAt && <span style={{ fontSize: 10, color: B.sage }}>{item.publishedAt}</span>}
                        {item.performanceScore > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: item.performanceScore >= 7 ? `${B.burgundy}15` : B.cream, color: item.performanceScore >= 7 ? B.burgundy : B.brown, padding: '1px 6px', borderRadius: 2 }}>Score: {item.performanceScore}/10</span>}
                      </div>
                      {item.title && <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: B.dark }}>{item.title}</h4>}
                      <p style={{ margin: '0 0 6px', fontSize: 12, color: B.brown, lineHeight: 1.55 }}>{item.content}</p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: B.sage, flexWrap: 'wrap' }}>
                        {item.engagementData?.likes > 0 && <span>👍 {item.engagementData.likes} likes</span>}
                        {item.engagementData?.shares > 0 && <span>↗ {item.engagementData.shares} shares</span>}
                        {item.engagementData?.comments > 0 && <span>💬 {item.engagementData.comments} comments</span>}
                        {item.seoData?.estimatedTraffic && <span>Traffic: {item.seoData.estimatedTraffic}</span>}
                        {item.seoData?.keywords?.length > 0 && <span>Keywords: {item.seoData.keywords.slice(0, 3).join(', ')}</span>}
                        {item.url && <a href={item.url} target="_blank" rel="noopener" style={{ color: B.burgundy }}>View original →</a>}
                      </div>
                    </div>
                  </div>
                  <button className="jk-btn" onClick={() => { setReimaginePost(item); setShowReimagine(true); }} style={{ background: B.burgundy, color: B.white, whiteSpace: 'nowrap', flexShrink: 0 }}>✦ Reimagine</button>
                </div>
              </Card>
            );
          })}
        </>)}

        {/* ═══ CALENDAR ═══ */}
        {tab === 'schedule' && (<>
          {/* Config card */}
          <Card style={{ marginBottom: 16, background: B.cream }}>
            {/* Platforms + frequency */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: B.brown, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Montserrat',sans-serif" }}>Platforms &amp; Frequency</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_PLATFORMS.map(plat => {
                  const on = !!calPlatforms[plat.id];
                  return (
                    <div key={plat.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: on ? B.white : `${B.sand}30`, border: `1px solid ${on ? B.burgundy + '40' : B.sand + '60'}`, borderRadius: 2, transition: 'all .15s' }}>
                      <button onClick={() => setCalPlatforms(p => ({ ...p, [plat.id]: !p[plat.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5, opacity: on ? 1 : 0.45 }}>
                        <span style={{ fontSize: 14 }}>{plat.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'Montserrat',sans-serif", color: on ? B.dark : B.sage }}>{plat.label}</span>
                      </button>
                      {on && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4, borderLeft: `1px solid ${B.sand}`, paddingLeft: 8 }}>
                          <button onClick={() => setCalFreq(f => ({ ...f, [plat.id]: Math.max(1, (f[plat.id] || 1) - 1) }))} style={{ background: B.cream, border: `1px solid ${B.sand}`, borderRadius: 2, width: 20, height: 20, cursor: 'pointer', fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: B.brown }}>−</button>
                          <span style={{ fontSize: 12, fontWeight: 700, color: B.burgundy, minWidth: 16, textAlign: 'center' }}>{calFreq[plat.id] || 1}</span>
                          <button onClick={() => setCalFreq(f => ({ ...f, [plat.id]: Math.min(7, (f[plat.id] || 1) + 1) }))} style={{ background: B.cream, border: `1px solid ${B.sand}`, borderRadius: 2, width: 20, height: 20, cursor: 'pointer', fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: B.brown }}>+</button>
                          <span style={{ fontSize: 9, color: B.sage, fontFamily: "'Montserrat',sans-serif" }}>/wk</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: B.sage }}>
                {Object.entries(calPlatforms).filter(([, v]) => v).reduce((s, [k]) => s + (calFreq[k] || 1), 0)} posts per week total
              </p>
            </div>

            {/* Topics */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: B.brown, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Montserrat',sans-serif" }}>Topics</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {[...pillars, ...calTopics.filter(t => !pillars.includes(t))].map(topic => {
                  const selected = calTopics.includes(topic) || calTopics.length === 0;
                  return (
                    <button key={topic} onClick={() => setCalTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic])} className="filter-btn" style={{ background: calTopics.includes(topic) ? B.burgundy : calTopics.length === 0 ? B.cream : B.cream, color: calTopics.includes(topic) ? B.white : B.brown, borderColor: calTopics.includes(topic) ? B.burgundy : `${B.sand}60`, opacity: calTopics.length === 0 ? 0.7 : 1 }}>
                      {topic} {calTopics.includes(topic) ? '×' : '+'}
                    </button>
                  );
                })}
              </div>
              {calTopics.length === 0 && <p style={{ margin: '0 0 8px', fontSize: 11, color: B.sage, fontStyle: 'italic' }}>All pillars included — select specific topics to focus on, or add custom ones below.</p>}
              {calTopics.length > 0 && <button onClick={() => setCalTopics([])} style={{ background: 'none', border: 'none', color: B.sage, fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: 0, marginBottom: 8 }}>Clear selection (use all)</button>}
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="jk-input" placeholder="Add custom topic e.g. SEAI BER grants, handleless kitchens..." value={calCustomInput} onChange={e => setCalCustomInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && calCustomInput.trim()) { setCalTopics(p => [...p, calCustomInput.trim()]); setCalCustomInput(''); } }} style={{ flex: 1 }} />
                <button className="jk-btn" style={{ background: B.white, color: B.dark, border: `1px solid ${B.sand}`, whiteSpace: 'nowrap' }} onClick={() => { if (calCustomInput.trim()) { setCalTopics(p => [...p, calCustomInput.trim()]); setCalCustomInput(''); } }}>Add topic</button>
              </div>
            </div>

            {/* Generate */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="jk-btn" style={{ background: B.burgundy, color: B.white }} onClick={genSchedule} disabled={ld.schedule || !Object.values(calPlatforms).some(Boolean)}>
                  {ld.schedule ? <><Sp light sz={12} /> Generating...</> : schedule ? 'Regenerate Calendar' : 'Generate Calendar'}
                </button>
                {schedule && <button className="jk-btn" style={{ background: B.white, color: B.dark, border: `1px solid ${B.sand}` }} onClick={exportCSV}>Export CSV</button>}
              </div>
              {schedule && <span style={{ fontSize: 11, color: B.sage }}>{schedule.length} posts generated</span>}
            </div>
          </Card>

          {/* Results */}
          {ld.schedule ? <SkelList n={6} /> : schedule ? DAYS.map(day => {
            const dp = schedule.filter(p => p.day === day); if (!dp.length) return null;
            return <div key={day} style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: "'Montserrat',sans-serif", borderBottom: `1px solid ${B.sand}50`, paddingBottom: 4 }}>{day}</h3>
              {dp.map((p, i) => (
                <Card key={i} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Badge platform={p.platform} />
                        <span style={{ fontSize: 10, color: B.sage }}>{p.time}</span>
                        {p.pillar && <span style={{ fontSize: 9, color: B.brown, background: `${B.brown}08`, padding: '2px 6px', borderRadius: 2, fontWeight: 600 }}>{p.pillar}</span>}
                      </div>
                      {p.title && <h4 style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, fontFamily: "'Montserrat',sans-serif" }}>{p.title}</h4>}
                      <p style={{ margin: 0, fontSize: 12, color: B.brown, lineHeight: 1.6 }}>{p.content}</p>
                      {p.hashtags && <p style={{ margin: '3px 0 0', fontSize: 10, color: B.burgundy }}>{p.hashtags}</p>}
                      {p.rationale && <p style={{ margin: '4px 0 0', fontSize: 11, color: B.sage, fontStyle: 'italic' }}>💡 {p.rationale}</p>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <button className="jk-btn-sm" onClick={() => navigator.clipboard.writeText(p.content + (p.hashtags ? '\n\n' + p.hashtags : ''))}>Copy</button>
                      <button className="jk-btn-sm" onClick={() => addSaved([{ platform: p.platform, content: p.content, hashtags: p.hashtags, pillar: p.pillar, state: 'Draft', created_at: now.toISOString() }])}>Save</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>;
          }) : null}
        </>)}

        {/* ═══ SAVED ═══ */}
        {tab === 'library' && (
          <Sec title="Saved Posts" sub={`${savedPosts.length} total`}>
            {savedPosts.length > 0 ? savedPosts.map((p, i) => (
              <Card key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <Badge platform={p.platform} />
                      {p.pillar && <span style={{ fontSize: 9, color: B.brown, background: `${B.brown}08`, padding: '2px 6px', borderRadius: 2, fontWeight: 600 }}>{p.pillar}</span>}
                      <select value={p.state || 'Draft'} onChange={e => { const n = [...savedPosts]; n[i] = { ...n[i], state: e.target.value }; setSavedPosts(n); }} style={{ fontSize: 10, padding: '2px 6px', border: `1px solid ${B.sand}`, borderRadius: 2 }}>{POST_STATES.map(s => <option key={s}>{s}</option>)}</select>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: B.dark, lineHeight: 1.5 }}>{p.content}</p>
                    {p.hashtags && <p style={{ margin: '2px 0 0', fontSize: 10, color: B.burgundy }}>{p.hashtags}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <button className="jk-btn-sm" onClick={() => navigator.clipboard.writeText(p.content + (p.hashtags ? '\n\n' + p.hashtags : ''))}>Copy</button>
                    <button className="jk-btn-sm" onClick={() => setSavedPosts(savedPosts.filter((_, j) => j !== i))} style={{ color: B.burgundy }}>×</button>
                  </div>
                </div>
              </Card>
            )) : <Card><p style={{ margin: 0, color: B.sage, textAlign: 'center', padding: 24 }}>No saved posts yet — create or save from calendar</p></Card>}
          </Sec>
        )}

        {/* ═══ IMAGES ═══ */}
        {tab === 'images' && (
          <Sec title="Image Search" sub="Search Pexels for free stock photos to use with your posts">
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="jk-input" placeholder="Search photos... e.g. modern kitchen, oak countertop, kitchen island" value={pexelsQ} onChange={e => setPexelsQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchPexels()} />
                <button className="jk-btn" style={{ background: B.burgundy, color: B.cream, whiteSpace: 'nowrap' }} onClick={searchPexels} disabled={pexelsLoading}>{pexelsLoading ? '...' : 'Search'}</button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {['bespoke kitchen', 'kitchen island', 'oak kitchen', 'marble countertop', 'kitchen renovation', 'modern kitchen', 'shaker kitchen'].map(q => (
                  <button key={q} className="jk-btn-sm" onClick={() => { setPexelsQ(q); }}>{q}</button>
                ))}
              </div>
            </Card>
            {pexelsResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                {pexelsResults.map(p => (
                  <div key={p.id} style={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${B.sand}50` }}>
                    <img src={p.src.medium} alt={p.alt} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '8px 10px', background: B.white }}>
                      <p style={{ margin: '0 0 4px', fontSize: 11, color: B.sage }}>📷 {p.photographer}</p>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <a href={p.src.original} target="_blank" rel="noopener" className="jk-btn-sm" style={{ textDecoration: 'none', flex: 1, justifyContent: 'center', display: 'flex' }}>Download</a>
                        <a href={p.url} target="_blank" rel="noopener" className="jk-btn-sm" style={{ textDecoration: 'none' }}>Pexels</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pexelsResults.length > 0 && <p style={{ margin: '12px 0 0', fontSize: 11, color: B.sage, textAlign: 'center' }}>Photos provided by <a href="https://www.pexels.com" target="_blank" rel="noopener" style={{ color: B.burgundy }}>Pexels</a> — free for commercial use</p>}
          </Sec>
        )}

        {/* ═══ BLOG ═══ */}
        {tab === 'blog' && (
          <Sec title="Monthly Blog" action={<button className="jk-btn" style={{ background: B.burgundy, color: B.cream }} onClick={genBlog} disabled={ld.blog}>{ld.blog ? '...' : 'Generate'}</button>}>
            {ld.blog ? <SkelList /> : blog?.title === 'Error' ? (
              <Card><p style={{ margin: 0, color: B.burgundy, padding: 12, fontSize: 12 }}>Generation failed: {blog.introduction} — click Generate to try again.</p></Card>
            ) : blog?.title ? (
              <Card>
                <h3 style={{ margin: '0 0 4px', fontSize: 20, fontFamily: "'Cormorant',Georgia,serif" }}>{blog.title}</h3>
                {blog.metaDescription && <div style={{ padding: '8px 10px', background: B.cream, borderRadius: 2, marginBottom: 10, fontSize: 11, color: B.brown }}><strong>Meta:</strong> {blog.metaDescription}</div>}
                {blog.seoKeywords?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>{blog.seoKeywords.map((k, i) => <span key={i} className="jk-chip" style={{ fontSize: 10 }}>{k}</span>)}</div>}
                {blog.outline?.map((s, i) => <div key={i} style={{ padding: '5px 12px', borderLeft: `3px solid ${B.burgundy}`, marginBottom: 2, fontSize: 12, color: B.brown, background: i % 2 === 0 ? B.warmWhite : B.white }}>{i + 1}. {s}</div>)}
                {blog.introduction && <p style={{ margin: '10px 0 0', fontSize: 13, color: B.brown, lineHeight: 1.7, padding: 14, background: B.warmWhite, borderRadius: 2 }}>{blog.introduction}</p>}
                {blog.rationale && <p style={{ margin: '8px 0 0', fontSize: 11, color: B.sage, fontStyle: 'italic' }}>💡 {blog.rationale}</p>}
              </Card>
            ) : <Card><p style={{ margin: 0, color: B.sage, textAlign: 'center', padding: 24 }}>Generate a blog concept</p></Card>}
          </Sec>
        )}

        {/* ═══ SETTINGS ═══ */}
        {tab === 'settings' && (<>
          <Sec title="Brand Voice & Style" sub="Used by all content generation across the platform to write in your voice">
            <Card>
              <div style={{ display: 'grid', gap: 14 }}>
                <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Tone of voice</label><input className="jk-input" placeholder='e.g. "warm and authoritative", "casual and witty", "corporate and precise"' value={brandStyle.toneOfVoice} onChange={e => setBrandStyle(s => ({ ...s, toneOfVoice: e.target.value }))} /></div>
                <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Brand voice guidelines</label><textarea className="jk-input" rows={4} placeholder="Detailed voice and style notes — e.g. first-person OK, avoid jargon, focus on customer outcomes..." value={brandStyle.voiceGuidelines} onChange={e => setBrandStyle(s => ({ ...s, voiceGuidelines: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Target audience</label><input className="jk-input" placeholder="Who you are writing for — demographics, mindset, what they care about" value={brandStyle.targetAudience} onChange={e => setBrandStyle(s => ({ ...s, targetAudience: e.target.value }))} /></div>
                <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Topics / themes to avoid</label><input className="jk-input" placeholder="e.g. discount deals, price wars, political opinions" value={brandStyle.topicsToAvoid} onChange={e => setBrandStyle(s => ({ ...s, topicsToAvoid: e.target.value }))} /></div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Preferred content formats</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {CONTENT_FORMATS.map(f => {
                      const on = (brandStyle.preferredFormats || []).includes(f);
                      return <button key={f} className={`filter-btn ${on ? 'on' : ''}`} onClick={() => setBrandStyle(s => ({ ...s, preferredFormats: on ? (s.preferredFormats || []).filter(x => x !== f) : [...(s.preferredFormats || []), f] }))}>{f}</button>;
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </Sec>

          <Sec title="Example Content" sub="Paste 3–5 of your best published posts so the AI can match your style">
            <Card>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>Example {i + 1}</label>
                  <textarea className="jk-input" rows={3} placeholder="Paste a published post, caption or article excerpt here..." value={(brandStyle.exampleContent || [])[i] || ''} onChange={e => setBrandStyle(s => { const ex = [...(s.exampleContent || ['', '', '', '', ''])]; ex[i] = e.target.value; return { ...s, exampleContent: ex }; })} style={{ resize: 'vertical', fontSize: 12 }} />
                </div>
              ))}
            </Card>
          </Sec>

          <Sec title="Brand & Contact" sub="Included in generated posts">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                {[['website', 'Website'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address'], ['tagline', 'Tagline'], ['cta', 'Default CTA']].map(([k, l]) => (
                  <div key={k}><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{l}</label><input className="jk-input" value={brand[k] || ''} onChange={e => setBrand({ ...brand, [k]: e.target.value })} /></div>
                ))}
              </div>
            </Card>
          </Sec>

          <Sec title="Social Links" sub="For cross-linking in posts">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                {[['facebook', '📘 Facebook'], ['instagram', '📸 Instagram'], ['pinterest', '📌 Pinterest'], ['linkedin', '💼 LinkedIn']].map(([k, l]) => (
                  <div key={k}><label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{l}</label><input className="jk-input" value={brand[k] || ''} onChange={e => setBrand({ ...brand, [k]: e.target.value })} placeholder="https://..." /></div>
                ))}
              </div>
            </Card>
          </Sec>

          <Sec title="Active Platforms">
            <Card>{ALL_PLATFORMS.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: B.warmWhite, borderRadius: 2, marginBottom: 4 }}>
                <span>{p.icon} {p.label} <span style={{ fontSize: 10, color: B.sage }}>({p.desc})</span></span>
                <button className={`filter-btn ${activePlatforms.includes(p.id) ? 'on' : ''}`} onClick={() => setActivePlatforms(activePlatforms.includes(p.id) ? activePlatforms.filter(x => x !== p.id) : [...activePlatforms, p.id])}>{activePlatforms.includes(p.id) ? 'Active' : 'Off'}</button>
              </div>
            ))}</Card>
          </Sec>

          <Sec title="Content Pillars">
            <Card>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>{pillars.map((p, i) => <span key={i} className="jk-chip">{p}<button onClick={() => setPillars(pillars.filter((_, j) => j !== i))}>×</button></span>)}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="jk-input" placeholder="Add pillar..." value={newPillar} onChange={e => setNewPillar(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newPillar.trim()) { setPillars([...pillars, newPillar.trim()]); setNewPillar(''); } }} />
                <button className="jk-btn" style={{ background: B.burgundy, color: B.cream }} onClick={() => { if (newPillar.trim()) { setPillars([...pillars, newPillar.trim()]); setNewPillar(''); } }}>Add</button>
              </div>
            </Card>
          </Sec>

          <Sec title="Competitors" sub="Also manageable from the Competitors tab">
            <Card>
              {comps.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: B.warmWhite, borderRadius: 2, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>{c.name} <span style={{ fontSize: 9, fontWeight: 700, color: (COMP_CATS[c.category] || {}).color || B.brown, textTransform: 'uppercase' }}>{c.category}</span></span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <select value={c.category} onChange={e => { const n = [...comps]; n[i] = { ...n[i], category: e.target.value }; setComps(n); }} style={{ fontSize: 10, padding: '2px 6px', border: `1px solid ${B.sand}`, borderRadius: 2 }}>{Object.entries(COMP_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                    <button onClick={() => setComps(comps.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: B.burgundy, cursor: 'pointer', fontSize: 14 }}>×</button>
                  </div>
                </div>
              ))}
            </Card>
          </Sec>
        </>)}
      </div>

      <div style={{ background: B.dark, padding: '12px 24px', textAlign: 'center' }}><p style={{ margin: 0, fontSize: 10, color: B.sage }}>Johnstown Kitchens · Puckane, Nenagh, Co. Tipperary · bob@johnstownkitchens.ie</p></div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSave={posts => { addSaved(posts); setShowCreate(false); }} platforms={activePlatforms} pillars={pillars} initialIdea={createIdea} brand={brand} brandStyle={brandStyle} />}
      {showReimagine && reimaginePost && (
        <ReimagineModal
          posts={Array.isArray(reimaginePost) ? monitorContent.filter(c => reimaginePost.includes(c.id)) : reimaginePost}
          brandStyle={brandStyle}
          brand={brand}
          onClose={() => { setShowReimagine(false); setReimaginePost(null); setBulkSelected([]); }}
          onSave={post => { addSaved([post]); }}
        />
      )}
    </div>
  );
}
