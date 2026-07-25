import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import GoogleProvider from "next-auth/providers/google";
import { isCredentialEmailVerified } from "@/lib/auth/email-verification";
import {
  createRegisteredSession,
  validateRegisteredSession,
} from "@/lib/auth/session-registry";
import { verifyMfaForLogin } from "@/services/mfa.service";

function invalidateToken(token: {
  id?: unknown;
  email?: unknown;
  name?: unknown;
  picture?: unknown;
  role?: unknown;
  sessionId?: unknown;
  sessionVersion?: unknown;
}) {
  token.id = undefined;
  token.email = undefined;
  token.name = undefined;
  token.picture = undefined;
  token.role = undefined;
  token.sessionId = undefined;
  token.sessionVersion = undefined;
}

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
  events: {
    async signOut(message) {
      if (
        "token" in message &&
        typeof message.token?.sessionId === "string"
      ) {
        await db.authSession.updateMany({
          where: { id: message.token.sessionId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const currentUser = await db.user.findUnique({
          where: { id: user.id },
          include: { role: true },
        });
        if (!currentUser) {
          invalidateToken(token);
          return token;
        }
        const registeredSession = await createRegisteredSession(db, {
          userId: currentUser.id,
        });
        token.id = currentUser.id;
        token.email = currentUser.email;
        token.role = currentUser.role.type;
        token.sessionId = registeredSession.id;
        token.sessionVersion = currentUser.sessionVersion;
        return token;
      }

      if (
        typeof token.id !== "string" ||
        typeof token.sessionId !== "string" ||
        typeof token.sessionVersion !== "number"
      ) {
        invalidateToken(token);
        return token;
      }

      try {
        const state = await validateRegisteredSession(db, {
          sessionId: token.sessionId,
          userId: token.id,
          sessionVersion: token.sessionVersion,
        });
        if (!state.valid) {
          invalidateToken(token);
          return token;
        }
        token.email = state.email;
        token.role = state.role;
        token.sessionVersion = state.sessionVersion;
      } catch (error) {
        console.error("JWT session registry validation failed", {
          name: error instanceof Error ? error.name : typeof error,
        });
        invalidateToken(token);
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
        session.user.sessionId =
          typeof token.sessionId === "string" ? token.sessionId : "";
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
        mfaCode: { label: "MFA code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        const user = await db.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user || !user.password || !isCredentialEmailVerified(user.emailVerified)) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;
        if (
          user.role.type === "ADMIN" &&
          !(await verifyMfaForLogin(
            user.id,
            typeof credentials.mfaCode === "string"
              ? credentials.mfaCode.trim()
              : undefined,
          ))
        ) {
          return null;
        }

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
