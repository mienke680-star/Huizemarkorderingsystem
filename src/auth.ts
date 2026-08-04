import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/constants";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          initials: user.initials,
          avatarColor: user.avatarColor,
          branchId: user.branchId ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
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
        session.user.role = token.role as Role;
        session.user.initials = token.initials as string;
        session.user.avatarColor = token.avatarColor as string;
        session.user.branchId = token.branchId as string | undefined;
      }
      return session;
    },
  },
});
