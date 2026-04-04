# Careers Portal — Design Spec
**Date:** 2026-04-04  
**Status:** Approved

---

## Overview

Add a public-facing careers portal at `careers.allstarkidsacademyga.com` and a staff applications admin section to the existing `allstarkids-platform`. No new repo or deployment — the existing Next.js app on Vercel gets a second custom domain and uses middleware to route by hostname.

---

## Architecture

- **Platform:** `allstarkids-platform` (Next.js, Clerk, Prisma, Supabase PostgreSQL + Storage)
- **Subdomain:** `careers.allstarkidsacademyga.com` added as a custom domain in the existing Vercel project
- **Routing:** Next.js middleware checks `request.headers.get("host")`. If hostname is `careers.allstarkidsacademyga.com`, rewrites to `/careers/*` routes which serve the public portal with no auth. All other hostnames serve the existing platform unchanged.
- **Auth:** Clerk (existing). Public careers routes have no auth. Admin routes protected by existing `isAdminUser` check.
- **Storage:** Supabase Storage for resume file uploads (bucket: `resumes`). Signed URLs stored in the DB.
- **No new deployment, no new repo.**

---

## New Routes

### Public — careers subdomain only

| Route | Description |
|---|---|
| `/careers` | Job listings — 3 roles with descriptions and "Apply Now" buttons |
| `/careers/apply` | Full application form. `?role=` query param pre-selects the role. |
| `/careers/apply/success` | Confirmation screen shown after successful submission |

### Admin — existing platform, Clerk-protected

| Route | Description |
|---|---|
| `/admin/staff-applications` | Table of all staff applications, filterable by status and role |
| `/admin/staff-applications/[id]` | Full detail view with all fields, resume link, and status controls |

---

## Data Model

New Prisma enum and model added to existing schema:

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
  role         String                 // "Teacher (1 Year Olds)" | "Teacher (2 Year Olds)" | "Bus Driver"
  firstName    String
  lastName     String
  email        String
  phone        String
  yearsExp     Int
  availability String                 // free text, e.g. "Mon–Fri, 6am–3pm"
  refOneName   String
  refOnePhone  String
  refTwoName   String
  refTwoPhone  String
  coverNote    String
  resumeUrl    String?                // Supabase Storage signed URL (optional)
  linkedinUrl  String?                // optional
  status       StaffApplicationStatus @default(PENDING)
  createdAt    DateTime               @default(now())
  updatedAt    DateTime               @updatedAt
}
```

---

## Application Form

No account required. Fields:

| Field | Required |
|---|---|
| Role (pre-selected from listing page) | Yes |
| First name | Yes |
| Last name | Yes |
| Email | Yes |
| Phone | Yes |
| Years of experience | Yes |
| Availability (free text) | Yes |
| Reference 1 — name + phone | Yes |
| Reference 2 — name + phone | Yes |
| Cover note | Yes |
| Resume upload (PDF/Word → Supabase Storage) | No |
| LinkedIn URL | No |

Submission hits `POST /api/careers/apply`. On success, redirects to `/careers/apply/success`. On error, displays inline error without losing form state.

---

## Admin — Staff Applications

### List view (`/admin/staff-applications`)

- Stats bar: Total, Pending, Interview Scheduled, Hired
- Filter tabs by status (All, Pending, Under Review, Interview Scheduled, Hired, Rejected)
- Filter by role (dropdown)
- Table columns: Name, Role, Experience, Applied, Status, Actions
- Mobile-responsive card fallback (matches existing enrollment admin pattern)

### Detail view (`/admin/staff-applications/[id]`)

- All application fields displayed
- Resume download link (if uploaded)
- LinkedIn link (if provided)
- Status selector: advance through `PENDING → UNDER_REVIEW → INTERVIEW_SCHEDULED → HIRED` or mark `REJECTED`
- Status change hits `PATCH /api/admin/staff-applications/[id]`

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/careers/apply` | None | Submit staff application, handle resume upload to Supabase Storage |
| `GET` | `/api/admin/staff-applications` | Clerk admin | List applications with optional status/role filters |
| `PATCH` | `/api/admin/staff-applications/[id]` | Clerk admin | Update application status |

---

## Status Workflow

```
PENDING → UNDER_REVIEW → INTERVIEW_SCHEDULED → HIRED
                     ↘                     ↘
                    REJECTED             REJECTED
```

---

## Middleware Logic

```ts
// middleware.ts (updated)
const careersHost = "careers.allstarkidsacademyga.com";

if (request.headers.get("host") === careersHost && !pathname.startsWith("/careers")) {
  return NextResponse.rewrite(new URL(`/careers${pathname}`, request.url));
}
```

Public `/careers/*` routes are excluded from Clerk's `clerkMiddleware` auth protection.

---

## DNS

Add CNAME record in GoDaddy:
- Name: `careers`
- Value: `cname.vercel-dns.com`

Then add `careers.allstarkidsacademyga.com` as a custom domain in the Vercel project settings.

---

## Out of Scope

- Applicant account / status tracking (no-account submission only)
- Email notifications to applicants (can add later)
- Calendar integration for interview scheduling
