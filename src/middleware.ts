// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const CAREERS_HOSTS = [
  'careers.allstarkidsacademyga.com',
  'careers.localhost',         // local dev: add `careers.localhost` to /etc/hosts → 127.0.0.1
]

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/careers(.*)',              // entire careers portal is public
  '/api/careers/(.*)',         // submit endpoint is public
])

export default clerkMiddleware(async (auth, request) => {
  const hostname = (request.headers.get('host') ?? '').split(':')[0]
  const { pathname } = new URL(request.url)

  // Subdomain rewrite: careers.allstarkidsacademyga.com → /careers/*
  if (CAREERS_HOSTS.some((h) => hostname === h)) {
    if (!pathname.startsWith('/careers')) {
      const rewriteUrl = new URL(`/careers${pathname === '/' ? '' : pathname}`, request.url)
      return NextResponse.rewrite(rewriteUrl)
    }
    return NextResponse.next()
  }

  if (!isPublicRoute(request)) {
    // API routes must never answer with an HTML sign-in/404 page — clients
    // parse these responses as JSON. Return a JSON 401 instead.
    if (pathname.startsWith('/api')) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json(
          { error: 'Your session has expired. Refresh the page and sign in again.' },
          { status: 401 }
        )
      }
    } else {
      await auth.protect()
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
