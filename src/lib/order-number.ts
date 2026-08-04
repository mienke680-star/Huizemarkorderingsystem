import { prisma } from "@/lib/prisma";

export async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const prefix = `HM-${year}-`;

  const last = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const lastSeq = last ? parseInt(last.orderNumber.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}
