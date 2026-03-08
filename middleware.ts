import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

const isPublicRoute = (pathname: string) => {
  return pathname === "/" || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const isAuthenticated = Boolean(req.nextauth.token)

    if ((pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) && isAuthenticated) {
      return NextResponse.redirect(new URL("/homepage", req.url))
    }

    if (!isPublicRoute(pathname) && !isAuthenticated) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl
        if (pathname.startsWith("/api/auth")) return true
        if (isPublicRoute(pathname)) return true
        return Boolean(token)
      },
    },
  }
)

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
