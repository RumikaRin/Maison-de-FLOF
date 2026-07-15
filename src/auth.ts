import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import GoogleProvider from "next-auth/providers/google";
import type { RoleType } from "@prisma/client";

/** Re-check role from DB at least every 5 minutes so demotions take effect. */
const ROLE_REFRESH_MS = 5 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: {
    ...PrismaAdapter(db),
    createUser: async (data: any) => {
      const customerRole = await db.role.findUnique({ where: { type: "CUSTOMER" } });
      if (!customerRole) throw new Error("CUSTOMER role not found");
      const user = await db.user.create({
        data: {
          ...data,
          roleId: customerRole.id,
          customer: { create: { customerType: "RETAIL" } },
        },
      });
      return user;
    },
  } as any,
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user.role as RoleType) || "CUSTOMER";
        token.roleCheckedAt = Date.now();
        return token;
      }

      const roleCheckedAt =
        typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;
      const shouldRefresh =
        Boolean(token.id) && Date.now() - roleCheckedAt >= ROLE_REFRESH_MS;

      if (shouldRefresh && typeof token.id === "string") {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id },
            include: { role: true },
          });
          if (!dbUser) {
            token.role = "CUSTOMER";
            token.id = undefined;
          } else {
            token.role = dbUser.role.type;
            token.email = dbUser.email;
          }
        } catch (error) {
          console.error("JWT role refresh failed:", error);
        }
        token.roleCheckedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role =
          token.role === "ADMIN" || token.role === "STAFF" || token.role === "CUSTOMER"
            ? token.role
            : "CUSTOMER";
      }
      return session;
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking:
        process.env.AUTH_ALLOW_DANGEROUS_EMAIL_LINKING === "true",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        const user = await db.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role.type,
        };
      },
    }),
  ],
});
