"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { loginUser } from "@/lib/services/auth-service"

export type UserRole = "cortador" | "jefe_ventas" | "asesor_ventas"

export interface User {
  id: string
  nombre: string
  role: UserRole
  es_baseline?: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay sesión guardada
    const savedUser = localStorage.getItem("user_session")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("[v0] Intentando login con:", email)

      const result = await loginUser(email, password)

      if (!result.success || !result.user) {
        console.log("[v0] Login fallido:", result.error)
        return false
      }

      const userData: User = {
        id: result.user.id,
        nombre: result.user.nombre,
        role: result.user.role as UserRole,
        es_baseline: result.user.es_baseline,
      }

      setUser(userData)
      localStorage.setItem("user_session", JSON.stringify(userData))
      console.log("[v0] Login exitoso")
      return true
    } catch (err) {
      console.error("[v0] Error en login:", err)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user_session")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}
