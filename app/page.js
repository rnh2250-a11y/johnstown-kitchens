'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

// ═══ BRAND ═══
const B = { burgundy: '#5E3032', sand: '#BFBAA9', sage: '#87866C', brown: '#756158', cream: '#f3f0eb', warmWhite: '#faf8f5', dark: '#1e1e1e', white: '#ffffff' };

// ═══ CONSTANTS ═══
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
const DEFAULT_COMPS = [
  { name: 'Noel Dempsey Kitchens', category: 'direct' },
  { name: 'McGowan Fitted Kitchens', category: 'direct' },
  { name: 'Celtic Interiors', category: 'regional' },
  { name: "O'Connor Kitchens", category: 'regional' },
];
const DEFAULT_BRAND = {
  website: 'https://www.johnstownkitchens.ie',
  facebook: 'https://www.facebook.com/johnstownkitchens',
  instagram: 'https://www.instagram.com/johnstownkitchens',
  pinterest: '',
  linkedin: '',
  phone: '',
  email: 'bob@johnstownkitchens.ie',
  address: 'Puckane, Nenagh, Co. Tipperary',
  tagline: 'Designs for real life',
  cta: 'Book a free consultation',
};

const BIZ = `Johnstown Kitchens — bespoke kitchen design and cabinetry, Puckane, Nenagh, Co. Tipperary, Ireland. Run by Bob Schweitnitz (ex-Hausmann Interiors). German precision, Irish warmth. Custom kitchens, living spaces, cabinetry — never flat-pack. Serves Ireland, UK, Europe. "Designs for real life". Free consultations. Cabinetry from €12k. Appliances: Bora, Miele, Neff, Siemens, Bosch, Quooker. Worktops: Silestone, Dekton, Caesarstone, Corian. Tone: conversational, warm, benefit-focused, transparent. Never pushy.`;

const SEASONAL = [
  { month: 1, day: 1, label: 'New Year Planning Season', tip: 'Peak search volume for kitchen ideas', type: 'seasonal' },
  { month: 1, day: 15, label: 'January Planning Push', tip: 'People actively researching renovations', type: 'seasonal' },
  { month: 2, day: 1, label: 'Ideal Home Show Planning', tip: 'Content buildup for March/April show', type: 'trade_show' },
  { month: 2, day: 14, label: "Valentine's Day", tip: 'Cook together — kitchen as heart of the home', type: 'cultural' },
  { month: 3, day: 1, label: 'Spring Renovation Season', tip: 'Book your consultation now', type: 'seasonal' },
  { month: 3, day: 15, label: 'SEAI BER Grant Applications', tip: 'Tie kitchen renovation to energy efficiency grants', type: 'grant_deadline' },
  { month: 3, day: 17, label: "St Patrick's Day", tip: 'Irish-made pride, support local craftsmanship', type: 'cultural' },
  { month: 4, day: 1, label: 'Ideal Home Show Dublin', tip: 'Attendance content, if exhibiting', type: 'trade_show' },
  { month: 4, day: 15, label: 'Easter / Bank Holiday', tip: 'Showroom visit CTA, family kitchen content', type: 'cultural' },
  { month: 5, day: 1, label: 'May Bank Holiday', tip: 'Showroom open day opportunity', type: 'cultural' },
  { month: 5, day: 10, label: 'National Self-Build & Renovation Show', tip: 'Industry content, networking', type: 'trade_show' },
  { month: 5, day: 20, label: 'Summer Project Planning', tip: 'Book now for autumn installation — lead times', type: 'seasonal' },
  { month: 6, day: 1, label: 'June Bank Holiday', tip: 'Showroom visit push', type: 'cultural' },
  { month: 6, day: 15, label: "Father's Day", tip: 'Kitchen as a family space, cooking together', type: 'cultural' },
  { month: 6, day: 21, label: 'Longest Day', tip: 'Light and bright kitchen content', type: 'seasonal' },
  { month: 7, day: 1, label: 'Summer Inspiration Season', tip: 'Quieter buying, strong for inspiration', type: 'seasonal' },
  { month: 8, day: 1, label: 'August Bank Holiday', tip: 'Autumn project planning push', type: 'cultural' },
  { month: 8, day: 20, label: 'Back to School', tip: 'Family kitchen organisation', type: 'seasonal' },
  { month: 9, day: 1, label: 'Post-Summer Renovation Surge', tip: 'Still time for Christmas messaging', type: 'seasonal' },
  { month: 9, day: 15, label: 'Housing Market Autumn Activity', tip: 'Moving house? Design your dream kitchen', type: 'seasonal' },
  { month: 10, day: 1, label: 'KBIS / Kitchen Industry Events', tip: 'International trend content', type: 'trade_show' },
  { month: 10, day: 28, label: 'October Bank Holiday', tip: 'Last bank holiday before Christmas', type: 'cultural' },
  { month: 11, day: 1, label: 'Houzz Awards Season', tip: 'Awards content, if applicable', type: 'industry' },
  { month: 11, day: 24, label: 'Black Friday', tip: 'Do NOT discount bespoke. Free consultation instead.', type: 'cultural' },
  { month: 12, day: 1, label: 'Christmas Entertaining Season', tip: 'This could be your kitchen next Christmas', type: 'seasonal' },
  { month: 12, day: 15, label: 'Year in Review', tip: 'Best projects, client stories, team highlights', type: 'seasonal' },
];

// ═══ STORAGE (SSR-safe localStorage) ═══
function ld(k, fb) { try { if (typeof window === 'undefined') return fb; const v = localStorage.getItem('jk:' + k); return v ? JSON.parse(v) : fb; } catch { return fb; } }
function sv(k, v) { try { if (typeof window !== 'undefined') localStorage.setItem('jk:' + k, JSON.stringify(v)); } catch {} }

// ═══ API ═══
async function callAI(system, prompt) {
  const r = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system, prompt }) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json(); if (d.error) throw new Error(d.error);
  return d.text;
}
async function callJSON(sys, usr) {
  const raw = await callAI(sys, usr);
  const m = raw.match(/\[[\s\S]*\]/) || raw.match(/\{[\s\S]*\}/);
  if (m) return JSON.parse(m[0]);
  throw new Error('No JSON');
}

