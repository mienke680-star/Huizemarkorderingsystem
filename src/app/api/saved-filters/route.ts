import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page");

  const filters = await prisma.savedFilter.findMany({
    where: { userId: session!.user.id, ...(page ? { page } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ filters });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const body = await req.json();

  const filter = await prisma.savedFilter.create({
    data: {
      userId: session!.user.id,
      page: body.page,
      name: body.name,
      filterJson: JSON.stringify(body.filter ?? {}),
    },
  });
  return NextResponse.json({ filter }, { status: 201 });
}
