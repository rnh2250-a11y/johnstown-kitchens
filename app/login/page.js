'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Login failed'); setLoading(false); return; }
      window.location.href = '/';
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f0eb', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 3, border: '1px solid #BFBAA950', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontFamily: "'Montserrat',sans-serif", fontWeight: 600, color: '#1e1e1e', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}><span style={{ color: '#87866C' }}>Johnstown</span> Kitchens</h1>
          <p style={{ fontSize: 11, color: '#87866C', fontFamily: "'Montserrat',sans-serif", letterSpacing: '2px', textTransform: 'uppercase' }}>Content Intelligence</p>
        </div>
        <form onSubmit={handleLogin}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#756158', fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 5 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '11px 14px', border: '1px solid #BFBAA9', borderRadius: 2, fontSize: 14, fontFamily: "'Josefin Sans',sans-serif", outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#756158', fontFamily: "'Montserrat',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 5 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '11px 14px', border: '1px solid #BFBAA9', borderRadius: 2, fontSize: 14, fontFamily: "'Josefin Sans',sans-serif", outline: 'none', marginBottom: 20, boxSizing: 'border-box' }} />
          {error && <p style={{ color: '#5E3032', fontSize: 13, marginBottom: 14 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 2, background: '#5E3032', color: '#f3f0eb', fontSize: 12, fontWeight: 600, fontFamily: "'Montserrat',sans-serif", letterSpacing: '1px', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}
