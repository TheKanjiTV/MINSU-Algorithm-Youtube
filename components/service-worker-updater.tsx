"use client"

import { useEffect, useRef, useState } from "react"

export function ServiceWorkerUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [showUpdate, setShowUpdate] = useState(false)
  const refreshing = useRef(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const enableSW = process.env.NEXT_PUBLIC_ENABLE_SW === "true"
    const enableInDev = process.env.NEXT_PUBLIC_ENABLE_SW_DEV === "true"
    const isProduction = process.env.NODE_ENV === "production"

    if (!enableSW || (!isProduction && !enableInDev)) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister()
        })
      })
      if ("caches" in window) {
        void caches.keys().then((keys) => {
          keys
            .filter((key) => key.startsWith("ytlearn-sw-"))
            .forEach((key) => {
              void caches.delete(key)
            })
        })
      }
      return
    }

    const onControllerChange = () => {
      if (refreshing.current) return
      refreshing.current = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
          setShowUpdate(true)
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing
          if (!installing) return

          installing.addEventListener("statechange", () => {
            if (installing.state !== "installed") return
            if (!navigator.serviceWorker.controller) return
            setWaitingWorker(registration.waiting || installing)
            setShowUpdate(true)
          })
        })
      })
      .catch(() => {
        // SW registration should not block the app.
      })

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [])

  const onUpdateNow = () => {
    if (!waitingWorker) return
    waitingWorker.postMessage({ type: "SKIP_WAITING" })
  }

  if (!showUpdate) return null

  return (
    <div className="fixed bottom-4 right-4 z-[200] max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
      <p className="mb-1 text-sm font-semibold text-gray-900">Update available</p>
      <p className="mb-3 text-xs text-gray-600">A new app version is ready.</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white"
          onClick={onUpdateNow}
        >
          Update
        </button>
        <button
          type="button"
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700"
          onClick={() => setShowUpdate(false)}
        >
          Later
        </button>
      </div>
    </div>
  )
}
