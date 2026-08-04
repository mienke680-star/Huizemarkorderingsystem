import type { Role } from "@/lib/constants";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      initials: string;
      avatarColor: string;
      branchId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    initials: string;
    avatarColor: string;
    branchId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: Role;
    initials: string;
    avatarColor: string;
    branchId?: string;
  }
}
