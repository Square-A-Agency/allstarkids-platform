# Careers Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public careers portal at `careers.allstarkidsacademyga.com` and a staff applications admin section inside the existing `allstarkids-platform`.

**Architecture:** Next.js middleware detects the `careers.allstarkidsacademyga.com` hostname and rewrites requests to `/careers/*` routes, which serve the public portal without Clerk auth. Staff applications are stored in a new `StaffApplication` Prisma model in the existing Supabase DB. Resumes upload to Supabase Storage. Admin section lives at `/admin/staff-applications` protected by the existing `isAdminUser` Clerk check.

**Tech Stack:** Next.js 15, Clerk, Prisma (PostgreSQL via Supabase), Supabase Storage, shadcn/ui, Vitest

---

## File Map

**Created:**
- `prisma/schema.prisma` — modified: add `StaffApplicationStatus` enum + `StaffApplication` model
- `src/middleware.ts` — modified: subdomain routing + public careers routes
- `src/app/careers/layout.tsx` — simple public layout (no Clerk header)
- `src/app/careers/page.tsx` — job listings
- `src/app/careers/apply/page.tsx` — server page wrapping the form
- `src/app/careers/apply/success/page.tsx` — confirmation screen
- `src/app/api/careers/apply/route.ts` — POST: validate, upload resume, save to DB
- `src/app/admin/staff-applications/page.tsx` — table with status + role filters
- `src/app/admin/staff-applications/[id]/page.tsx` — full detail view
- `src/app/api/admin/staff-applications/[id]/route.ts` — PATCH: update status
- `src/components/careers/ApplicationForm.tsx` — client form component
- `src/components/admin/StaffApplicationActions.tsx` — client status controls
- `src/lib/careers.ts` — pure validation logic (testable)
- `src/lib/__tests__/careers.test.ts` — Vitest tests for validation + status logic

**Modified:**
- `src/app/admin/layout.tsx` — add "Staff Applications" nav link

---

## Task 1: Prisma Schema — Add StaffApplication model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the enum and model to the schema**

Append to the end of `prisma/schema.prisma`:

```prisma
enum StaffApplicationStatus {
  PENDING
  UNDER_REVIEW
  INTERVIEW_SCHEDULED
  HIRED
  REJECTED
}

model StaffApplication {
  id           String                 @id @default(cuid())
  createdAt    DateTime               @default(now())
  updatedAt    DateTime               @updatedAt

  role         String
  firstName    String
  lastName     String
  email        String
  phone        String
  yearsExp     Int
  availability String
  refOneName   String
  refOnePhone  String
  refTwoName   String
  refTwoPhone  String
  coverNote    String
  resumeUrl    String?
  linkedinUrl  String?
  status       StaffApplicationStatus @default(PENDING)

  @@map("staff_applications")
}
```

- [ ] **Step 2: Generate and apply migration**

```bash
npx prisma migrate dev --name add-staff-applications
```

Expected: Migration created and applied. `src/generated/prisma` regenerated with new types.

- [ ] **Step 3: Verify generated types exist**

```bash
grep -r "StaffApplication" src/generated/prisma/index.d.ts | head -5
```

Expected: Lines containing `StaffApplication` and `StaffApplicationStatus`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add StaffApplication model and StaffApplicationStatus enum"
```

---

## Task 2: Validation Logic + Tests (TDD)

**Files:**
- Create: `src/lib/careers.ts`
- Create: `src/lib/__tests__/careers.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/careers.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateStaffApplicationPayload, VALID_STAFF_STATUSES, STAFF_ROLES } from '../careers'

const validPayload = {
  role: 'Teacher (1 Year Olds)',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  phone: '404-555-0100',
  yearsExp: 3,
  availability: 'Mon–Fri, 6am–3pm',
  refOneName: 'Alice Brown',
  refOnePhone: '404-555-0101',
  refTwoName: 'Bob Davis',
  refTwoPhone: '404-555-0102',
  coverNote: 'I love working with children.',
}

