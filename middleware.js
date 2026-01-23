import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Check if accessing dashboard
    if (pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('auth_token');

        // 1. Check if token exists
        if (!token) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
