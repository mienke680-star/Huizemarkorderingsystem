import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma/bcrypt) used by middleware for route protection.
// The full config with the Credentials provider lives in src/auth.ts and is
// only ever evaluated in the Node.js runtime (API routes, server components).
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role as never;
        token.uid = user.id as string;
        token.initials = (user as { initials: string }).initials;
        token.avatarColor = (user as { avatarColor: string }).avatarColor;
        token.branchId = (user as { branchId?: string }).branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as never;
        session.user.initials = token.initials as string;
        session.user.avatarColor = token.avatarColor as string;
        session.user.branchId = token.branchId as string | undefined;
      }
      return session;
    },
  },
};
