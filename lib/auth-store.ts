import { promises as fs } from "fs"
import path from "path"
import bcrypt from "bcryptjs"
import { getCollection } from "@/lib/mongo"

type UserRole = "student" | "professor" | "user"

export type AppUserRecord = {
  id: string
  name: string
  email: string
  passwordHash: string | null
  image?: string | null
  role?: UserRole
  roleId?: string
  createdAt: string
}

type CredentialInput = {
  email?: string
  password?: string
  role?: string
  roleId?: string
}

type PasswordResetRecord = {
  email: string
  codeHash: string
  expiresAt: string
  createdAt: string
}

const USERS_PATH = path.join(process.cwd(), "data", "users.json")
const PASSWORD_RESETS_PATH = path.join(process.cwd(), "data", "password-resets.json")

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function getUsersCollection() {
  return getCollection<AppUserRecord>("users")
}

async function getPasswordResetsCollection() {
  return getCollection<PasswordResetRecord>("password_resets")
}

function isMongoUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false
  return /Invalid MongoDB URI|MONGODB_URI|Mongo|ECONN|ENOTFOUND|authentication failed|bad auth/i.test(
    error.message
  )
}

async function readUsersFromJson() {
  try {
    const raw = await fs.readFile(USERS_PATH, "utf8")
    const parsed = JSON.parse(raw) as Array<
      Partial<AppUserRecord> & {
        id?: string
        email?: string
        passwordHash?: string | null
        password?: string
      }
    >

    return parsed
      .filter((user) => typeof user.email === "string")
      .map((user) => ({
        id: user.id || crypto.randomUUID(),
        name: user.name || "User",
        email: normalizeEmail(user.email as string),
        passwordHash: user.passwordHash ?? user.password ?? null,
        image: user.image ?? null,
        role: user.role,
        roleId: user.roleId,
        createdAt: user.createdAt || new Date().toISOString(),
      }))
  } catch {
    return [] as AppUserRecord[]
  }
}

async function writeUsersToJson(users: AppUserRecord[]) {
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2))
}

async function upsertUserInJson(user: AppUserRecord) {
  const users = await readUsersFromJson()
  const index = users.findIndex((existing) => existing.email === user.email)

  if (index >= 0) {
    users[index] = {
      ...users[index],
      ...user,
      email: user.email,
      id: users[index].id || user.id,
      createdAt: users[index].createdAt || user.createdAt,
    }
  } else {
    users.push(user)
  }

  await writeUsersToJson(users)
}

async function findUserInJsonByEmail(email: string) {
  const users = await readUsersFromJson()
  return users.find((user) => user.email === normalizeEmail(email)) ?? null
}

async function readPasswordResetsFromJson() {
  try {
    const raw = await fs.readFile(PASSWORD_RESETS_PATH, "utf8")
    const parsed = JSON.parse(raw) as PasswordResetRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [] as PasswordResetRecord[]
  }
}

async function writePasswordResetsToJson(records: PasswordResetRecord[]) {
  await fs.writeFile(PASSWORD_RESETS_PATH, JSON.stringify(records, null, 2))
}

async function upsertUserInMongo(user: AppUserRecord) {
  const users = await getUsersCollection()
  await users.updateOne(
    { email: user.email },
    {
      $setOnInsert: {
        id: user.id,
        createdAt: user.createdAt,
      },
      $set: {
        name: user.name,
        passwordHash: user.passwordHash,
        image: user.image ?? null,
        role: user.role,
        roleId: user.roleId,
      },
    },
    { upsert: true }
  )
}

async function findUserInMongoByEmail(email: string) {
  const users = await getUsersCollection()
  return users.findOne({ email: normalizeEmail(email) })
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email)
  try {
    const mongoUser = await findUserInMongoByEmail(normalizedEmail)
    if (mongoUser) return mongoUser
  } catch (error) {
    if (!isMongoUnavailable(error)) throw error
  }

  const fallback = await findUserInJsonByEmail(normalizedEmail)
  if (fallback) {
    try {
      await upsertUserInMongo(fallback)
    } catch (error) {
      if (!isMongoUnavailable(error)) throw error
    }
  }

  return fallback
}

export async function registerUser(input: {
  name: string
  email: string
  password: string
  role?: UserRole
  roleId?: string
}) {
  const normalizedEmail = normalizeEmail(input.email)
  const existing = await findUserByEmail(normalizedEmail)
  if (existing) {
    throw new Error("Email already registered")
  }

  const passwordHash = await bcrypt.hash(input.password, 10)
  const newUser: AppUserRecord = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: input.role,
    roleId: input.roleId?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }

  try {
    await upsertUserInMongo(newUser)
  } catch (error) {
    if (!isMongoUnavailable(error)) throw error
    await upsertUserInJson(newUser)
  }
  return newUser
}

export async function verifyCredentials(credentials: CredentialInput) {
  const email = credentials.email?.trim()
  const password = credentials.password
  if (!email || !password) return null

  const normalizedEmail = normalizeEmail(email)
  const user = await findUserByEmail(normalizedEmail)
  if (!user || !user.passwordHash) return null

  if (credentials.role && user.role && credentials.role !== user.role) {
    return null
  }

  if (credentials.roleId && user.roleId && credentials.roleId.trim().toLowerCase() !== user.roleId.trim().toLowerCase()) {
    return null
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) return null

  return user
}

