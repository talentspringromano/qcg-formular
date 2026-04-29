import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { getDb } from '@/lib/db';
import { createToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 });
  }

  const email = (body.email || '').toLowerCase().trim();
  const password = body.password || '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email und Passwort erforderlich' }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`SELECT email, name, password_hash, role FROM users WHERE email = ${email} LIMIT 1`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
  }

  const user = rows[0];
  const valid = await compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
  }

  if ((user.role || 'user') !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  }

  const token = await createToken({
    email: user.email,
    name: user.name,
    role: user.role || 'user',
  });

  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return res;
}
