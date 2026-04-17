export const runtime = "nodejs";

// Checkout is temporarily paused while we migrate payment providers.
// The prior Stripe-backed implementation is preserved in git history;
// reinstate it (or replace with the new provider) when ready.
export async function POST() {
  return Response.json(
    { error: "Checkout is temporarily paused. Please try again soon." },
    { status: 503 },
  );
}
