"use client"

import * as React from "react"

import { PRINCIPALS, ROLES } from "@/lib/mock/identity"
import type { ApproverAuthority, Principal, Role, RoleId } from "@/lib/mock/types"

// MOCK auth only — no backend, no Authentik. A header role switcher changes the
// signed-in principal so the console can be exercised as different roles. Real
// Auth.js + Authentik OIDC slots in here later without touching consumers.
//
// The current principal lives in a tiny external store read via
// useSyncExternalStore so it survives navigation, persists to localStorage, and
// hydrates cleanly (server snapshot = default) without effect-driven setState.

const STORAGE_KEY = "gspe-os.principalId"
const DEFAULT_ID = "u-dewi" // Director — sees everything by default for the demo.

let currentId = DEFAULT_ID
let hydrated = false
const listeners = new Set<() => void>()

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return
  hydrated = true
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && PRINCIPALS.some((p) => p.id === stored)) currentId = stored
}

function subscribe(cb: () => void) {
  ensureHydrated()
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  ensureHydrated()
  return currentId
}

function getServerSnapshot() {
  return DEFAULT_ID
}

function setCurrentId(id: string) {
  currentId = id
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id)
  listeners.forEach((l) => l())
}

interface AuthValue {
  principal: Principal
  roles: Role[]
  authorities: ApproverAuthority[]
  roleIds: RoleId[]
  setPrincipalId: (id: string) => void
  hasAuthority: (authority: ApproverAuthority) => boolean
  hasRole: (...ids: RoleId[]) => boolean
}

const AuthContext = React.createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const principalId = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  const value = React.useMemo<AuthValue>(() => {
    const principal =
      PRINCIPALS.find((p) => p.id === principalId) ?? PRINCIPALS[0]
    const roles = principal.roleIds.map((id) => ROLES[id])
    const authorities = Array.from(new Set(roles.flatMap((r) => r.authorities)))
    return {
      principal,
      roles,
      authorities,
      roleIds: principal.roleIds,
      setPrincipalId: setCurrentId,
      hasAuthority: (a) => authorities.includes(a),
      hasRole: (...ids) => ids.some((id) => principal.roleIds.includes(id)),
    }
  }, [principalId])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
