import { Header } from "@/components/header"
import type { ReactNode } from "react"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-7rem)]">{children}</main>
    </>
  )
}
