import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminActions from "@/components/admin/AdminActions";
import RegenerateButton from "@/components/admin/RegenerateButton";
import GenerateAllButton from "@/components/admin/GenerateAllButton";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  PLAYDATE_SCHEDULED: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  PLAYDATE_SCHEDULED: "Playdate Scheduled",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const PROGRAM_LABELS: Record<string, string> = {
  INFANT: "Infant (8 weeks–12 months)",
  TODDLER: "Toddler (12–24 months)",
  PRESCHOOL: "Preschool",
  PRE_K: "Pre-K Classroom",
  AFTER_SCHOOL: "After-School Care",
  SUMMER_CAMP_EAGLETS: "Summer Camp — Eaglets",
  SUMMER_CAMP_EAGLES: "Summer Camp — Eagles",
};

const DOC_LABELS: Record<string, string> = {
  BIRTH_CERTIFICATE: "Birth Certificate",
  SSN_CARD: "Social Security Card",
  MEDICAID_CARD: "Medicaid Card",
  PARENT_DL: "Parent/Guardian Driver's License",
  PROOF_OF_RESIDENCY: "Proof of Residency",
  PEACH_CARE_CARD: "Peach Care Card",
  FORM_3300: "Form 3300 (Eye, Ear, Dental & Nutrition)",
  FORM_3232: "Form 3232 (DHR Immunization Certificate)",
  // Generated document types
  enrollment_form: "Enrollment Form",
  authorization_topical: "Authorization — Topical Preparations",
  no_liability: "No Liability Agreement",
  infant_feeding: "Infant Feeding Plan",
  transportation: "Transportation Agreement",
  vehicle_emergency: "Vehicle Emergency Card",
  prek_child_reg: "Pre-K Child Registration",
  ssn_information: "SSN Information",
  caps_referral: "CAPS Referral",
};

