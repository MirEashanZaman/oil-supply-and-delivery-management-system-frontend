import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const ipMap = new Map<string, RateLimitBucket>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipMap.entries()) {
      if (now > data.resetTime) {
        ipMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';

    const now = Date.now();
    const windowMs = 60 * 1000;
    const isMessagesPost = request.nextUrl.pathname.startsWith('/api/messages') && request.method === 'POST';
    const limit = isMessagesPost ? 25 : 60;

    const clientData = ipMap.get(ip);

    if (!clientData || now > clientData.resetTime) {
      ipMap.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      clientData.count++;
      if (clientData.count > limit) {
        const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