export async function upsertGoogleUser(input: {
  name?: string | null
  email?: string | null
  image?: string | null
}) {
  if (!input.email) return null

  const normalizedEmail = normalizeEmail(input.email)
  try {
    const existing = await findUserInMongoByEmail(normalizedEmail)
    if (existing) {
      const users = await getUsersCollection()
      await users.updateOne(
        { email: normalizedEmail },
        {
          $set: {
            name: input.name || existing.name,
            image: input.image || existing.image || null,
          },
        }
      )

      return {
        ...existing,
        name: input.name || existing.name,
        image: input.image || existing.image || null,
      }
    }
  } catch (error) {
    if (!isMongoUnavailable(error)) throw error
  }

  const jsonUser = await findUserInJsonByEmail(normalizedEmail)

  const created: AppUserRecord =
    jsonUser || {
      id: crypto.randomUUID(),
      name: input.name || "Google User",
      email: normalizedEmail,
      passwordHash: null,
      image: input.image || null,
      createdAt: new Date().toISOString(),
    }

  created.name = input.name || created.name
  created.image = input.image || created.image || null

  try {
    await upsertUserInMongo(created)
  } catch (error) {
    if (!isMongoUnavailable(error)) throw error
    await upsertUserInJson(created)
  }
  return created
}

export async function updateUserDisplayName(input: { userId?: string; email?: string; name: string }) {
  const nextName = input.name.trim()
  if (!nextName) throw new Error("Display name is required")

  const byId = input.userId?.trim()
  const byEmail = input.email?.trim().toLowerCase()

  try {
    const users = await getUsersCollection()

    if (byId) {
      const result = await users.findOneAndUpdate(
        { id: byId },
        { $set: { name: nextName } },
        { returnDocument: "after" }
      )
      if (result) return result
    }

    if (byEmail) {
      return users.findOneAndUpdate(
        { email: byEmail },
        { $set: { name: nextName } },
        { returnDocument: "after" }
      )
    }
  } catch (error) {
    if (!isMongoUnavailable(error)) throw error
  }

  const users = await readUsersFromJson()
  const index = users.findIndex((user) => (byId ? user.id === byId : false) || (byEmail ? user.email === byEmail : false))
  if (index < 0) return null

  users[index] = {
    ...users[index],
    name: nextName,
  }
  await writeUsersToJson(users)
  return users[index]
}

export async function createPasswordResetCode(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const user = await findUserByEmail(normalizedEmail)
  if (!user) return null

  const code = generateSixDigitCode()
  const codeHash = await bcrypt.hash(code, 10)
  const now = Date.now()
  const expiresAt = new Date(now + 10 * 60 * 1000).toISOString()

  const record = {
    email: normalizedEmail,
    codeHash,
    expiresAt,
    createdAt: new Date(now).toISOString(),
  }

  try {
    const resets = await getPasswordResetsCollection()
    await resets.deleteMany({ email: normalizedEmail })
    await resets.insertOne(record)
  } catch (error) {
    if (!isMongoUnavailable(error)) throw error

    const records = await readPasswordResetsFromJson()
    await writePasswordResetsToJson([...records.filter((item) => item.email !== normalizedEmail), record])
  }

  return { code, userName: user.name || "User" }
}

export async function resetPasswordWithCode(input: { email: string; code: string; newPassword: string }) {
  const email = normalizeEmail(input.email)
  let record: PasswordResetRecord | null = null
  let usingJsonFallback = false

  try {
    const resets = await getPasswordResetsCollection()
    record = await resets.findOne({ email })
  } catch (error) {
    if (!isMongoUnavailable(error)) throw error
    usingJsonFallback = true
    const records = await readPasswordResetsFromJson()
    record = records.find((item) => item.email === email) ?? null
  }

  if (!record) {
    return { ok: false as const, error: "Invalid or expired code." }
  }

  if (Date.now() > new Date(record.expiresAt).getTime()) {
    if (usingJsonFallback) {
      const records = await readPasswordResetsFromJson()
      await writePasswordResetsToJson(records.filter((item) => item.email !== email))
    } else {
      const resets = await getPasswordResetsCollection()
      await resets.deleteMany({ email })
    }
    return { ok: false as const, error: "Code expired. Request a new one." }
  }

  const isMatch = await bcrypt.compare(input.code.trim(), record.codeHash)
  if (!isMatch) {
    return { ok: false as const, error: "Invalid or expired code." }
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return { ok: false as const, error: "Account not found." }
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10)
  try {
    const users = await getUsersCollection()
    await users.updateOne({ email }, { $set: { passwordHash } }, { upsert: false })
  } catch (error) {
    if (!isMongoUnavailable(error)) throw error

    const users = await readUsersFromJson()
    const index = users.findIndex((item) => item.email === email)
    if (index >= 0) {
      users[index] = {
        ...users[index],
        passwordHash,
      }
      await writeUsersToJson(users)
    }
  }

  if (usingJsonFallback) {
    const records = await readPasswordResetsFromJson()
    await writePasswordResetsToJson(records.filter((item) => item.email !== email))
  } else {
    const resets = await getPasswordResetsCollection()
    await resets.deleteMany({ email })
  }

  return { ok: true as const }
}
