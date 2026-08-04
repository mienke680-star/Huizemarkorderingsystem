import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell
      user={{
        name: session.user.name ?? "User",
        initials: session.user.initials,
        avatarColor: session.user.avatarColor,
        role: session.user.role,
      }}
    >
      {children}
    </AppShell>
  );
}
