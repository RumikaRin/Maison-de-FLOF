import type { NextAuthConfig } from "next-auth";
import { stripLocalePrefix } from "@/lib/locale";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Keep the edge-safe session mapping here so middleware can make an initial
  // routing decision. Server/API authorization validates the DB registry.
  callbacks: {
    session({ session, token }) {
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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = stripLocalePrefix(nextUrl.pathname).pathname;
      const isOnAdmin = pathname.startsWith("/admin");
      const isOnProfile = pathname.startsWith("/profile");

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        const role = auth.user.role;
        if (role !== "ADMIN" && role !== "STAFF") {
          return Response.redirect(new URL("/", nextUrl));
        }
      }

      if (isOnProfile && !isLoggedIn) return false;

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