describe('validateStaffApplicationPayload', () => {
  it('returns null for a valid payload', () => {
    expect(validateStaffApplicationPayload(validPayload)).toBeNull()
  })

  it('returns error when required field is missing', () => {
    const { firstName, ...rest } = validPayload
    expect(validateStaffApplicationPayload(rest)).toMatch(/firstName/)
  })

  it('returns error for invalid role', () => {
    expect(validateStaffApplicationPayload({ ...validPayload, role: 'Janitor' })).toMatch(/role/)
  })

  it('returns error when yearsExp is negative', () => {
    expect(validateStaffApplicationPayload({ ...validPayload, yearsExp: -1 })).toMatch(/yearsExp/)
  })

  it('returns error for invalid email format', () => {
    expect(validateStaffApplicationPayload({ ...validPayload, email: 'not-an-email' })).toMatch(/email/)
  })
})

describe('VALID_STAFF_STATUSES', () => {
  it('contains all expected statuses', () => {
    expect(VALID_STAFF_STATUSES).toContain('PENDING')
    expect(VALID_STAFF_STATUSES).toContain('UNDER_REVIEW')
    expect(VALID_STAFF_STATUSES).toContain('INTERVIEW_SCHEDULED')
    expect(VALID_STAFF_STATUSES).toContain('HIRED')
    expect(VALID_STAFF_STATUSES).toContain('REJECTED')
  })
})

