import { NextResponse, NextRequest } from "next/server";

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/profile'];

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "no-sniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  
  // Add token expiration headers for client-side checking
  const pathname = request.nextUrl.pathname;
  
  // Check if accessing a protected route
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Add header to indicate this is a protected route
    response.headers.set("X-Protected-Route", "true");
    
    // Add current timestamp for client-side token validation
    response.headers.set("X-Server-Time", Date.now().toString());
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