function formatDocType(documentType: string): string {
  return (
    DOC_LABELS[documentType] ??
    documentType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

const generationStatusColors: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  ERROR: "bg-red-100 text-red-800",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/");

  const { id } = await params;

  const application = await prisma.enrollmentApplication.findUnique({
    where: { id },
    include: { child: true, family: true, documents: true },
  });

  if (!application) redirect("/admin");

  const { child, family, documents } = application;
  const childName = `${child.firstName} ${child.lastName}`;

  const emergencyContacts = (application.emergencyContacts as any[]) ?? [];
  const authorizedPickups = (application.authorizedPickups as any[]) ?? [];
  const topicalPreparations = (application.topicalPreparations as Record<string, boolean>) ?? {};
  const infantFeedingPlan = application.infantFeedingPlan as Record<string, any> | null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
        ← Back to Applications
      </Link>

      {/* Application Header */}
      <Section title="Application">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Child</span>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{childName}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Program</span>
            <p className="text-sm text-gray-900 mt-0.5">
              {PROGRAM_LABELS[child.programType] ?? child.programType}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Track</span>
            <p className="text-sm text-gray-900 mt-0.5">{application.track}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
            <span
              className={`inline-flex items-center mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[application.status] ?? "bg-gray-100 text-gray-800"
              }`}
            >
              {statusLabels[application.status] ?? application.status}
            </span>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</span>
            <p className="text-sm text-gray-900 mt-0.5">
              {application.submittedAt
                ? new Date(application.submittedAt).toLocaleDateString()
                : "Not submitted"}
            </p>
          </div>
          {application.playdateScheduledAt && (
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Playdate Date
              </span>
              <p className="text-sm text-purple-700 font-medium mt-0.5">
                {new Date(application.playdateScheduledAt).toLocaleString()}
              </p>
            </div>
          )}
          {application.playdateNotes && (
            <div className="col-span-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Playdate Notes
              </span>
              <p className="text-sm text-gray-900 mt-0.5">{application.playdateNotes}</p>
            </div>
          )}
          {application.rejectionReason && (
            <div className="col-span-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Rejection Reason
              </span>
              <p className="text-sm text-red-700 mt-0.5">{application.rejectionReason}</p>
            </div>
          )}
        </div>
      </Section>

      {/* Admin Actions */}
      <AdminActions
        applicationId={application.id}
        status={application.status}
        childName={childName}
      />

      {/* Family Contact */}
      <Section title="Family Contact">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Primary Parent" value={`${family.firstName} ${family.lastName}`} />
          <Field label="Email" value={family.email} />
          <Field label="Phone" value={family.phone} />
          <Field
            label="Address"
            value={`${family.address}, ${family.city}, ${family.state} ${family.zip}`}
          />
          {family.parent2FirstName && (
            <>
              <Field
                label="Second Parent"
                value={`${family.parent2FirstName} ${family.parent2LastName ?? ""}`}
              />
              <Field label="Second Parent Email" value={family.parent2Email} />
              <Field label="Second Parent Phone" value={family.parent2Phone} />
              <Field label="Second Parent Work Phone" value={family.parent2WorkPhone} />
              <Field label="Second Parent Employer" value={family.parent2Employer} />
              <Field label="Second Parent Employer Address" value={family.parent2EmployerAddress} />
              <Field label="Second Parent Address" value={family.parent2Address} />
            </>
          )}
        </div>
      </Section>

      {/* Child Info */}
      <Section title="Child Information">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Full Name" value={`${child.firstName} ${child.middleName ?? ""} ${child.lastName} ${child.nameSuffix ?? ""}`.trim()} />
          <Field
            label="Date of Birth"
            value={new Date(child.dateOfBirth).toLocaleDateString()}
          />
          <Field label="Sex" value={child.sex === "M" ? "Male" : "Female"} />
          <Field label="Living Arrangement" value={application.livingArrangement?.replace(/_/g, " ") ?? undefined} />
          <Field label="Legal Guardian" value={application.legalGuardian?.replace(/_/g, " ") ?? undefined} />
          <Field label="Current School" value={application.currentSchool} />
        </div>
      </Section>

      {/* Medical */}
      <Section title="Medical Information">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Doctor" value={application.doctorName} />
          <Field label="Doctor Phone" value={application.doctorPhone} />
          <Field label="Clinic / Hospital" value={application.clinicName} />
          <Field label="Special Needs" value={application.specialNeeds} />
          <Field label="Special Accommodations" value={application.specialAccommodations} />
          <Field label="Medications" value={application.medications} />
          <Field label="Allergies" value={application.allergies} />
        </div>
      </Section>

      {/* Emergency Contacts & Authorized Pickups */}
      <Section title="Emergency Contacts & Authorized Pickups">
        {emergencyContacts.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Emergency Contacts</h3>
            <div className="space-y-2">
              {emergencyContacts.map((contact: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded p-3 text-sm grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-xs text-gray-500">Name</span>
                    <p>{contact.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Phone</span>
                    <p>{contact.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Relationship</span>
                    <p>{contact.relationship}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {authorizedPickups.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Authorized Pickups</h3>
            <div className="space-y-2">
              {authorizedPickups.map((pickup: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded p-3 text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <span className="text-xs text-gray-500">Name</span>
                    <p>{pickup.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Phone</span>
                    <p>{pickup.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Relationship to Child</span>
                    <p>{pickup.relationship}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Relationship to Parent</span>
                    <p>{pickup.relationshipToParent}</p>
                  </div>
                  {pickup.address && (
                    <div className="col-span-2 md:col-span-4">
                      <span className="text-xs text-gray-500">Address</span>
                      <p>{pickup.address}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {emergencyContacts.length === 0 && authorizedPickups.length === 0 && (
          <p className="text-sm text-gray-400">No emergency contacts or authorized pickups on file.</p>
        )}
      </Section>

      {/* Agreements */}
      <Section title="Enrollment Agreements">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Enrollment Start" value={application.enrollmentStartMonth} />
          <Field label="Enrollment End" value={application.enrollmentEndMonth} />
          <Field label="Days of Week" value={application.daysOfWeek?.join(", ") || undefined} />
          <Field label="Start Time" value={application.startTime} />
          <Field label="End Time" value={application.endTime} />
          <Field label="Meal Plan" value={application.mealPlan?.join(", ") || undefined} />
        </div>
        {application.usesTransportation && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Transportation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Pickup Location" value={application.transportPickupLocation} />
              <Field label="Pickup Time" value={application.transportPickupTime} />
              <Field label="Delivery Location" value={application.transportDeliveryLocation} />
              <Field label="Delivery Time" value={application.transportDeliveryTime} />
              <Field label="Transport Days" value={application.transportDays?.join(", ") || undefined} />
              <Field label="Authorized Person" value={application.transportAuthorizedPerson} />
              <Field label="Fallback Procedure" value={application.transportFallbackProcedure} />
            </div>
          </div>
        )}
        {Object.keys(topicalPreparations).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Topical Preparations Authorized</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(topicalPreparations)
                .filter(([, allowed]) => allowed)
                .map(([prep]) => (
                  <span
                    key={prep}
                    className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                  >
                    {prep.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                ))}
            </div>
          </div>
        )}
      </Section>

      {/* Infant Feeding */}
      {infantFeedingPlan && (
        <Section title="Infant Feeding Plan">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(infantFeedingPlan).map(([key, value]) => (
              <Field
                key={key}
                label={key.replace(/([A-Z])/g, " $1").trim()}
                value={
                  typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : String(value ?? "")
                }
              />
            ))}
          </div>
        </Section>
      )}

      {/* Pre-K Info */}
      {application.track === "PRE_K" && (
        <Section title="Pre-K Information">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="County" value={application.preKCounty} />
            <Field label="SSN" value={application.preKSsn ? "****" : undefined} />
            {application.preKSsnNotProvidedReason && (
              <Field label="SSN Not Provided Reason" value={application.preKSsnNotProvidedReason} />
            )}
            <Field label="Previous School" value={application.preKPreviousSchool} />
            <Field label="Last Date at Previous School" value={application.preKLastDatePreviousSchool} />
            <Field label="Last Health Screening" value={application.preKLastHealthScreening} />
            <Field label="Ethnicity" value={application.preKEthnicity} />
            <Field label="Race" value={application.preKRace?.join(", ") || undefined} />
            <Field label="Primary Language" value={application.preKPrimaryLanguage} />
            <Field label="Birth Type" value={application.preKBirthType} />
            <Field label="Special Ed Services" value={application.preKSpecialEdServices?.join(", ") || undefined} />
            <Field label="Government Services" value={application.preKGovtServices?.join(", ") || undefined} />
            <Field
              label="Pre-K Transportation"
              value={application.preKTransportation != null ? (application.preKTransportation ? "Yes" : "No") : undefined}
            />
            <Field
              label="CAPS Received"
              value={application.capsReceived != null ? (application.capsReceived ? "Yes" : "No") : undefined}
            />
            <Field label="CAPS Case ID" value={application.capsCaseId} />
            <Field
              label="Needs Extended Day"
              value={application.needsExtendedDay != null ? (application.needsExtendedDay ? "Yes" : "No") : undefined}
            />
          </div>
        </Section>
      )}

      {/* Documents */}
      <Section title="Documents">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {documents.length === 0
              ? 'No documents generated yet.'
              : `${documents.filter(d => d.generationStatus === 'SUCCESS').length} of ${documents.length} generated successfully.`}
          </p>
          <GenerateAllButton applicationId={application.id} />
        </div>
        {documents.length === 0 ? null : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr>
                  <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Document
                  </th>
                  <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">
                        {formatDocType(doc.documentType)}
                      </p>
                      <p className="text-xs text-gray-500">{doc.fileName}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          generationStatusColors[doc.generationStatus] ??
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {doc.generationStatus === "SUCCESS"
                          ? "Success"
                          : doc.generationStatus === "PENDING"
                          ? "Pending"
                          : "Error"}
                      </span>
                      {doc.generationStatus === "ERROR" && doc.generationError && (
                        <p
                          className="text-xs text-red-600 mt-1 max-w-xs truncate"
                          title={doc.generationError}
                        >
                          {doc.generationError}
                        </p>
                      )}
                    </td>
                    <td className="py-3">
                      {doc.generationStatus === "SUCCESS" && doc.fileUrl ? (
                        <a
                          href={`/api/admin/applications/${application.id}/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Download
                        </a>
                      ) : (
                        <RegenerateButton
                          applicationId={application.id}
                          documentType={doc.documentType}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Admin Notes */}
      {application.adminNotes && (
        <Section title="Admin Notes">
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{application.adminNotes}</p>
        </Section>
      )}
    </div>
  );
}