describe('STAFF_ROLES', () => {
  it('contains all three roles', () => {
    expect(STAFF_ROLES).toContain('Teacher (1 Year Olds)')
    expect(STAFF_ROLES).toContain('Teacher (2 Year Olds)')
    expect(STAFF_ROLES).toContain('Bus Driver')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- src/lib/__tests__/careers.test.ts
```

Expected: FAIL — `careers` module not found.

- [ ] **Step 3: Implement `src/lib/careers.ts`**

```ts
export const STAFF_ROLES = [
  'Teacher (1 Year Olds)',
  'Teacher (2 Year Olds)',
  'Bus Driver',
] as const

export type StaffRole = typeof STAFF_ROLES[number]

export const VALID_STAFF_STATUSES = [
  'PENDING',
  'UNDER_REVIEW',
  'INTERVIEW_SCHEDULED',
  'HIRED',
  'REJECTED',
] as const

const REQUIRED_FIELDS = [
  'role', 'firstName', 'lastName', 'email', 'phone',
  'yearsExp', 'availability', 'refOneName', 'refOnePhone',
  'refTwoName', 'refTwoPhone', 'coverNote',
] as const

export function validateStaffApplicationPayload(payload: Record<string, unknown>): string | null {
  for (const field of REQUIRED_FIELDS) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return `Missing required field: ${field}`
    }
  }

  if (!STAFF_ROLES.includes(payload.role as StaffRole)) {
    return `Invalid role: must be one of ${STAFF_ROLES.join(', ')}`
  }

  if (typeof payload.yearsExp !== 'number' || payload.yearsExp < 0) {
    return 'Invalid yearsExp: must be a non-negative number'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (typeof payload.email !== 'string' || !emailRegex.test(payload.email)) {
    return 'Invalid email format'
  }

  return null
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- src/lib/__tests__/careers.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/careers.ts src/lib/__tests__/careers.test.ts
git commit -m "feat: add careers validation logic with tests"
```

---

## Task 3: Submit API Route

**Files:**
- Create: `src/app/api/careers/apply/route.ts`

- [ ] **Step 1: Create the API route**

```ts
// src/app/api/careers/apply/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { validateStaffApplicationPayload } from '@/lib/careers'

export async function POST(req: Request) {
  const formData = await req.formData()

  const payload = {
    role:         formData.get('role'),
    firstName:    formData.get('firstName'),
    lastName:     formData.get('lastName'),
    email:        formData.get('email'),
    phone:        formData.get('phone'),
    yearsExp:     Number(formData.get('yearsExp')),
    availability: formData.get('availability'),
    refOneName:   formData.get('refOneName'),
    refOnePhone:  formData.get('refOnePhone'),
    refTwoName:   formData.get('refTwoName'),
    refTwoPhone:  formData.get('refTwoPhone'),
    coverNote:    formData.get('coverNote'),
    linkedinUrl:  formData.get('linkedinUrl') || undefined,
  } as Record<string, unknown>

  const error = validateStaffApplicationPayload(payload)
  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  // Handle optional resume upload
  let resumeUrl: string | undefined
  const resumeFile = formData.get('resume') as File | null
  if (resumeFile && resumeFile.size > 0) {
    const ext = resumeFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, resumeFile, { contentType: resumeFile.type })
    if (uploadError) {
      return NextResponse.json({ error: 'Resume upload failed' }, { status: 500 })
    }
    const { data } = supabase.storage.from('resumes').getPublicUrl(fileName)
    resumeUrl = data.publicUrl
  }

  await prisma.staffApplication.create({
    data: {
      role:         payload.role as string,
      firstName:    payload.firstName as string,
      lastName:     payload.lastName as string,
      email:        payload.email as string,
      phone:        payload.phone as string,
      yearsExp:     payload.yearsExp as number,
      availability: payload.availability as string,
      refOneName:   payload.refOneName as string,
      refOnePhone:  payload.refOnePhone as string,
      refTwoName:   payload.refTwoName as string,
      refTwoPhone:  payload.refTwoPhone as string,
      coverNote:    payload.coverNote as string,
      linkedinUrl:  payload.linkedinUrl as string | undefined,
      resumeUrl,
    },
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create the Supabase `resumes` bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `resumes`
- Public: **yes** (so `getPublicUrl` works without signing)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/careers/apply/route.ts
git commit -m "feat: add staff application submit API route"
```

---

## Task 4: Admin Status API Route

**Files:**
- Create: `src/app/api/admin/staff-applications/[id]/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/admin/staff-applications/[id]/route.ts
import { auth } from '@clerk/nextjs/server'
import { isAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { VALID_STAFF_STATUSES } from '@/lib/careers'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()

  if (!status || !(VALID_STAFF_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  await prisma.staffApplication.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/staff-applications/[id]/route.ts
git commit -m "feat: add staff application status update API route"
```

---

## Task 5: Middleware — Subdomain Routing

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Replace middleware content**

```ts
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
  const host = request.headers.get('host') ?? ''
  const { pathname } = new URL(request.url)

  // Subdomain rewrite: careers.allstarkidsacademyga.com → /careers/*
  if (CAREERS_HOSTS.some((h) => host === h)) {
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
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add careers subdomain routing in middleware"
```

---

## Task 6: Careers Layout

**Files:**
- Create: `src/app/careers/layout.tsx`

- [ ] **Step 1: Create the layout**

```tsx
// src/app/careers/layout.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/careers" className="flex items-center gap-3">
            <Image src="/logo.webp" alt="All Star Kids Academy" width={44} height={32} className="object-contain" />
            <div>
              <p className="text-sm font-extrabold text-[#0a1628] leading-tight">All Star Kids Academy</p>
              <p className="text-xs text-slate-400 font-medium">Careers</p>
            </div>
          </Link>
          <Link
            href="/careers/apply"
            className="bg-[#fbbf24] text-[#0a1628] font-black text-sm px-5 py-2 rounded-md hover:brightness-110 transition-[filter]"
          >
            Apply Now →
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-12">
        © {new Date().getFullYear()} All Star Kids Academy · 4518 Covington Hwy, Decatur, GA 30035
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/careers/layout.tsx
git commit -m "feat: add careers portal layout"
```

---

## Task 7: Careers Home Page (Job Listings)

**Files:**
- Create: `src/app/careers/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/careers/page.tsx
import Link from 'next/link'
import { Heart, Users, Bus } from 'lucide-react'

export const metadata = {
  title: 'Careers | All Star Kids Academy',
  description: 'Join the All Star Kids Academy team in Decatur, GA. Open positions for teachers and staff.',
}

const roles = [
  {
    title: 'Teacher (1 Year Olds)',
    icon: Heart,
    accentColor: '#f43f5e',
    description: 'Provide our children with a solid learning foundation to be prepared for their exciting next step to the 2\'s.',
  },
  {
    title: 'Teacher (2 Year Olds)',
    icon: Users,
    accentColor: '#6366f1',
    description: 'Engage our children in productive ways to keep them prepared for their jump to the 3\'s.',
  },
  {
    title: 'Bus Driver',
    icon: Bus,
    accentColor: '#eab308',
    description: 'Guarantee our children run on an efficient time schedule to get to school on time.',
  },
]

export default function CareersPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <div className="mb-12">
        <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">Join Our Team</p>
        <h1 className="text-4xl font-black text-[#0a1628] mb-3">We're Hiring</h1>
        <p className="text-slate-500 max-w-xl">
          Help us give every child the start they deserve. We're looking for passionate, dedicated people in Decatur, GA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {roles.map(({ title, icon: Icon, accentColor, description }) => (
          <div
            key={title}
            className="bg-white rounded-2xl shadow-sm border-t-4 p-8 flex flex-col gap-4"
            style={{ borderColor: accentColor }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${accentColor}18` }}
            >
              <Icon size={24} style={{ color: accentColor }} strokeWidth={2} />
            </div>
            <p className="font-extrabold text-[#0a1628] text-lg leading-snug">{title}</p>
            <p className="text-sm text-slate-600 leading-relaxed flex-1">{description}</p>
            <Link
              href={`/careers/apply?role=${encodeURIComponent(title)}`}
              className="inline-block text-center font-black text-sm px-6 py-3 rounded-md transition-[filter] hover:brightness-110 text-white"
              style={{ background: accentColor }}
            >
              Apply Now
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-[#0a1628] rounded-2xl p-10 text-center text-white">
        <h2 className="text-2xl font-black mb-2">Why work at All Star Kids?</h2>
        <p className="text-blue-200 max-w-lg mx-auto">
          We're more than a daycare — we're a community. Our staff are valued, supported, and part of something that truly matters.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/careers/page.tsx
git commit -m "feat: add careers job listings page"
```

---

## Task 8: Application Form Component

**Files:**
- Create: `src/components/careers/ApplicationForm.tsx`

- [ ] **Step 1: Create the form component**

```tsx
// src/components/careers/ApplicationForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STAFF_ROLES } from '@/lib/careers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function ApplicationForm({ defaultRole }: { defaultRole?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/careers/apply', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      router.push('/careers/apply/success')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Position *</Label>
        <select
          id="role"
          name="role"
          required
          defaultValue={defaultRole ?? ''}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>Select a position</option>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Personal info */}
      <div>
        <h3 className="font-extrabold text-[#0a1628] mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" name="firstName" required placeholder="Jane" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" name="lastName" required placeholder="Smith" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required placeholder="jane@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" name="phone" type="tel" required placeholder="404-555-0100" />
          </div>
        </div>
      </div>

      {/* Experience & Availability */}
      <div>
        <h3 className="font-extrabold text-[#0a1628] mb-4">Experience &amp; Availability</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yearsExp">Years of Experience *</Label>
            <Input id="yearsExp" name="yearsExp" type="number" min="0" required placeholder="3" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="availability">Availability *</Label>
            <Input id="availability" name="availability" required placeholder="Mon–Fri, 6:00 AM – 3:00 PM" />
          </div>
        </div>
      </div>

      {/* References */}
      <div>
        <h3 className="font-extrabold text-[#0a1628] mb-4">References</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="refOneName">Reference 1 — Name *</Label>
              <Input id="refOneName" name="refOneName" required placeholder="Alice Brown" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refOnePhone">Reference 1 — Phone *</Label>
              <Input id="refOnePhone" name="refOnePhone" type="tel" required placeholder="404-555-0101" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="refTwoName">Reference 2 — Name *</Label>
              <Input id="refTwoName" name="refTwoName" required placeholder="Bob Davis" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refTwoPhone">Reference 2 — Phone *</Label>
              <Input id="refTwoPhone" name="refTwoPhone" type="tel" required placeholder="404-555-0102" />
            </div>
          </div>
        </div>
      </div>

      {/* Cover Note */}
      <div className="space-y-2">
        <Label htmlFor="coverNote">Cover Note *</Label>
        <Textarea
          id="coverNote"
          name="coverNote"
          required
          rows={5}
          placeholder="Tell us why you'd be a great fit at All Star Kids Academy..."
        />
      </div>

      {/* Portfolio / Resume */}
      <div>
        <h3 className="font-extrabold text-[#0a1628] mb-4">Portfolio / Resume <span className="text-slate-400 font-normal text-sm">(optional)</span></h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/yourname" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume">Resume Upload (PDF or Word)</Label>
            <Input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx" />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0a1628] text-white font-black py-3 text-base rounded-md hover:brightness-110 transition-[filter]"
      >
        {loading ? 'Submitting…' : 'Submit Application →'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/careers/ApplicationForm.tsx
git commit -m "feat: add careers application form component"
```

---

## Task 9: Apply Page + Success Page

**Files:**
- Create: `src/app/careers/apply/page.tsx`
- Create: `src/app/careers/apply/success/page.tsx`

- [ ] **Step 1: Create the apply page**

```tsx
// src/app/careers/apply/page.tsx
import ApplicationForm from '@/components/careers/ApplicationForm'

export const metadata = {
  title: 'Apply | All Star Kids Academy Careers',
}

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <div className="mb-10">
        <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">Join Our Team</p>
        <h1 className="text-3xl font-black text-[#0a1628]">Submit Your Application</h1>
        <p className="text-slate-500 mt-2 text-sm">Fields marked * are required. This takes about 5 minutes.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <ApplicationForm defaultRole={role} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create the success page**

```tsx
// src/app/careers/apply/success/page.tsx
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Application Submitted | All Star Kids Academy',
}

export default function SuccessPage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <CheckCircle size={56} className="text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-black text-[#0a1628] mb-3">Application Received!</h1>
      <p className="text-slate-500 mb-8 leading-relaxed">
        Thank you for applying to All Star Kids Academy. We'll review your application and be in touch soon.
      </p>
      <Link
        href="/careers"
        className="inline-block bg-[#0a1628] text-white font-black text-sm px-8 py-3 rounded-md hover:brightness-110 transition-[filter]"
      >
        ← Back to Careers
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/careers/apply/page.tsx src/app/careers/apply/success/page.tsx
git commit -m "feat: add careers apply and success pages"
```

---

## Task 10: Admin Staff Applications List Page

**Files:**
- Create: `src/app/admin/staff-applications/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/admin/staff-applications/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { STAFF_ROLES, VALID_STAFF_STATUSES } from '@/lib/careers'

const STATUS_COLORS: Record<string, string> = {
  PENDING:              'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW:         'bg-blue-100 text-blue-800',
  INTERVIEW_SCHEDULED:  'bg-purple-100 text-purple-800',
  HIRED:                'bg-green-100 text-green-800',
  REJECTED:             'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:              'Pending',
  UNDER_REVIEW:         'Under Review',
  INTERVIEW_SCHEDULED:  'Interview Scheduled',
  HIRED:                'Hired',
  REJECTED:             'Rejected',
}

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Interview Scheduled', value: 'INTERVIEW_SCHEDULED' },
  { label: 'Hired', value: 'HIRED' },
  { label: 'Rejected', value: 'REJECTED' },
]

export default async function StaffApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; role?: string }>
}) {
  const { userId } = await auth()
  if (!isAdminUser(userId)) redirect('/')

  const { status: statusFilter, role: roleFilter } = await searchParams

  const where = {
    ...(statusFilter ? { status: statusFilter as any } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
  }

  const [applications, total, pending, interviewScheduled, hired] = await Promise.all([
    prisma.staffApplication.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.staffApplication.count(),
    prisma.staffApplication.count({ where: { status: 'PENDING' } }),
    prisma.staffApplication.count({ where: { status: 'INTERVIEW_SCHEDULED' } }),
    prisma.staffApplication.count({ where: { status: 'HIRED' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Staff Applications</h2>
        <p className="text-gray-500 mt-1">Review and manage job applications.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, color: 'text-gray-900' },
          { label: 'Pending', value: pending, color: 'text-yellow-600' },
          { label: 'Interview Scheduled', value: interviewScheduled, color: 'text-purple-600' },
          { label: 'Hired', value: hired, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg border p-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {STATUS_FILTERS.map((f) => {
          const isActive = (statusFilter ?? '') === f.value
          const href = new URLSearchParams({
            ...(f.value ? { status: f.value } : {}),
            ...(roleFilter ? { role: roleFilter } : {}),
          }).toString()
          return (
            <Link
              key={f.value}
              href={href ? `/admin/staff-applications?${href}` : '/admin/staff-applications'}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-900 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
        <form method="GET" action="/admin/staff-applications" className="ml-auto flex items-center gap-2">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <select
            name="role"
            defaultValue={roleFilter ?? ''}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All Roles</option>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="submit" className="text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Experience</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Applied</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No applications found.</td>
              </tr>
            )}
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{app.firstName} {app.lastName}</td>
                <td className="px-4 py-3 text-gray-600">{app.role}</td>
                <td className="px-4 py-3 text-gray-600">{app.yearsExp} yr{app.yearsExp !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/staff-applications/${app.id}`} className="text-blue-600 hover:text-blue-800 font-medium">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {applications.length === 0 && <p className="text-center text-gray-400 py-8">No applications found.</p>}
        {applications.map((app) => (
          <div key={app.id} className="bg-white rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{app.firstName} {app.lastName}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
                {STATUS_LABELS[app.status] ?? app.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{app.role} · {app.yearsExp} yr{app.yearsExp !== 1 ? 's' : ''} exp</p>
            <p className="text-sm text-gray-500">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
            <Link href={`/admin/staff-applications/${app.id}`} className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium">View Application →</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/staff-applications/page.tsx
git commit -m "feat: add admin staff applications list page"
```

---

## Task 11: Admin Staff Application Detail Page + Actions Component

**Files:**
- Create: `src/app/admin/staff-applications/[id]/page.tsx`
- Create: `src/components/admin/StaffApplicationActions.tsx`

- [ ] **Step 1: Create the status actions client component**

```tsx
// src/components/admin/StaffApplicationActions.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VALID_STAFF_STATUSES } from '@/lib/careers'
import { Button } from '@/components/ui/button'

const STATUS_LABELS: Record<string, string> = {
  PENDING:             'Pending',
  UNDER_REVIEW:        'Under Review',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  HIRED:               'Hired',
  REJECTED:            'Rejected',
}

export default function StaffApplicationActions({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/staff-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      router.refresh()
    } catch {
      setError('Failed to update status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-gray-700">Update Status</p>
      <div className="flex flex-wrap gap-2">
        {(VALID_STAFF_STATUSES as readonly string[])
          .filter((s) => s !== currentStatus)
          .map((s) => (
            <Button
              key={s}
              variant={s === 'REJECTED' ? 'destructive' : 'outline'}
              size="sm"
              disabled={loading}
              onClick={() => updateStatus(s)}
            >
              → {STATUS_LABELS[s] ?? s}
            </Button>
          ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Create the detail page**

```tsx
// src/app/admin/staff-applications/[id]/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { isAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import StaffApplicationActions from '@/components/admin/StaffApplicationActions'
import { ExternalLink } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PENDING:             'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW:        'bg-blue-100 text-blue-800',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-800',
  HIRED:               'bg-green-100 text-green-800',
  REJECTED:            'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:             'Pending',
  UNDER_REVIEW:        'Under Review',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  HIRED:               'Hired',
  REJECTED:            'Rejected',
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-gray-900">{value ?? '—'}</p>
    </div>
  )
}

export default async function StaffApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  if (!isAdminUser(userId)) redirect('/')

  const { id } = await params
  const app = await prisma.staffApplication.findUnique({ where: { id } })
  if (!app) notFound()

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/staff-applications" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
            ← Staff Applications
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{app.firstName} {app.lastName}</h2>
          <p className="text-gray-500 mt-1">{app.role}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
          {STATUS_LABELS[app.status] ?? app.status}
        </span>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-bold text-gray-900">Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" value={<a href={`mailto:${app.email}`} className="text-blue-600 hover:underline">{app.email}</a>} />
          <Field label="Phone" value={<a href={`tel:${app.phone}`} className="text-blue-600 hover:underline">{app.phone}</a>} />
        </div>
      </div>

      {/* Experience */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-bold text-gray-900">Experience &amp; Availability</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Years of Experience" value={`${app.yearsExp} year${app.yearsExp !== 1 ? 's' : ''}`} />
          <Field label="Availability" value={app.availability} />
        </div>
      </div>

      {/* References */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-bold text-gray-900">References</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Reference 1" value={`${app.refOneName} — ${app.refOnePhone}`} />
          <Field label="Reference 2" value={`${app.refTwoName} — ${app.refTwoPhone}`} />
        </div>
      </div>

      {/* Cover Note */}
      <div className="bg-white rounded-lg border p-6 space-y-2">
        <h3 className="font-bold text-gray-900">Cover Note</h3>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{app.coverNote}</p>
      </div>

      {/* Portfolio */}
      {(app.resumeUrl || app.linkedinUrl) && (
        <div className="bg-white rounded-lg border p-6 space-y-3">
          <h3 className="font-bold text-gray-900">Portfolio / Resume</h3>
          {app.resumeUrl && (
            <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium">
              <ExternalLink size={14} /> Download Resume
            </a>
          )}
          {app.linkedinUrl && (
            <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium ml-4">
              <ExternalLink size={14} /> LinkedIn Profile
            </a>
          )}
        </div>
      )}

      {/* Status Actions */}
      <div className="bg-white rounded-lg border p-6">
        <StaffApplicationActions id={app.id} currentStatus={app.status} />
      </div>

      <p className="text-xs text-gray-400">Applied {new Date(app.createdAt).toLocaleString()}</p>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/staff-applications/[id]/page.tsx src/components/admin/StaffApplicationActions.tsx
git commit -m "feat: add admin staff application detail page and status actions"
```

---

## Task 12: Update Admin Nav

**Files:**
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Add Staff Applications link to admin nav**

In `src/app/admin/layout.tsx`, find the `<nav>` block and add the new link after the existing "Applications" link:

```tsx
<Link href="/admin" className="text-sm font-semibold text-blue-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
  Enrollment
</Link>
<Link href="/admin/staff-applications" className="text-sm font-semibold text-blue-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
  Staff Applications
</Link>
<Link href="/admin/stats" className="text-sm font-semibold text-blue-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
  Stats
</Link>
<Link href="/dashboard" className="text-sm font-semibold text-blue-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
  Family Portal
</Link>
```

Note: also rename the existing "Applications" link label to "Enrollment" to distinguish it from staff applications.

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat: add Staff Applications link to admin nav"
```

---

## Task 13: Update marketing site Careers page links

**Files:**
- Modify: `/Users/ayoola/Desktop/ASKA/allstarkids-website/src/app/careers/page.tsx`

- [ ] **Step 1: Update Apply Now links to point to the careers subdomain**

In the marketing site's careers page, change all `href` values from `/contact?message=...` to point to the careers portal:

```tsx
// Change each Apply Now link from:
href={`/contact?message=I%20would%20like%20to%20apply%20for%20the%20${encodeURIComponent(slug)}%20position.`}

// To:
href={`https://careers.allstarkidsacademyga.com/apply?role=${encodeURIComponent(title)}`}
```

- [ ] **Step 2: Commit in the marketing site repo**

```bash
cd /Users/ayoola/Desktop/ASKA/allstarkids-website
git add src/app/careers/page.tsx
git commit -m "feat: update careers Apply Now links to careers subdomain"
```

---

## Task 14: DNS + Vercel Domain Setup

This task is manual — no code required.

- [ ] **Step 1: Add CNAME in GoDaddy**

Go to GoDaddy DNS for `allstarkidsacademyga.com` and add:
- Type: `CNAME`
- Name: `careers`
- Value: `cname.vercel-dns.com`

- [ ] **Step 2: Add custom domain in Vercel**

In the `allstarkids-platform` Vercel project → Settings → Domains → Add:
```
careers.allstarkidsacademyga.com
```

Vercel will auto-provision SSL once DNS propagates (~10–30 min).

- [ ] **Step 3: Verify**

Visit `https://careers.allstarkidsacademyga.com` — should show the job listings page with the careers layout (no Clerk header).

---

## Task 15: Run Full Test Suite + Push

- [ ] **Step 1: Run all tests**

```bash
cd /Users/ayoola/Desktop/ASKA/allstarkids-platform
npm run test
```

Expected: All tests pass, including the new careers validation tests.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Build completes with no type errors.

- [ ] **Step 3: Push platform**

```bash
cd /Users/ayoola/Desktop/ASKA/allstarkids-platform
git push origin main
```

- [ ] **Step 4: Push marketing site**

```bash
cd /Users/ayoola/Desktop/ASKA/allstarkids-website
git push origin main
```

Expected: Both Vercel deployments trigger automatically.
