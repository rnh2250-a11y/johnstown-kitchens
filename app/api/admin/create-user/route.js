import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getExtraUsers } from '@/lib/users';

function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*';
  const all = upper + lower + digits + special;
  let pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = 4; i < 12; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  return pwd.join('');
}

export async function POST(request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { email } = await request.json();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const password = generatePassword();

  // Build the updated USERS_JSON value so the admin can paste it into Vercel
  const existing = getExtraUsers().filter(u => u.email.toLowerCase() !== email.toLowerCase());
  const updated = [...existing, { email: email.toLowerCase().trim(), password }];

  return NextResponse.json({ password, usersJson: JSON.stringify(updated) });
}
