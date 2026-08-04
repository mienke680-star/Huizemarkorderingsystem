import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/constants";

export async function notify(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  orderId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      orderId: opts.orderId,
    },
  });
}