// ═══ TINY COMPONENTS ═══
function Sp({ light, sz = 16 }) { return <div className="jk-sp" style={{ width: sz, height: sz, ...(light ? { borderColor: 'rgba(255,255,255,0.25)', borderTopColor: '#fff' } : {}) }} />; }
function Skel({ h = 60 }) { return <div style={{ height: h, background: `linear-gradient(90deg,${B.cream} 25%,${B.sand}30 50%,${B.cream} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 2, marginBottom: 8 }} />; }
function SkelList({ n = 3 }) { return <>{Array.from({ length: n }).map((_, i) => <Skel key={i} h={60 + Math.random() * 20} />)}</>; }
function Badge({ platform }) { const c = { facebook: '#1877F2', instagram: '#E4405F', pinterest: '#E60023', linkedin: '#0A66C2', gbp: '#4285F4' }; const fg = c[platform] || B.brown; const p = ALL_PLATFORMS.find(x => x.id === platform); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, background: `${fg}12`, color: fg, border: `1px solid ${fg}22`, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '0.8px' }}>{p?.icon} {p?.label || platform}</span>; }
function Card({ children, style }) { return <div style={{ background: B.white, borderRadius: 2, border: `1px solid ${B.sand}50`, padding: 18, ...style }}>{children}</div>; }
function Sec({ title, sub, children, action }) { return <div style={{ marginBottom: 28 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}><div><h2 style={{ margin: 0, fontSize: 19, fontWeight: 400, color: B.dark, fontFamily: "'Cormorant',Georgia,serif" }}>{title}</h2>{sub && <p style={{ margin: '2px 0 0', fontSize: 12, color: B.sage, fontWeight: 300 }}>{sub}</p>}</div>{action}</div>{children}</div>; }
function ScoreBar({ label, score }) { return <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}><span style={{ fontSize: 10, color: B.brown, width: 75, flexShrink: 0 }}>{label}</span><div style={{ flex: 1, height: 5, background: `${B.sand}30`, borderRadius: 3 }}><div style={{ height: '100%', width: `${(score / 5) * 100}%`, background: score >= 4 ? '#16a34a' : score >= 3 ? B.sage : B.burgundy, borderRadius: 3 }} /></div><span style={{ fontSize: 10, fontWeight: 600, width: 14, textAlign: 'right' }}>{score}</span></div>; }
function Conf({ level }) { const c = { high: '#16a34a', medium: '#d97706', low: B.burgundy }[level] || B.sage; return <span style={{ fontSize: 8, fontWeight: 700, color: c, background: `${c}15`, padding: '1px 5px', borderRadius: 2, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase' }}>{level}</span>; }

// ═══ CREATE POST MODAL ═══
function CreateModal({ onClose, onSave, platforms, pillars, initialIdea, brand }) {
  const [idea, setIdea] = useState(initialIdea || '');
  const [audience, setAudience] = useState('General');
  const [pillar, setPillar] = useState(pillars[0] || '');
  const [posts, setPosts] = useState(null);
  const [gen, setGen] = useState(false);
  const [copied, setCopied] = useState({});
  const [imgBrief, setImgBrief] = useState(null);
  const [genImg, setGenImg] = useState(false);
  const [imgCopied, setImgCopied] = useState('');

  const platList = platforms.filter(p => p !== 'blog');
  const platInstr = { facebook: 'Facebook: storytelling, CTA.', instagram: 'Instagram: hook line 1, visual-first, emojis.', pinterest: "Pinterest: SEO-rich pin, keywords like 'bespoke kitchen Ireland'.", linkedin: 'LinkedIn: B2B thought leadership.', gbp: 'GBP: short local SEO, mention Tipperary.' };
  const brandSuffix = brand?.website ? `\nAlways include CTA: "${brand.cta || 'Book a free consultation'}". Website: ${brand.website}` : '';

  const generate = async () => {
    if (!idea.trim()) return; setGen(true);
    const schema = platList.map(p => `"${p}":{"content":"...","hashtags":"..."}`).join(',');
    try { setPosts(await callJSON(`Social media creator for Johnstown Kitchens. ${BIZ}${brandSuffix} Return ONLY JSON: {${schema},"suggestedImageSearches":["q1","q2","q3"]}`, `Post idea: "${idea}"\nPillar: ${pillar}, Audience: ${audience}\nPlatforms: ${platList.join(', ')}\n${platList.map(p => platInstr[p] || '').join('\n')}\nBob's warm voice.`)); }
    catch { setPosts({ error: true }); }
    setGen(false);
  };

  const generateImageBrief = async () => {
    setGenImg(true);
    try {
      const txt = platList.find(p => posts?.[p]) ? posts[platList.find(p => posts?.[p])].content : idea;
      const r = await fetch('/api/generate-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: txt }) });
      if (r.ok) setImgBrief(await r.json());
    } catch {} setGenImg(false);
  };

  const copy = (k, t) => { navigator.clipboard.writeText(t); setCopied(c => ({ ...c, [k]: true })); setTimeout(() => setCopied(c => ({ ...c, [k]: false })), 2000); };
  const copyImg = (t, k) => { navigator.clipboard.writeText(t); setImgCopied(k); setTimeout(() => setImgCopied(''), 2000); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: B.white, borderRadius: 3, width: '100%', maxWidth: 820, maxHeight: '92vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 17, fontFamily: "'Cormorant',Georgia,serif" }}>Create a Post</h3><p style={{ margin: '2px 0 0', fontSize: 11, color: B.sage }}>{platList.length} platforms</p></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: B.sage }}>×</button>
        </div>

        {!posts ? (<>
          <label className="jk-lbl">Your idea</label>
          <textarea className="jk-input" rows={3} placeholder="e.g., Just finished a stunning oak kitchen in Waterford..." value={idea} onChange={e => setIdea(e.target.value)} style={{ resize: 'vertical', marginBottom: 12, lineHeight: 1.6 }} />
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}><label className="jk-lbl">Pillar</label><select className="jk-input" value={pillar} onChange={e => setPillar(e.target.value)}>{pillars.map(p => <option key={p}>{p}</option>)}</select></div>
            <div style={{ flex: '1 1 180px' }}><label className="jk-lbl">Audience</label><select className="jk-input" value={audience} onChange={e => setAudience(e.target.value)}>{AUDIENCES.map(a => <option key={a}>{a}</option>)}</select></div>
          </div>
          <button className="jk-btn" onClick={generate} disabled={gen || !idea.trim()} style={{ background: B.burgundy, color: B.white, width: '100%', justifyContent: 'center', padding: 13, opacity: gen || !idea.trim() ? 0.6 : 1 }}>{gen ? <><Sp light sz={12} /> Generating...</> : '✦ Generate'}</button>
        </>) : posts.error ? (
          <div style={{ textAlign: 'center', padding: 30 }}><p style={{ color: B.burgundy }}>Failed — check Vercel logs.</p><button className="jk-btn" onClick={() => setPosts(null)} style={{ background: B.dark, color: B.cream }}>Retry</button></div>
        ) : (<>
          {posts.suggestedImageSearches && <div style={{ marginBottom: 12, padding: '8px 12px', background: B.cream, borderRadius: 2, fontSize: 11, color: B.brown }}><strong>Image ideas:</strong> {posts.suggestedImageSearches.map((q, i) => <span key={i} style={{ margin: '0 4px', padding: '2px 6px', background: B.white, borderRadius: 2, border: `1px solid ${B.sand}50` }}>{q}</span>)}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
            {platList.filter(p => posts[p]).map(p => (
              <div key={p} style={{ border: `1px solid ${B.sand}50`, borderRadius: 2, padding: 14 }}>
                <Badge platform={p} />
                <p style={{ margin: '8px 0 6px', fontSize: 12, color: B.dark, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{posts[p].content}</p>
                {posts[p].hashtags && <p style={{ margin: '0 0 6px', fontSize: 11, color: B.burgundy }}>{posts[p].hashtags}</p>}
                <button className="jk-btn-sm" onClick={() => copy(p, posts[p].content + (posts[p].hashtags ? '\n\n' + posts[p].hashtags : ''))}>{copied[p] ? '✓' : 'Copy'}</button>
              </div>
            ))}
          </div>

          {/* AI Image Brief */}
          <div style={{ marginTop: 14, padding: 14, background: B.warmWhite, borderRadius: 2, border: `1px solid ${B.sand}50` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: imgBrief ? 10 : 0 }}>
              <div><h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: "'Montserrat',sans-serif" }}>🎨 AI Image Brief</h4><p style={{ margin: '2px 0 0', fontSize: 11, color: B.sage }}>Generate prompts for Canva AI, Ideogram, Leonardo, etc.</p></div>
              <button className="jk-btn" onClick={generateImageBrief} disabled={genImg} style={{ background: B.dark, color: B.cream, fontSize: 11, padding: '7px 14px' }}>{genImg ? '...' : imgBrief ? 'Regenerate' : '🎨 Generate'}</button>
            </div>
            {imgBrief && (<>
              {imgBrief.imagePrompt && <div style={{ marginBottom: 8, padding: '10px 12px', background: B.white, borderRadius: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><label className="jk-lbl" style={{ marginBottom: 0 }}>Full Prompt</label><button className="jk-btn-sm" onClick={() => copyImg(imgBrief.imagePrompt, 'full')}>{imgCopied === 'full' ? '✓' : 'Copy'}</button></div>
                <p style={{ margin: 0, fontSize: 12, color: B.dark, lineHeight: 1.6 }}>{imgBrief.imagePrompt}</p>
              </div>}
              {imgBrief.canvaPrompt && <div style={{ marginBottom: 8, padding: '10px 12px', background: B.white, borderRadius: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><label className="jk-lbl" style={{ marginBottom: 0 }}>Canva AI Prompt</label><button className="jk-btn-sm" onClick={() => copyImg(imgBrief.canvaPrompt, 'canva')}>{imgCopied === 'canva' ? '✓' : 'Copy'}</button></div>
                <p style={{ margin: 0, fontSize: 12, color: B.dark }}>{imgBrief.canvaPrompt}</p>
              </div>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <a href="https://www.canva.com/ai-image-generator/" target="_blank" rel="noopener" className="jk-btn-sm" style={{ textDecoration: 'none' }}>Canva AI →</a>
                <a href="https://ideogram.ai" target="_blank" rel="noopener" className="jk-btn-sm" style={{ textDecoration: 'none' }}>Ideogram →</a>
                <a href="https://leonardo.ai" target="_blank" rel="noopener" className="jk-btn-sm" style={{ textDecoration: 'none' }}>Leonardo →</a>
              </div>
            </>)}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="jk-btn" onClick={() => { onSave(platList.filter(p => posts[p]).map(p => ({ platform: p, content: posts[p].content, hashtags: posts[p].hashtags || '', pillar, audience, state: 'Draft', created_at: new Date().toISOString() }))); }} style={{ flex: 1, justifyContent: 'center', background: B.burgundy, color: B.white }}>💾 Save All</button>
            <button className="jk-btn" onClick={() => { setPosts(null); setIdea(''); setImgBrief(null); }} style={{ background: B.white, color: B.brown, border: `1px solid ${B.sand}` }}>New</button>
          </div>
        </>)}
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
  const [loading, setLoading] = useState({});
  const [topics, setTopics] = useState('');
  const [activePlatforms, setActivePlatforms] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [showCreate, setShowCreate] = useState(false);
  const [createIdea, setCreateIdea] = useState('');
  const [newC, setNewC] = useState('');
  const [newCCat, setNewCCat] = useState('direct');
  const [newPillar, setNewPillar] = useState('');
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [dynamicEvents, setDynamicEvents] = useState([]);
  const [eventsScanDate, setEventsScanDate] = useState(null);

  const sl = (k, v) => setLoading(p => ({ ...p, [k]: v }));

  // ── Load ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user));
    setComps(ld('comps', DEFAULT_COMPS));
    setCompResults(ld('compResults', null));
    setDigest(ld('digest', null));
    setTrends(ld('trends', null));
    setSchedule(ld('schedule', null));
    setBlog(ld('blog', null));
    setSavedPosts(ld('savedPosts', []));
    setActivePlatforms(ld('platforms', ALL_PLATFORMS.filter(p => p.on).map(p => p.id)));
    setPillars(ld('pillars', DEFAULT_PILLARS));
    setBrand(ld('brand', DEFAULT_BRAND));
    setDynamicEvents(ld('dynEvents', []));
    setEventsScanDate(ld('eventsScanDate', null));
    setReady(true);
  }, []);

  // ── Auto-save ──
  useEffect(() => { if (ready) sv('comps', comps); }, [comps, ready]);
  useEffect(() => { if (ready) sv('platforms', activePlatforms); }, [activePlatforms, ready]);
  useEffect(() => { if (ready) sv('pillars', pillars); }, [pillars, ready]);
  useEffect(() => { if (ready) sv('savedPosts', savedPosts); }, [savedPosts, ready]);
  useEffect(() => { if (ready) sv('brand', brand); }, [brand, ready]);

  // ── Derived ──
  const now = new Date();
  const allEvents = [...SEASONAL.map(e => ({ ...e, source: 'preloaded' })), ...dynamicEvents.map(e => ({ ...e, source: 'discovered' }))];
  const upcoming = allEvents.filter(e => {
    if (e.date) { const d = new Date(e.date); return (d - now) / 864e5 <= 90 && (d - now) / 864e5 >= -1; }
    const d = new Date(now.getFullYear(), e.month - 1, e.day); if (d < now) d.setFullYear(d.getFullYear() + 1);
    return (d - now) / 864e5 <= 90 && (d - now) / 864e5 >= 0;
  }).sort((a, b) => {
    const gd = e => { if (e.date) return new Date(e.date); const d = new Date(now.getFullYear(), e.month - 1, e.day); if (d < now) d.setFullYear(d.getFullYear() + 1); return d; };
    return gd(a) - gd(b);
  }).slice(0, 10);
  const eventsScanStale = eventsScanDate ? (now - new Date(eventsScanDate)) / 864e5 > 30 : true;
  const drafts = savedPosts.filter(p => p.state === 'Draft').length;

  const getDaysUntil = (e) => {
    const ed = e.date ? new Date(e.date) : new Date(now.getFullYear(), e.month - 1, e.day);
    if (!e.date && ed < now) ed.setFullYear(ed.getFullYear() + 1);
    return Math.max(0, Math.ceil((ed - now) / 864e5));
  };

  // ═══ SCAN FUNCTIONS ═══
  const scanTrends = async () => {
    sl('trends', true);
    try { const r = await callJSON(`Content strategist for Irish bespoke kitchen business. Gather from 3 layers: 1) Design trends, 2) Irish housing/renovation context, 3) Social media content trends. Return ONLY JSON array.`, `Search: kitchen design trends 2026, colour trends, worktop trends, sustainable kitchen, Ireland renovation trends, BER grants, housing market, Instagram Reels trends, Pinterest kitchen trends. Return 8 trends: [{"topic":"...","summary":"...","layer":"design|market|content","relevance":"high|medium","maturity":"emerging|growing|peak|declining","contentAngle":"How Bob could post","exampleHook":"Opening line","suggestedPlatforms":[]}]`); setTrends(r); sv('trends', r); }
    catch { setTrends([{ topic: 'Scan failed', summary: 'Try again.', relevance: 'medium', layer: 'design' }]); }
    sl('trends', false);
  };

  const scanEvents = async () => {
    sl('events', true);
    try {
      const r = await callJSON(`Events researcher for an Irish kitchen business. Return ONLY JSON array.`, `Search for upcoming events in Ireland/UK relevant to bespoke kitchens: trade shows, home renovation expos, architecture awards (RIAI, Houzz, KBIS), grant deadlines, design weeks. Search: "kitchen events Ireland 2026", "home show Ireland 2026", "RIAI awards 2026", "Milan Design Week 2026". Return 5-10: [{"label":"...","date":"YYYY-MM-DD","tip":"Content angle","type":"trade_show|award|industry|grant_deadline","relevance":"high|medium"}]`);
      setDynamicEvents(r); sv('dynEvents', r);
      const d = new Date().toISOString(); setEventsScanDate(d); sv('eventsScanDate', d);
    } catch { console.error('Event scan failed'); }
    sl('events', false);
  };

  const scanComps = async () => {
    sl('comps', true);
    try {
      const names = comps.map(c => c.name).join(', ');
      const r = await callJSON(`Social media analyst for Irish kitchen businesses. CONSTRAINTS: public web only. All engagement = ESTIMATES. If not found, say so. Confidence: HIGH/MEDIUM/LOW. Return ONLY JSON array.`, `Search social media from: ${names} on Facebook, Instagram, Pinterest, LinkedIn.\nPer competitor: {"competitor":"...","platforms":{"instagram":{"profileFound":true/false,"followerEstimate":"number or unknown","followerConfidence":"high|medium|low","postFrequency":"daily|3-4x week|sporadic|inactive","overallScore":1-5,"scoreBreakdown":{"frequency":1-5,"contentQuality":1-5,"engagement":1-5,"brandConsistency":1-5},"topPosts":[{"content":"...","type":"...","estimatedEngagement":"high|medium|low","engagementConfidence":"high|medium|low","whyItWorks":"..."}],"strengths":["..."],"gaps":["..."]}},"scannedAt":"${new Date().toISOString()}"}`);
      setCompResults(r); sv('compResults', r);
      const dg = await callJSON(`Content strategist for Johnstown Kitchens. Be specific, no waffle.`, `COMPETITORS: ${JSON.stringify(r)}\nTRENDS: ${JSON.stringify(trends || [])}\nEVENTS: ${JSON.stringify(upcoming)}\n\nReturn: {"competitorMoves":[{"move":"...","competitor":"...","implication":"..."}],"contentGaps":[{"gap":"...","opportunity":"..."}],"recommendedActions":[{"action":"...","why":"...","priority":"high|medium"}]}`);
      setDigest(dg); sv('digest', dg);
    } catch (e) { console.error(e); }
    sl('comps', false);
  };

  const genSchedule = async () => {
    sl('schedule', true);
    try {
      const pl = activePlatforms.filter(p => p !== 'blog');
      const r = await callJSON(`Strategist for Johnstown Kitchens. ${BIZ} Return ONLY JSON array.`, `Weekly schedule. Platforms: ${pl.join(', ')}. ${trends ? 'Trends: ' + JSON.stringify(trends.slice(0, 4)) : ''} ${topics ? 'Topics: ' + topics : ''} ${upcoming.length ? 'Events: ' + upcoming.map(e => e.label).join(', ') : ''}\nPillars: ${pillars.join(', ')}.\nFacebook=storytelling+CTA. Instagram=visual+hook. Pinterest=SEO keywords. LinkedIn=B2B. GBP=local SEO.\nEach: {"day":"Monday|...|Sunday","time":"10:00 AM","platform":"${pl.join('|')}","title":"...","content":"Full post","hashtags":"...","pillar":"...","rationale":"..."}`);
      setSchedule(r); sv('schedule', r);
    } catch { setSchedule([{ day: 'Error', platform: 'facebook', content: 'Try again.' }]); }
    sl('schedule', false);
  };

  const genBlog = async () => {
    sl('blog', true);
    try { const r = await callJSON(`Strategist for Johnstown Kitchens. ${BIZ} Return ONLY JSON.`, `Monthly blog for johnstownkitchens.ie. ${trends ? 'Trends: ' + JSON.stringify(trends.slice(0, 4)) : ''}. SEO for Irish kitchen searches. Return: {"title":"...","outline":[...],"introduction":"...","seoKeywords":[...],"metaDescription":"...","rationale":"..."}`); setBlog(r); sv('blog', r); }
    catch { setBlog({ title: 'Error', outline: [], introduction: 'Try again.' }); }
    sl('blog', false);
  };

  const fullScan = async () => { await scanTrends(); await scanComps(); await genSchedule(); };
  const scanning = loading.trends || loading.comps || loading.schedule;
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/login'; };
  const addSaved = (posts) => { const n = [...posts, ...savedPosts]; setSavedPosts(n); };
  const addComp = () => { if (newC.trim()) { setComps([...comps, { name: newC.trim(), category: newCCat }]); setNewC(''); } };
  const exportCSV = () => {
    if (!schedule) return;
    const rows = ['Day,Time,Platform,Title,Content,Hashtags,Pillar'];
    schedule.forEach(p => rows.push([p.day, p.time, p.platform, `"${(p.title || '').replace(/"/g, '""')}"`, `"${(p.content || '').replace(/"/g, '""')}"`, `"${(p.hashtags || '').replace(/"/g, '""')}"`, p.pillar || ''].join(',')));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = `jk-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const tabs = [{ id: 'dashboard', label: 'Dashboard' }, { id: 'competitors', label: 'Competitors' }, { id: 'schedule', label: 'Calendar' }, { id: 'library', label: 'Saved' }, { id: 'blog', label: 'Blog' }, { id: 'settings', label: 'Settings' }];

  if (!ready) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: B.warmWhite }}><Sp sz={24} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: B.warmWhite, fontFamily: "'Josefin Sans',sans-serif" }}>
      <style>{`
        @keyframes jks{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .jk-sp{border:2px solid ${B.sand};border-top-color:${B.burgundy};border-radius:50%;animation:jks .7s linear infinite}
        .jk-tab{padding:11px 14px;border:none;background:transparent;color:${B.sage};font-size:10px;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid transparent;white-space:nowrap}
        .jk-tab:hover{color:${B.dark};border-bottom-color:${B.sand}}
        .jk-tab.active{color:${B.burgundy};border-bottom-color:${B.burgundy};font-weight:700}
        .jk-btn{padding:9px 16px;border:none;border-radius:2px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;display:inline-flex;align-items:center;gap:6px;letter-spacing:.4px}
        .jk-btn:disabled{opacity:.5;cursor:default}
        .jk-btn-sm{padding:4px 9px;border:1px solid ${B.sand}60;border-radius:2px;font-size:10px;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;background:${B.cream};color:${B.brown}}
        .jk-btn-sm:hover{border-color:${B.burgundy};color:${B.burgundy}}
        .jk-input{padding:9px 12px;border:1px solid ${B.sand};border-radius:2px;font-size:12px;font-family:'Josefin Sans',sans-serif;outline:none;width:100%;background:${B.white}}
        .jk-input:focus{border-color:${B.burgundy}}
        textarea.jk-input{line-height:1.6}
        .jk-lbl{display:block;font-size:9px;font-weight:700;color:${B.brown};font-family:'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
        .jk-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:${B.cream};color:${B.dark};font-size:11px;border:1px solid ${B.sand}60;border-radius:2px}
        .jk-chip button{background:none;border:none;color:${B.burgundy};cursor:pointer;font-size:13px;padding:0}
        .filter-btn{padding:5px 11px;border:1px solid ${B.sand}60;border-radius:2px;font-size:9px;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:.6px;background:${B.cream};color:${B.brown}}
        .filter-btn.on{background:${B.burgundy};color:${B.white};border-color:${B.burgundy}}
      `}</style>

      {/* HEADER */}
      <div style={{ background: B.dark, padding: '13px 24px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontFamily: "'Montserrat',sans-serif", fontWeight: 600, color: B.cream, letterSpacing: '3px', textTransform: 'uppercase' }}><span style={{ color: B.sand }}>Johnstown</span> Kitchens</h1>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {user && <span style={{ fontSize: 11, color: B.sand }}>{user.email}</span>}
            <button className="jk-btn" onClick={() => { setCreateIdea(''); setShowCreate(true); }} style={{ background: B.white, color: B.dark }}>✦ Create</button>
            <button className="jk-btn" onClick={fullScan} disabled={scanning} style={{ background: B.burgundy, color: B.cream }}>{scanning ? <><Sp light sz={12} /> Scanning</> : 'Full Scan'}</button>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: B.sage, cursor: 'pointer', fontSize: 11, fontFamily: "'Montserrat',sans-serif" }}>Logout</button>
          </div>
        </div>
      </div>

      <div style={{ background: B.cream, borderBottom: `1px solid ${B.sand}60`, padding: '0 24px', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex' }}>{tabs.map(t => <button key={t.id} className={`jk-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '22px 24px 50px' }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === 'dashboard' && <>
          {/* Events */}
          <Sec title="Upcoming Events" sub={eventsScanDate ? `Scanned ${Math.floor((now - new Date(eventsScanDate)) / 864e5)}d ago${eventsScanStale ? ' — rescan recommended' : ''}` : 'Preloaded — scan to discover more'} action={<button className="jk-btn" onClick={scanEvents} disabled={loading.events} style={{ background: eventsScanStale ? B.burgundy : B.white, color: eventsScanStale ? B.white : B.dark, border: eventsScanStale ? 'none' : `1px solid ${B.sand}` }}>{loading.events ? '...' : eventsScanStale ? 'Scan Events' : 'Refresh'}</button>}>
            {loading.events ? <SkelList n={4} /> : upcoming.map((e, i) => (
              <Card key={i} style={{ marginBottom: 6, padding: 12, borderLeft: `3px solid ${e.type === 'grant_deadline' ? B.burgundy : e.type === 'trade_show' ? B.sage : B.sand}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: B.dark, fontFamily: "'Montserrat',sans-serif" }}>{e.label}</p>
                      {e.source === 'discovered' && <span style={{ fontSize: 8, fontWeight: 700, color: B.white, background: B.sage, padding: '1px 5px', borderRadius: 2, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase' }}>Discovered</span>}
                      <span style={{ fontSize: 8, fontWeight: 600, color: B.brown, background: `${B.brown}10`, padding: '1px 5px', borderRadius: 2, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase' }}>{(e.type || '').replace('_', ' ')}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: B.sage }}>{e.tip}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 20, fontWeight: 300, color: B.dark, fontFamily: "'Cormorant',Georgia,serif" }}>{getDaysUntil(e)}</span>
                      <p style={{ margin: 0, fontSize: 9, color: B.sage, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase' }}>days</p>
                    </div>
                    <button className="jk-btn-sm" onClick={() => { setCreateIdea(`${e.label}: ${e.tip}`); setShowCreate(true); }}>✦ Post</button>
                  </div>
                </div>
              </Card>
            ))}
          </Sec>

          {/* Digest */}
          {digest && <Sec title="Weekly Digest"><Card style={{ borderLeft: `3px solid ${B.burgundy}` }}>
            {digest.competitorMoves?.map((m, i) => <p key={i} style={{ margin: '0 0 4px', fontSize: 12, color: B.brown, paddingLeft: 10, borderLeft: `2px solid ${B.sand}` }}><strong>{m.competitor}:</strong> {m.move}</p>)}
            {digest.contentGaps?.map((g, i) => <p key={i} style={{ margin: '4px 0', fontSize: 12, color: B.sage }}>Gap: <strong>{g.gap}</strong> → {g.opportunity}</p>)}
            {digest.recommendedActions?.map((a, i) => <div key={i} style={{ margin: '6px 0', padding: '6px 10px', background: B.warmWhite, borderRadius: 2, fontSize: 12 }}><strong>{a.action}</strong> <span style={{ color: B.sage }}>— {a.why}</span></div>)}
          </Card></Sec>}

          {/* Trends */}
          <Sec title="Trends" action={<button className="jk-btn" style={{ background: B.white, color: B.dark, border: `1px solid ${B.sand}` }} onClick={scanTrends} disabled={loading.trends}>{loading.trends ? '...' : 'Refresh'}</button>}>
            {loading.trends ? <SkelList /> : trends ? trends.map((t, i) => (
              <Card key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 2, background: B.burgundy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: B.cream, fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: "'Montserrat',sans-serif" }}>{i + 1}</div>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: B.dark, fontFamily: "'Montserrat',sans-serif" }}>{t.topic}</h4>
                      <p style={{ margin: '0 0 3px', fontSize: 12, color: B.brown, lineHeight: 1.5 }}>{t.summary}</p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {t.relevance && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 2, background: t.relevance === 'high' ? `${B.burgundy}12` : `${B.sage}15`, color: t.relevance === 'high' ? B.burgundy : B.sage, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase' }}>{t.relevance}</span>}
                        {t.layer && <span style={{ fontSize: 9, color: B.sage, background: `${B.sage}10`, padding: '1px 6px', borderRadius: 2, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase' }}>{t.layer}</span>}
                      </div>
                      {t.contentAngle && <p style={{ margin: '3px 0 0', fontSize: 11, color: B.sage, fontStyle: 'italic' }}>💡 {t.contentAngle}</p>}
                      {t.exampleHook && <p style={{ margin: '2px 0 0', fontSize: 11, color: B.burgundy }}>Hook: "{t.exampleHook}"</p>}
                    </div>
                  </div>
                  <button className="jk-btn-sm" onClick={() => { setCreateIdea(`${t.topic}: ${t.contentAngle || t.summary}`); setShowCreate(true); }} style={{ alignSelf: 'flex-start', flexShrink: 0 }}>✦ Post</button>
                </div>
              </Card>
            )) : <Card><p style={{ margin: 0, color: B.sage, textAlign: 'center', padding: 20 }}>Hit Full Scan</p></Card>}
          </Sec>
        </>}

        {/* ═══ COMPETITORS ═══ */}
        {tab === 'competitors' && <>
          {/* Add competitor */}
          <Card style={{ marginBottom: 16, background: B.cream }}>
            <label className="jk-lbl">Add a competitor to track</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="jk-input" style={{ flex: '1 1 200px' }} placeholder="Company name..." value={newC} onChange={e => setNewC(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComp()} />
              <select className="jk-input" style={{ width: 'auto' }} value={newCCat} onChange={e => setNewCCat(e.target.value)}>{Object.entries(COMP_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
              <button className="jk-btn" style={{ background: B.burgundy, color: B.cream }} onClick={addComp}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {comps.map((c, i) => <span key={i} className="jk-chip">{c.name} <span style={{ fontSize: 9, fontWeight: 700, color: (COMP_CATS[c.category] || {}).color, textTransform: 'uppercase' }}>{c.category}</span><button onClick={() => setComps(comps.filter((_, j) => j !== i))}>×</button></span>)}
            </div>
          </Card>

          <Sec title="Competitor Analysis" sub="All engagement data estimated from public signals" action={<button className="jk-btn" style={{ background: B.burgundy, color: B.white }} onClick={scanComps} disabled={loading.comps}>{loading.comps ? 'Scanning...' : 'Scan'}</button>}>
            {loading.comps ? <SkelList n={5} /> : compResults ? compResults.map((comp, ci) => (
              <Card key={ci} style={{ marginBottom: 10 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: B.dark, fontFamily: "'Montserrat',sans-serif" }}>{comp.competitor}</h3>
                {comp.platforms && Object.entries(comp.platforms).map(([plat, d]) => (
                  <div key={plat} style={{ marginBottom: 8, padding: '10px 12px', background: B.warmWhite, borderRadius: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      <Badge platform={plat} />
                      {d.profileFound === false ? <span style={{ fontSize: 11, color: B.burgundy }}>No profile — opportunity</span> : <>
                        {d.followerEstimate && d.followerEstimate !== 'unknown' && <span style={{ fontSize: 11, color: B.sage }}>~{d.followerEstimate} <Conf level={d.followerConfidence} /></span>}
                        <span style={{ fontSize: 11, color: B.brown }}>{d.postFrequency}</span>
                        {d.overallScore && <span style={{ fontSize: 12, fontWeight: 700, background: B.cream, padding: '1px 6px', borderRadius: 2 }}>{d.overallScore}/5</span>}
                      </>}
                    </div>
                    {d.scoreBreakdown && Object.entries(d.scoreBreakdown).map(([k, v]) => <ScoreBar key={k} label={k.replace(/([A-Z])/g, ' $1')} score={v} />)}
                    {d.topPosts?.slice(0, 2).map((p, pi) => (
                      <div key={pi} style={{ padding: '5px 8px', marginTop: 4, background: B.white, borderRadius: 2, borderLeft: `2px solid ${p.estimatedEngagement === 'high' ? B.burgundy : B.sand}` }}>
                        <span style={{ fontSize: 10, color: B.brown, fontWeight: 600 }}>{p.type}</span> <Conf level={p.engagementConfidence} />
                        <p style={{ margin: '2px 0', fontSize: 12, color: B.dark }}>{p.content}</p>
                        {p.whyItWorks && <p style={{ margin: 0, fontSize: 11, color: B.sage, fontStyle: 'italic' }}>💡 {p.whyItWorks}</p>}
                      </div>
                    ))}
                    {d.gaps?.length > 0 && <p style={{ margin: '4px 0 0', fontSize: 11, color: B.burgundy }}>Gaps: {d.gaps.join(' · ')}</p>}
                  </div>
                ))}
              </Card>
            )) : <Card><p style={{ margin: 0, color: B.sage, textAlign: 'center', padding: 24 }}>Add competitors above and run a scan</p></Card>}
          </Sec>
        </>}

        {/* ═══ CALENDAR ═══ */}
        {tab === 'schedule' && <Sec title="Weekly Calendar" action={<div style={{ display: 'flex', gap: 6 }}><button className="jk-btn" style={{ background: B.white, color: B.dark, border: `1px solid ${B.sand}` }} onClick={exportCSV} disabled={!schedule}>CSV</button><button className="jk-btn" style={{ background: B.white, color: B.dark, border: `1px solid ${B.sand}` }} onClick={genSchedule} disabled={loading.schedule}>{loading.schedule ? '...' : 'Regenerate'}</button></div>}>
          <Card style={{ marginBottom: 12, background: B.cream }}>
            <div style={{ display: 'flex', gap: 8 }}><input className="jk-input" placeholder="Topics for this week..." value={topics} onChange={e => setTopics(e.target.value)} /><button className="jk-btn" style={{ background: B.burgundy, color: B.cream, whiteSpace: 'nowrap' }} onClick={genSchedule} disabled={loading.schedule}>Generate</button></div>
          </Card>
          {loading.schedule ? <SkelList n={6} /> : schedule ? DAYS.map(day => {
            const dp = schedule.filter(p => p.day === day); if (!dp.length) return null;
            return <div key={day} style={{ marginBottom: 16 }}><h3 style={{ fontSize: 10, fontWeight: 700, color: B.dark, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: "'Montserrat',sans-serif", borderBottom: `1px solid ${B.sand}50`, paddingBottom: 4 }}>{day}</h3>{dp.map((p, i) => (
              <Card key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}><Badge platform={p.platform} /><span style={{ fontSize: 10, color: B.sage }}>{p.time}</span>{p.pillar && <span style={{ fontSize: 9, color: B.brown, background: `${B.brown}08`, padding: '2px 6px', borderRadius: 2, fontFamily: "'Montserrat',sans-serif", fontWeight: 600 }}>{p.pillar}</span>}</div>
                    <h4 style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: B.dark, fontFamily: "'Montserrat',sans-serif" }}>{p.title}</h4>
                    <p style={{ margin: 0, fontSize: 12, color: B.brown, lineHeight: 1.6 }}>{p.content}</p>
                    {p.hashtags && <p style={{ margin: '3px 0 0', fontSize: 10, color: B.burgundy }}>{p.hashtags}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <button className="jk-btn-sm" onClick={() => navigator.clipboard.writeText(p.content + (p.hashtags ? '\n\n' + p.hashtags : ''))}>Copy</button>
                    <button className="jk-btn-sm" onClick={() => addSaved([{ platform: p.platform, content: p.content, hashtags: p.hashtags, pillar: p.pillar, state: 'Draft', created_at: new Date().toISOString() }])}>Save</button>
                  </div>
                </div>
              </Card>
            ))}</div>;
          }) : <Card><p style={{ margin: 0, color: B.sage, textAlign: 'center', padding: 24 }}>Generate content above</p></Card>}
        </Sec>}

        {/* ═══ SAVED ═══ */}
        {tab === 'library' && <Sec title="Saved Posts" sub={`${savedPosts.length} total`}>
          {savedPosts.length > 0 ? savedPosts.map((p, i) => (
            <Card key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}><Badge platform={p.platform} />{p.pillar && <span style={{ fontSize: 9, color: B.brown, background: `${B.brown}08`, padding: '2px 6px', borderRadius: 2, fontWeight: 600 }}>{p.pillar}</span>}<select value={p.state || 'Draft'} onChange={e => { const n = [...savedPosts]; n[i] = { ...n[i], state: e.target.value }; setSavedPosts(n); }} style={{ fontSize: 10, padding: '2px 6px', border: `1px solid ${B.sand}`, borderRadius: 2, fontFamily: "'Montserrat',sans-serif" }}>{POST_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
                  <p style={{ margin: 0, fontSize: 12, color: B.dark, lineHeight: 1.5 }}>{p.content}</p>
                  {p.hashtags && <p style={{ margin: '2px 0 0', fontSize: 10, color: B.burgundy }}>{p.hashtags}</p>}
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  <button className="jk-btn-sm" onClick={() => navigator.clipboard.writeText(p.content + (p.hashtags ? '\n\n' + p.hashtags : ''))}>Copy</button>
                  <button className="jk-btn-sm" onClick={() => setSavedPosts(savedPosts.filter((_, j) => j !== i))} style={{ color: B.burgundy }}>×</button>
                </div>
              </div>
            </Card>
          )) : <Card><p style={{ margin: 0, color: B.sage, textAlign: 'center', padding: 24 }}>No saved posts yet</p></Card>}
        </Sec>}

        {/* ═══ BLOG ═══ */}
        {tab === 'blog' && <Sec title="Monthly Blog" action={<button className="jk-btn" style={{ background: B.burgundy, color: B.cream }} onClick={genBlog} disabled={loading.blog}>{loading.blog ? '...' : 'Generate'}</button>}>
          {loading.blog ? <SkelList /> : blog ? (
            <Card>
              <h3 style={{ margin: '0 0 3px', fontSize: 20, fontFamily: "'Cormorant',Georgia,serif", color: B.dark }}>{blog.title}</h3>
              {blog.metaDescription && <div style={{ padding: '8px 10px', background: B.cream, borderRadius: 2, marginBottom: 10, fontSize: 11, color: B.brown }}><strong>Meta:</strong> {blog.metaDescription}</div>}
              {blog.seoKeywords?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>{blog.seoKeywords.map((k, i) => <span key={i} className="jk-chip" style={{ fontSize: 10 }}>{k}</span>)}</div>}
              {blog.outline?.map((s, i) => <div key={i} style={{ padding: '5px 12px', borderLeft: `3px solid ${B.burgundy}`, marginBottom: 2, fontSize: 12, color: B.brown, background: i % 2 === 0 ? B.warmWhite : B.white }}>{i + 1}. {s}</div>)}
              {blog.introduction && <p style={{ margin: '10px 0 0', fontSize: 13, color: B.brown, lineHeight: 1.7, padding: 14, background: B.warmWhite, borderRadius: 2 }}>{blog.introduction}</p>}
            </Card>
          ) : <Card><p style={{ margin: 0, color: B.sage, textAlign: 'center', padding: 24 }}>Generate a blog concept</p></Card>}
        </Sec>}

        {/* ═══ SETTINGS ═══ */}
        {tab === 'settings' && <>
          {/* Brand */}
          <Sec title="Brand & Contact Details" sub="Included in generated posts">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                {[['website', 'Website'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address'], ['tagline', 'Tagline'], ['cta', 'Default CTA']].map(([k, l]) => (
                  <div key={k}><label className="jk-lbl">{l}</label><input className="jk-input" value={brand[k] || ''} onChange={e => setBrand({ ...brand, [k]: e.target.value })} /></div>
                ))}
              </div>
            </Card>
          </Sec>

          <Sec title="Social Media Links" sub="Used for cross-linking in posts">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                {[['facebook', '📘 Facebook URL'], ['instagram', '📸 Instagram URL'], ['pinterest', '📌 Pinterest URL'], ['linkedin', '💼 LinkedIn URL']].map(([k, l]) => (
                  <div key={k}><label className="jk-lbl">{l}</label><input className="jk-input" value={brand[k] || ''} onChange={e => setBrand({ ...brand, [k]: e.target.value })} placeholder={`https://...`} /></div>
                ))}
              </div>
            </Card>
          </Sec>

          {/* Platforms */}
          <Sec title="Active Platforms">
            <Card>{ALL_PLATFORMS.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: B.warmWhite, borderRadius: 2, marginBottom: 4 }}>
                <span>{p.icon} {p.label} <span style={{ fontSize: 10, color: B.sage }}>({p.desc})</span></span>
                <button className={`filter-btn ${activePlatforms.includes(p.id) ? 'on' : ''}`} onClick={() => setActivePlatforms(activePlatforms.includes(p.id) ? activePlatforms.filter(x => x !== p.id) : [...activePlatforms, p.id])}>{activePlatforms.includes(p.id) ? 'Active' : 'Off'}</button>
              </div>
            ))}</Card>
          </Sec>

          {/* Pillars */}
          <Sec title="Content Pillars">
            <Card>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>{pillars.map((p, i) => <span key={i} className="jk-chip">{p}<button onClick={() => setPillars(pillars.filter((_, j) => j !== i))}>×</button></span>)}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="jk-input" placeholder="Add pillar..." value={newPillar} onChange={e => setNewPillar(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newPillar.trim()) { setPillars([...pillars, newPillar.trim()]); setNewPillar(''); } }} />
                <button className="jk-btn" style={{ background: B.burgundy, color: B.cream }} onClick={() => { if (newPillar.trim()) { setPillars([...pillars, newPillar.trim()]); setNewPillar(''); } }}>Add</button>
              </div>
            </Card>
          </Sec>

          {/* Competitors */}
          <Sec title="Competitors" sub="Direct, Aspirational, or Regional">
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                {comps.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: B.warmWhite, borderRadius: 2 }}>
                    <span style={{ fontSize: 12 }}>{c.name} <span style={{ fontSize: 9, fontWeight: 700, color: (COMP_CATS[c.category] || {}).color || B.brown, fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase' }}>{c.category}</span></span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select value={c.category} onChange={e => { const n = [...comps]; n[i] = { ...n[i], category: e.target.value }; setComps(n); }} style={{ fontSize: 10, padding: '2px 6px', border: `1px solid ${B.sand}`, borderRadius: 2, background: B.white }}>{Object.entries(COMP_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                      <button onClick={() => setComps(comps.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: B.burgundy, cursor: 'pointer', fontSize: 14 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="jk-input" placeholder="Add competitor..." value={newC} onChange={e => setNewC(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addComp(); }} />
                <select className="jk-input" style={{ width: 'auto' }} value={newCCat} onChange={e => setNewCCat(e.target.value)}>{Object.entries(COMP_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                <button className="jk-btn" style={{ background: B.burgundy, color: B.cream }} onClick={addComp}>Add</button>
              </div>
            </Card>
          </Sec>
        </>}
      </div>

      <div style={{ background: B.dark, padding: '12px 24px', textAlign: 'center' }}><p style={{ margin: 0, fontSize: 10, color: B.sage }}>Johnstown Kitchens · Puckane, Nenagh, Co. Tipperary · bob@johnstownkitchens.ie</p></div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSave={posts => { addSaved(posts); setShowCreate(false); }} platforms={activePlatforms} pillars={pillars} initialIdea={createIdea} brand={brand} />}
    </div>
  );
}
