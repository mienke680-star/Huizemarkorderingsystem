import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-helpers";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;

  const filter = await prisma.savedFilter.findUnique({ where: { id } });
  if (!filter || filter.userId !== session!.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.savedFilter.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
