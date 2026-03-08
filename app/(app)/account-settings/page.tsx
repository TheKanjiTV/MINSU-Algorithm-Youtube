import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authOptions } from "@/lib/auth-options"
import { AccountDisplayNameEditor } from "@/components/account-display-name-editor"

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user

  if (!user) {
    redirect("/sign-in")
  }

  const roleLabel = user.role === "professor" ? "Professor" : "Student"

  return (
    <div className="container max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Account settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <AccountDisplayNameEditor initialName={user.name || "User"} />
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p className="font-medium">{roleLabel}</p>
          </div>
          {user.roleId ? (
            <div>
              <p className="text-muted-foreground">{roleLabel} ID</p>
              <p className="font-medium">{user.roleId}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
