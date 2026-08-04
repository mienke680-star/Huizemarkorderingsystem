import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ branches });
}

export async function POST(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;
  const body = await req.json();
  const branch = await prisma.branch.create({ data: { name: body.name, address: body.address || null } });
  return NextResponse.json({ branch }, { status: 201 });
}
