/// <reference types="node" />
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

// Local testing: emulate signed-in session without DB (dev only)
const EMULATE_EMAIL = process.env.EMULATE_SESSION_EMAIL ?? 'emulate@local';
const EMULATE_PASSWORD = process.env.EMULATE_SESSION_PASSWORD ?? 'emulate';
const EMULATE_USER_ID = 'emulate-local';
const EMULATE_ROLE = (process.env.EMULATE_SESSION_ROLE ?? 'REALTOR').toUpperCase();
const IS_DEV = process.env.NODE_ENV === 'development';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: { signIn: '/signin' },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID,
            clientSecret: process.env.APPLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // Development-only: emulate signed-in session without DB
        if (IS_DEV && credentials.email === EMULATE_EMAIL && credentials.password === EMULATE_PASSWORD) {
          return {
            id: EMULATE_USER_ID,
            email: EMULATE_EMAIL,
            name: 'Emulate (local)',
            role: EMULATE_ROLE,
            brokerId: null,
            isTeamLead: EMULATE_ROLE === 'REALTOR',
          };
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user?.password) return null; // OAuth-only user has no password
        if (await bcrypt.compare(credentials.password, user.password)) {
          return user;
        }
        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      // OAuth: ensure user has role (new users get USER by default via DB default)
      if (account?.provider !== 'credentials' && user?.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email! } });
        if (!existing) {
          // New OAuth user will be created by adapter with our User model defaults (role USER)
          return true;
        }
      }
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        const uid = (user as { id: string }).id;
        token.id = uid;
        const u = user as { role?: string; brokerId?: string | null; isTeamLead?: boolean };
        if (uid === EMULATE_USER_ID) {
          token.role = u.role ?? EMULATE_ROLE;
          token.brokerId = u.brokerId ?? undefined;
          token.isTeamLead = u.isTeamLead ?? (EMULATE_ROLE === 'REALTOR');
        } else {
          const full = await prisma.user.findUnique({ where: { id: uid }, select: { role: true, brokerId: true, ...({ isTeamLead: true } as Record<string, unknown>) } }) as { role: string; brokerId: string | null; isTeamLead?: boolean | null } | null;
          if (full) {
            token.role = full.role;
            token.brokerId = full.brokerId ?? undefined;
            token.isTeamLead = full.isTeamLead ?? false;
          }
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      const u = session.user as { id?: string; role?: string; brokerId?: string; isTeamLead?: boolean };
      u.id = token.id as string;
      u.role = token.role as string;
      u.brokerId = token.brokerId as string | undefined;
      u.isTeamLead = token.isTeamLead as boolean | undefined;
      return session;
    },
  },
};

export default NextAuth(authOptions);
export { BCRYPT_ROUNDS };
