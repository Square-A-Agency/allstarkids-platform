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
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
