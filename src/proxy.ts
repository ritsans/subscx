import { type NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/mypage'];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((r) => path === r || path.startsWith(`${r}/`));

  // Better Auth sets better-auth.session_token (dev) or __Secure-better-auth.session_token (prod)
  const hasSession =
    request.cookies.has('better-auth.session_token') || request.cookies.has('__Secure-better-auth.session_token');

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
