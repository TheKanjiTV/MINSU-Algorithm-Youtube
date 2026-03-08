"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { COURSE_CATEGORIES } from "@/lib/course-references"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/library", label: "Library" },
  { href: "/notes", label: "Notes" },
]

const USER_LANGUAGE_KEY = "qm_ui_language"

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fil", label: "Filipino" },
  { value: "es", label: "Español" },
]

const UI_TEXT = {
  en: {
    accountSettings: "Account settings",
    insights: "Insights",
    publicProfile: "Public profile",
    language: "Language",
    adminDashboard: "Admin Dashboard",
    logOut: "Log out",
  },
  fil: {
    accountSettings: "Mga setting ng account",
    insights: "Insights",
    publicProfile: "Public profile",
    language: "Wika",
    adminDashboard: "Admin Dashboard",
    logOut: "Mag log out",
  },
  es: {
    accountSettings: "Configuracion de cuenta",
    insights: "Insights",
    publicProfile: "Perfil publico",
    language: "Idioma",
    adminDashboard: "Panel de Admin",
    logOut: "Cerrar sesion",
  },
} as const

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const [uiLanguage, setUiLanguage] = useState<keyof typeof UI_TEXT>("en")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const submenuInnerRef = useRef<HTMLDivElement | null>(null)
  const activeCategoryData = useMemo(
    () => COURSE_CATEGORIES.find((entry) => entry.label === activeCategory) ?? null,
    [activeCategory]
  )

  const clearCloseTimer = () => {
    if (closeTimerRef.current === null) {
      return
    }
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const scheduleCloseMenu = () => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setActiveCategory(null)
    }, 180)
  }

  const openCategory = (categoryLabel: string) => {
    clearCloseTimer()
    setActiveCategory(categoryLabel)
  }

  useEffect(() => {
    return () => clearCloseTimer()
  }, [])

  useEffect(() => {
    if (pathname === "/search") {
      const params = new URLSearchParams(window.location.search)
      setSearchQuery(params.get("q") || "")
      return
    }
    setSearchQuery("")
  }, [pathname])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(USER_LANGUAGE_KEY)
      if (raw && raw in UI_TEXT) {
        setUiLanguage(raw as keyof typeof UI_TEXT)
      }
    } catch {
      setUiLanguage("en")
    }
  }, [])

  useEffect(() => {
    const resetSubmenuScroll = () => {
      if (!submenuInnerRef.current) return
      const el = submenuInnerRef.current
      if (el.scrollWidth <= el.clientWidth + 2) return
      const doReset = () => {
        try {
          el.scrollTo({ left: 0, behavior: "auto" })
        } catch {
          el.scrollLeft = 0
        }
        const firstItem = el.querySelector("a")
        if (firstItem instanceof HTMLElement) {
          try {
            firstItem.scrollIntoView({ inline: "start", block: "nearest" })
          } catch {
            // ignore scrollIntoView unsupported options
          }
        }
      }
      doReset()
      window.setTimeout(doReset, 60)
      window.setTimeout(doReset, 180)
      window.setTimeout(doReset, 320)
    }

    resetSubmenuScroll()
    window.addEventListener("resize", resetSubmenuScroll)
    window.addEventListener("orientationchange", resetSubmenuScroll)
    window.addEventListener("pageshow", resetSubmenuScroll)
    return () => {
      window.removeEventListener("resize", resetSubmenuScroll)
      window.removeEventListener("orientationchange", resetSubmenuScroll)
      window.removeEventListener("pageshow", resetSubmenuScroll)
    }
  }, [pathname])

  const submitSearch = () => {
    const query = searchQuery.trim()
    if (!query) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const t = UI_TEXT[uiLanguage] ?? UI_TEXT.en

  const handleLanguageChange = (value: string) => {
    const next = (value in UI_TEXT ? value : "en") as keyof typeof UI_TEXT
    setUiLanguage(next)
    try {
      window.localStorage.setItem(USER_LANGUAGE_KEY, next)
    } catch {
      // ignore local storage errors
    }
  }

  if (!user) return null

  const initials = user.name?.charAt(0) || user.email?.charAt(0) || "U"
  const headerName = user.roleId || user.name || "User"
  const idLabel = user.role === "professor" ? "Professor ID" : "Student ID"
  const profileMenuContent = (
    <DropdownMenuContent
      className="w-[280px] max-h-[72vh] overflow-auto rounded-2xl border border-[#d1d5db] bg-[#f3f4f6] p-3 shadow-xl"
      align="end"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-black text-white grid place-items-center text-lg font-semibold">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl leading-6 font-semibold text-[#111827]">{headerName}</p>
          <p className="truncate text-xs text-[#4b5563]">{user.email}</p>
          {user.roleId ? <p className="text-xs text-[#4b5563]">{idLabel}: {user.roleId}</p> : null}
        </div>
      </div>
      <div className="my-3 h-px bg-[#d1d5db]" />

      <div className="space-y-1">
        <Link
          href="/account-settings"
          className="block rounded-md px-2 py-2 text-[15px] leading-6 text-[#111827] transition-all duration-200 hover:translate-x-1 hover:bg-white/70"
        >
          {t.accountSettings}
        </Link>
        <Link
          href="/profile"
          className="block rounded-md px-2 py-2 text-[15px] leading-6 text-[#111827] transition-all duration-200 hover:translate-x-1 hover:bg-white/70"
        >
          {t.insights}
        </Link>
        <Link
          href="/public-profile"
          className="block rounded-md px-2 py-2 text-[15px] leading-6 text-[#111827] transition-all duration-200 hover:translate-x-1 hover:bg-white/70"
        >
          {t.publicProfile}
        </Link>
      </div>

      <div className="my-3 h-px bg-[#d1d5db]" />

      <div className="space-y-1">
        <label
          className="flex items-center justify-between gap-2 rounded-lg border border-[#d1d5db] bg-transparent px-3 py-2 text-[15px] leading-6 text-[#111827]"
        >
          <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#111827]">
            <span className="text-[13px] text-[#6b7280]" aria-hidden="true">🌐</span>
            {t.language}:
          </span>
          <span className="relative inline-flex items-center">
            <select
              value={uiLanguage}
              onChange={(event) => handleLanguageChange(event.target.value)}
              className="h-9 min-w-[132px] appearance-none rounded-md border border-[#cbd5e1] bg-transparent px-3 pr-8 text-[13px] font-medium text-[#1f2937] outline-none transition-colors focus:border-[#9ca3af]"
            >
              {LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 text-[11px] text-[#6b7280]">▾</span>
          </span>
        </label>
        <Link
          href="/admin-dashboard"
          className="block rounded-md px-2 py-2 text-[15px] leading-6 text-[#111827] transition-all duration-200 hover:translate-x-1 hover:bg-white/70"
        >
          {t.adminDashboard}
        </Link>
      </div>

      <div className="my-3 h-px bg-[#d1d5db]" />

      <button
        type="button"
        className="rounded-xl border-2 border-[#4b5563] bg-[#f3f4f6] px-4 py-2 text-[15px] leading-6 text-[#111827] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
      >
        {t.logOut}
      </button>
    </DropdownMenuContent>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-[#ffffff]">
      <div className="mx-auto hidden h-16 w-full items-center gap-3 px-4 md:flex">
        <Link
          href="/homepage"
          className="shrink-0"
          aria-label="Go to homepage"
          onClick={(event) => {
            event.preventDefault()
            if (pathname === "/homepage") {
              router.replace("/homepage")
              return
            }
            router.push("/homepage")
          }}
        >
          <img src="/R.png" alt="Logo" className="h-9 w-9 rounded-md object-contain" />
        </Link>

        <Link
          href="/homepage"
          className={cn(
            "inline-flex h-9 shrink-0 items-center rounded-full border border-[#d1d5db] bg-[#ffffff] px-4 text-sm font-medium text-[#111827] hover:bg-[#f9fafb]",
            pathname === "/homepage" && "border-[#16a34a] text-[#16a34a]"
          )}
        >
          Explore
        </Link>

        <div className="hidden h-11 min-w-[260px] flex-1 items-center rounded-full border border-[#d1d5db] bg-[#ffffff] px-4 md:flex">
          <span className="mr-3 text-sm text-[#6b7280]">⌕</span>
          <input
            type="search"
            placeholder="Search for anything"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              event.preventDefault()
              submitSearch()
            }}
            className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#6b7280]"
          />
          <button
            type="button"
            onClick={submitSearch}
            className="ml-3 rounded-full bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white"
          >
            Search
          </button>
        </div>

        <nav className="ml-auto flex items-center gap-4" aria-label="App links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium text-[#374151] hover:text-[#111827]",
                pathname === link.href && "text-[#111827]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="rounded-full transition-transform duration-200 hover:scale-105">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            {profileMenuContent}
          </DropdownMenu>
        </div>
      </div>

      <div className="mx-auto w-full px-4 py-2 md:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/homepage"
            className="shrink-0"
            aria-label="Go to homepage"
            onClick={(event) => {
              event.preventDefault()
              if (pathname === "/homepage") {
                router.replace("/homepage")
                return
              }
              router.push("/homepage")
            }}
          >
            <img src="/R.png" alt="Logo" className="h-9 w-9 rounded-md object-contain" />
          </Link>

          <Link
            href="/homepage"
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-full border border-[#d1d5db] bg-[#ffffff] px-4 text-sm font-medium text-[#111827] hover:bg-[#f9fafb]",
              pathname === "/homepage" && "border-[#16a34a] text-[#16a34a]"
            )}
          >
            Explore
          </Link>

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-4" aria-label="App links">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 text-sm font-medium text-[#374151] hover:text-[#111827]",
                  pathname === link.href && "text-[#111827]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-full transition-transform duration-200 hover:scale-105">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image || ""} alt={user.name || ""} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              {profileMenuContent}
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-2 flex h-11 w-full items-center rounded-full border border-[#d1d5db] bg-[#ffffff] px-4">
          <span className="mr-3 text-sm text-[#6b7280]">⌕</span>
          <input
            type="search"
            placeholder="Search for anything"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              event.preventDefault()
              submitSearch()
            }}
            className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#6b7280]"
          />
          <button
            type="button"
            onClick={submitSearch}
            className="ml-3 rounded-full bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white"
          >
            Search
          </button>
        </div>
      </div>
      <div className="border-t border-[#e5e7eb] bg-[#ffffff]">
        <div className="global-submenu" onMouseLeave={scheduleCloseMenu} onMouseEnter={clearCloseTimer}>
          <div className="global-submenu__inner" ref={submenuInnerRef}>
            {COURSE_CATEGORIES.map((entry) => (
              <Link
                key={entry.slug}
                href={`/courses/${entry.slug}/${entry.topics[0]!.slug}`}
                className={cn(
                  "global-submenu__item",
                  activeCategory === entry.label ? "global-submenu__item--active" : ""
                )}
                onMouseEnter={() => openCategory(entry.label)}
                onFocus={() => openCategory(entry.label)}
              >
                {entry.label}
              </Link>
            ))}
          </div>
          {activeCategoryData ? (
            <div className="global-submenu__panel">
              <div className="global-submenu__panelInner">
                {activeCategoryData.topics.map((item) => (
                  <Link
                    key={`${activeCategoryData.slug}-${item.slug}`}
                    href={`/courses/${activeCategoryData.slug}/${item.slug}`}
                    className="global-submenu__link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
