import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import { encode as defaultEncode } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import pg from "pg";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    remember?: boolean;
  }
}

const DB_NAME = process.env.DB_NAME || "chocassye";
const DB_PASSWORD = process.env.DB_PASSWORD || "password";

// Separate pool for auth — avoids importing the "use server"-marked db.ts
const authPool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: DB_NAME,
  password: DB_PASSWORD,
  statement_timeout: 10000,
  max: 3,
});

const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
        remember: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await authPool.query(
          "SELECT id, name, email, password_hash FROM users WHERE email = $1",
          [credentials.email],
        );
        const user = result.rows[0];
        if (!user?.password_hash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash,
        );
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          remember: credentials.remember === "true",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    maxAge: REMEMBER_MAX_AGE, // controls the cookie lifetime (upper bound)
  },
  jwt: {
    async encode(params) {
      const token = params.token;
      // For non-remembered sessions, calculate time remaining from the
      // original sign-in so refreshes don't extend the window.
      if (token && !token.remember && typeof token.signedInAt === "number") {
        const expiresAt = token.signedInAt + SESSION_MAX_AGE * 1000;
        const remainingSec = Math.floor((expiresAt - Date.now()) / 1000);
        return defaultEncode({ ...params, maxAge: Math.max(0, remainingSec) });
      }
      return defaultEncode({ ...params, maxAge: REMEMBER_MAX_AGE });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await authPool.query(
          `INSERT INTO users (name, email, google_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO UPDATE
           SET google_id = EXCLUDED.google_id,
               name = COALESCE(users.name, EXCLUDED.name)`,
          [user.name ?? null, user.email, account.providerAccountId],
        );
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // signedInAt anchors the session window for non-remembered sessions
        token.signedInAt = Date.now();
        if (account?.provider === "credentials") {
          token.id = user.id;
          token.remember = user.remember ?? false;
        } else if (account?.provider === "google" && user.email) {
          // Google OAuth users always get a full remembered session
          token.remember = true;
          const result = await authPool.query(
            "SELECT id FROM users WHERE email = $1",
            [user.email],
          );
          token.id = result.rows[0]?.id ? String(result.rows[0].id) : undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
