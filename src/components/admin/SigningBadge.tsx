type Summary = { signable: number; signed: number; complete: boolean };

export default function SigningBadge({
  summary,
  signedAt,
  hasDocuments = false,
}: {
  summary: Summary;
  signedAt?: Date | null;
  hasDocuments?: boolean;
}) {
  if (summary.signable === 0) {
    if (hasDocuments) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Forms failed to generate</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No forms yet</span>;
  }
  if (summary.complete) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Signed{signedAt ? ` ${new Date(signedAt).toLocaleDateString("en-US")}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      Awaiting parent signature ({summary.signed} of {summary.signable})
    </span>
  );
}
