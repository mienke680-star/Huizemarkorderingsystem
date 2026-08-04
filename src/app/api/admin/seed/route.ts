import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed-data";

// One-time bootstrap endpoint for populating a freshly provisioned database
// (e.g. right after the first deploy). Guarded by a shared secret rather
// than a user session, since it needs to run before any admin account
// exists. Safe to leave deployed: without the correct header it 403s, and
// the seed script itself wipes+reseeds idempotently rather than duplicating
// data on repeat calls.
export async function POST(req: Request) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SEED_SECRET is not configured on the server." }, { status: 503 });
  }
  const provided = req.headers.get("x-seed-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await seedDatabase(prisma);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Seed failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Seed failed" }, { status: 500 });
  }
}
