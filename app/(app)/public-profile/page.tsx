"use client"

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PublicProfilePage() {
  const { data: session } = useSession()
  const user = session?.user

  if (!user) return null

  const initials = user.name?.charAt(0) || user.email?.charAt(0) || "U"
  const roleText = user.role === "professor" ? "Professor" : user.role === "student" ? "Student" : "User"

  return (
    <div className="container max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Public profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{roleText}</p>
              {user.roleId ? <p className="text-sm text-muted-foreground">{user.roleId}</p> : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
