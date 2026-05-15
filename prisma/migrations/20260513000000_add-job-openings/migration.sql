CREATE TABLE "job_openings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Users',
    "accentColor" TEXT NOT NULL DEFAULT '#6366f1',

    CONSTRAINT "job_openings_pkey" PRIMARY KEY ("id")
);
