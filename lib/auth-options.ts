import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { upsertGoogleUser, verifyCredentials } from "@/lib/auth-store"

const ADMIN_EMAILS = new Set(["kenjiyonaha11@gmail.com"])

function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.has(email.trim().toLowerCase()))
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      role: { label: "Role", type: "text" },
      roleId: { label: "Role ID", type: "text" },
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim()
      const password = credentials?.password
      if (!email || !password) return null

      const user = await verifyCredentials({
        email,
        password,
        role: credentials?.role,
        roleId: credentials?.roleId,
      })
      if (!user) return null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image || undefined,
        role: user.role,
        roleId: user.roleId,
      }
    },
  }),
]

const isGoogleAuthEnabled = process.env.ENABLE_GOOGLE_AUTH === "true"

if (isGoogleAuthEnabled && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers,
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === "google") {
        const stored = await upsertGoogleUser({
          name: user.name,
          email: user.email,
          image: user.image,
        })
        if (stored) {
          user.id = stored.id
          ;(user as typeof user & { role?: string; roleId?: string }).role = stored.role
          ;(user as typeof user & { role?: string; roleId?: string }).roleId = stored.roleId
        }
      }

      if (isAdminEmail(user.email)) {
        ;(user as typeof user & { role?: string }).role = "admin"
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        token.role = (user as typeof user & { role?: string }).role
        token.roleId = (user as typeof user & { roleId?: string }).roleId
      }

      if (isAdminEmail(typeof token.email === "string" ? token.email : undefined)) {
        token.role = "admin"
      }

      if (trigger === "update" && session?.name) {
        token.name = session.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ""
        session.user.name = typeof token.name === "string" ? token.name : session.user.name
        session.user.email = typeof token.email === "string" ? token.email : session.user.email
        session.user.image = typeof token.picture === "string" ? token.picture : session.user.image
        session.user.role = typeof token.role === "string" ? token.role : undefined
        session.user.roleId = typeof token.roleId === "string" ? token.roleId : undefined
      }
      return session
    },
  },
}
