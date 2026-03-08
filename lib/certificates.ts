import { promises as fs } from "node:fs"
import path from "node:path"

export type CertificateRecord = {
  id: string
  userId: string
  playlistId: string
  course: string
  recipientName: string
  issuedDate: string
  createdAt: string
}

const FILE_PATH = path.join(process.cwd(), "data", "certificates.json")

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
  try {
    await fs.access(FILE_PATH)
  } catch {
    await fs.writeFile(FILE_PATH, "[]", "utf8")
  }
}

async function readCertificates(): Promise<CertificateRecord[]> {
  await ensureStoreFile()
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8")
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as CertificateRecord[]
  } catch {
    return []
  }
}

async function writeCertificates(records: CertificateRecord[]) {
  await fs.writeFile(FILE_PATH, JSON.stringify(records, null, 2), "utf8")
}

export async function getCertificateByUserPlaylist(userId: string, playlistId: string) {
  const all = await readCertificates()
  return all.find((record) => record.userId === userId && record.playlistId === playlistId) || null
}

export async function createCertificateOnce(input: Omit<CertificateRecord, "id" | "createdAt">) {
  const all = await readCertificates()
  const existing = all.find(
    (record) => record.userId === input.userId && record.playlistId === input.playlistId
  )
  if (existing) {
    return { created: false as const, certificate: existing }
  }

  const record: CertificateRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  all.unshift(record)
  await writeCertificates(all)
  return { created: true as const, certificate: record }
}
