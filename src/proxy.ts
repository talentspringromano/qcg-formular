import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow login page itself + login API endpoint without auth
  if (path === '/admin/login' || path === '/api/admin/login') {
    return NextResponse.next();
  }

  const token = req.cookies.get('session')?.value;
  if (!token) {
    if (path.startsWith('/api/admin/')) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  const user = await verifyToken(token);
  if (!user || user.role !== 'admin') {
    if (path.startsWith('/api/admin/')) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }
    const res = NextResponse.redirect(new URL('/admin/login', req.url));
    res.cookies.set('session', '', { maxAge: 0, path: '/' });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
