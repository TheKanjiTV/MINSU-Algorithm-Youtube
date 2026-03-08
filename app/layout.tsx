import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthSessionProvider } from "@/components/auth-session-provider"
import { ServiceWorkerUpdater } from "@/components/service-worker-updater"
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "YTLearn - Learn from YouTube, without distractions",
  description: "Save YouTube playlists, track progress, take notes, and learn distraction-free",
  icons: {
    icon: "/R.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
            {children}
            <ServiceWorkerUpdater />
            <Analytics />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
