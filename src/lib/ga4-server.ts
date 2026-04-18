/**
 * Extract GA4 client_id from the _ga cookie value.
 * Cookie format: GA1.1.{client_id_part1}.{client_id_part2}
 */
export function extractGa4ClientId(gaCookie: string | undefined): string | null {
  if (!gaCookie) return null;
  const parts = gaCookie.split(".");
  if (parts.length < 4) return null;
  return `${parts[2]}.${parts[3]}`;
}

export async function sendGA4Event(
  userId: string,
  eventName: string,
  params: Record<string, unknown>,
  clientId?: string,
) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn("[GA4] GA4_MEASUREMENT_ID or GA4_API_SECRET not set — skipping event");
    return;
  }

  const body = {
    client_id: clientId ?? `server.${userId}`,
    user_id: userId,
    events: [{ name: eventName, params }],
  };

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("[GA4] Measurement Protocol failed:", res.status, res.statusText);
    }
  } catch (err) {
    console.error("[GA4] Measurement Protocol error:", err);
  }
}
