import type { DefaultSession } from "next-auth";
import type { RoleType } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: RoleType;
      sessionId: string;
    };
  }

  interface User {
    role?: RoleType;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: RoleType;
    sessionId?: string;
    sessionVersion?: number;
  }
}
