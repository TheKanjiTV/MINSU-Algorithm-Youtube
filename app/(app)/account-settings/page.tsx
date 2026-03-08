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

  const roleLabel = user.role === "professor" ? "Professor" : user.role === "student" ? "Student" : "User"
  const isAdmin = user.role === "admin"

  return (
    <div className="container max-w-3xl px-4 py-6 space-y-4">
      <section className="rounded-2xl border bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Account</p>
        <h1 className="text-2xl font-bold mt-1">Account settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your identity and review role access.</p>
      </section>

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
            <p className="font-medium">{isAdmin ? "Admin" : roleLabel}</p>
          </div>
          {user.roleId ? (
            <div>
              <p className="text-muted-foreground">{roleLabel} ID</p>
              <p className="font-medium">{user.roleId}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Password reset is available from the sign-in screen via <span className="font-medium">Forgot password</span>.
        </CardContent>
      </Card>
    </div>
  )
}
