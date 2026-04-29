import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export type SessionUser = {
  email: string;
  name: string;
  role: string;
};

export async function createToken(payload: SessionUser) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAdmin(req: NextRequest): Promise<SessionUser | NextResponse> {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  return user;
}
