export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;
  return (
    <div
      role="alert"
      className="w-full bg-amber-500 text-amber-950 text-center text-sm font-semibold px-4 py-2 border-b border-amber-700"
    >
      DEMO — synthetic data only. Not HIPAA-compliant. Do not enter real patient information.
    </div>
  );
}
