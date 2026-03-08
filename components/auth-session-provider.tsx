"use client"

import type { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  )
}
