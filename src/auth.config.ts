import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Keep the edge-safe session mapping here so middleware authorization sees
  // the role stored in the JWT. DB-backed role refresh remains in auth.ts.
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role =
          token.role === "ADMIN" || token.role === "STAFF" || token.role === "CUSTOMER"
            ? token.role
            : "CUSTOMER";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnProfile = nextUrl.pathname.startsWith("/profile");

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
