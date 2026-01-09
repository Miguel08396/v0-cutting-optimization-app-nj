"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

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
      const supabase = createClient()

      const { data: foundUser, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email)
        .eq("activo", true)
        .single()

      console.log("[v0] Intentando login con:", email)
      console.log("[v0] Usuario encontrado:", foundUser)

      if (error || !foundUser) {
        console.log("[v0] Login fallido - usuario no encontrado")
        return false
      }

      if (foundUser.password !== password) {
        console.log("[v0] Login fallido - contraseña incorrecta")
        return false
      }

      const userData: User = {
        id: foundUser.id,
        nombre: foundUser.nombre,
        role: foundUser.role,
        es_baseline: foundUser.es_baseline,
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
