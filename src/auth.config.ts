import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // jwt/session callbacks with DB role refresh live in auth.ts (Node runtime).
  // Edge middleware only needs the authorized guard below.
  callbacks: {
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
