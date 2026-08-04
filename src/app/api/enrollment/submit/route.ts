import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { generateApplicationDocuments } from "@/lib/documents/generate-documents";
import { NextResponse } from "next/server";

// Submission generates the full document set inline; give it headroom
// beyond the default function duration.
export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { familyInfo, children, signature, signatureDate } = body;

  // 1. Get the family record
  const family = await prisma.family.findUnique({ where: { clerkUserId: userId } });
  if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });

  // 2. Update family contact info (in case they edited it in step 1)
  await prisma.family.update({
    where: { id: family.id },
    data: {
      firstName: familyInfo.firstName,
      lastName: familyInfo.lastName,
      email: familyInfo.email,
      phone: familyInfo.phone,
      address: familyInfo.address,
      city: familyInfo.city,
      state: familyInfo.state,
      zip: familyInfo.zip,
      parent2FirstName: familyInfo.parent2FirstName || null,
      parent2LastName: familyInfo.parent2LastName || null,
      parent2Email: familyInfo.parent2Email || null,
      parent2Phone: familyInfo.parent2Phone || null,
      parent2WorkPhone: familyInfo.parent2WorkPhone || null,
      parent2Employer: familyInfo.parent2Employer || null,
      parent2EmployerAddress: familyInfo.parent2EmployerAddress || null,
    },
  });

  // 3. For each child, create Child + EnrollmentApplication + ApplicationDocuments
  const createdApplicationIds: string[] = [];
  for (const child of children) {
    // Create child record
    const childRecord = await prisma.child.create({
      data: {
        familyId: family.id,
        firstName: child.firstName,
        lastName: child.lastName,
        middleName: child.middleName || null,
        nameSuffix: child.nameSuffix || null,
        dateOfBirth: new Date(child.dateOfBirth),
        sex: child.sex,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        programType: child.programType as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        track: child.track as any,
      },
    });

    // Create enrollment application
    const application = await prisma.enrollmentApplication.create({
      data: {
        familyId: family.id,
        childId: childRecord.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        track: child.track as any,
        status: "PENDING",
        submittedAt: new Date(),

        // Living situation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        livingArrangement: (child.livingArrangement as any) || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        legalGuardian: (child.legalGuardian as any) || null,

        // Contacts (JSON)
        authorizedPickups: child.authorizedPickups || [],
        emergencyContacts: child.emergencyContacts || [],

        // Medical
        doctorName: child.doctorName || null,
        doctorPhone: child.doctorPhone || null,
        specialNeeds: child.specialNeeds || null,
        specialAccommodations: child.specialAccommodations || null,
        medications: child.medications || null,
        allergies: child.allergies || null,
        currentSchool: child.currentSchool || null,

        // Topical preparations (JSON)
        topicalPreparations: child.topicalPreparations || null,

        // Transportation
        usesTransportation: child.usesTransportation || false,
        transportPickupLocation: child.transportPickupLocation || null,
        transportPickupTime: child.transportPickupTime || null,
        transportDeliveryLocation: child.transportDeliveryLocation || null,
        transportDeliveryTime: child.transportDeliveryTime || null,
        transportDays: child.transportDays || [],
        transportAuthorizedPerson: child.transportAuthorizedPerson || null,
        transportFallbackProcedure: child.transportFallbackProcedure || null,

        // Infant feeding (JSON, only for INFANT and TODDLER programs)
        infantFeedingPlan: child.infantFeedingPlan || null,

        // Schedule
        enrollmentStartMonth: child.enrollmentStartMonth || null,
        enrollmentEndMonth: child.enrollmentEndMonth || null,
        daysOfWeek: child.daysOfWeek || [],
        startTime: child.startTime || null,
        endTime: child.endTime || null,
        mealPlan: child.mealPlan || [],

        // Pre-K specific
        preKSsn: child.preKSsn || null,
        preKCounty: child.preKCounty || null,
        preKPreviousSchool: child.preKPreviousSchool || null,
        preKLastDatePreviousSchool: child.preKLastDatePreviousSchool || null,
        preKLastHealthScreening: child.preKLastHealthScreening || null,
        preKSsnNotProvidedReason: child.preKSsnNotProvidedReason || null,

        // Signature
        signatureParent: signature,
        signatureDate: new Date(signatureDate),
      },
    });

    createdApplicationIds.push(application.id);

    // Create ApplicationDocument records for Pre-K uploads
    if (child.preKDocuments && child.preKDocuments.length > 0) {
      await prisma.applicationDocument.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: child.preKDocuments.map((doc: any) => ({
          applicationId: application.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize || null,
          mimeType: doc.mimeType || null,
          // Parent uploads are already sitting in the documents bucket, so
          // they are immediately downloadable from the admin dashboard
          generationStatus: "SUCCESS" as const,
        })),
      });
    }

    // Generate filled PDF documents (non-fatal — submission succeeds even if generation fails)
    try {
      await generateApplicationDocuments(application.id);
    } catch (err) {
      console.error(`Document generation failed for application ${application.id}:`, err);
    }
  }

  // 4. Send emails
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childNames = children.map((c: any) => `${c.firstName} ${c.lastName}`).join(", ");
  const parentName = `${familyInfo.firstName} ${familyInfo.lastName}`;

  // Send emails — failures are non-fatal: DB write is already committed
  try {
    // Parent confirmation
    await resend.emails.send({
      from: "All Star Kids Academy <no-reply@allstarkidsacademyga.com>",
      to: familyInfo.email,
      subject: "We received your enrollment application!",
      html: `
        <h2>Thank you, ${familyInfo.firstName}!</h2>
        <p>We've received your enrollment application for <strong>${childNames}</strong>.</p>
        <p>Our team will review your application and be in touch within 3–5 business days to schedule a playdate.</p>
        <p>If you have any questions, please contact us at <a href="mailto:info@allstarkidsacademyga.com">info@allstarkidsacademyga.com</a>.</p>
        <br/>
        <p>— All Star Kids Academy<br/>4518 Covington Hwy, Decatur, GA 30035<br/>(Mon–Fri, 6:00 AM – 6:30 PM)</p>
      `,
    });

    // Staff notification
    if (process.env.ADMIN_EMAIL) {
      await resend.emails.send({
        from: "ASKA Platform <no-reply@allstarkidsacademyga.com>",
        to: process.env.ADMIN_EMAIL,
        subject: `New enrollment application: ${parentName}`,
        html: `
          <h2>New Enrollment Application</h2>
          <p><strong>Family:</strong> ${parentName}</p>
          <p><strong>Children:</strong> ${childNames}</p>
          <p><strong>Programs:</strong> ${children.map((c: { programType: string }) => c.programType).join(", ")}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          <p>Log in to the admin dashboard to review and take action.</p>
        `,
      });
    }
  } catch (emailErr) {
    // Log but don't fail the request — application is already saved
    console.error("Failed to send enrollment notification emails:", emailErr);
  }

  return NextResponse.json({ success: true, applicationIds: createdApplicationIds });
}
