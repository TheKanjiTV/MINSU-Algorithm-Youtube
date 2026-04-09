import type { Document } from "mongodb"
import { MongoClient } from "mongodb"

function pickMongoUri() {
  const candidates = [
    process.env.MONGODB_URI,
    process.env.MONGODB_URL,
    process.env.MONGO_URI,
    process.env.mongodb_url,
  ]

  let sawPlaceholder = false

  for (const value of candidates) {
    if (!value) continue
    const trimmed = value.trim()
    if (!trimmed) continue
    if (trimmed.includes("<db_password>")) {
      sawPlaceholder = true
      continue
    }
    if (!trimmed.startsWith("mongodb://") && !trimmed.startsWith("mongodb+srv://")) continue
    return trimmed
  }

  if (sawPlaceholder) {
    return "__MONGO_URI_PLACEHOLDER__"
  }

  return undefined
}

const MONGODB_URI = pickMongoUri()
const DB_NAME = "yt-learn"

let cachedClientPromise: Promise<MongoClient> | null = null

async function getMongoClient() {
  if (MONGODB_URI === "__MONGO_URI_PLACEHOLDER__") {
    throw new Error(
      "Invalid MongoDB URI: replace <db_password> with the real database password in MONGODB_URI."
    )
  }

  if (!MONGODB_URI) {
    throw new Error(
      "Please define one of these environment variables: MONGODB_URI, MONGODB_URL, MONGO_URI, or mongodb_url."
    )
  }

  if (!cachedClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      // Serverless-friendly defaults: keep pools small and drop idle connections.
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
    })
    cachedClientPromise = client.connect()
  }

  return cachedClientPromise
}

export async function connectToDatabase() {
  const client = await getMongoClient()
  return client.db(DB_NAME)
}

export async function getCollection<T extends Document>(name: string) {
  const db = await connectToDatabase()
  return db.collection<T>(name)
}
