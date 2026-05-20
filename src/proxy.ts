import { type NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/mypage'];
const authRoutes = ['/login'];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((r) => path === r || path.startsWith(`${r}/`));
  const isAuthRoute = authRoutes.includes(path);

  // Better Auth sets better-auth.session_token (dev) or __Secure-better-auth.session_token (prod)
  const hasSession =
    request.cookies.has('better-auth.session_token') || request.cookies.has('__Secure-better-auth.session_token');

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
