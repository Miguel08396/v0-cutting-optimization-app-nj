"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { UserModel } from "./user-model"

export type UserRole = "cortador" | "jefe_ventas" | "asesor_ventas"

export interface User {
  id: string
  nombre: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Usuarios de ejemplo (en producción esto vendría de una base de datos)
const MOCK_USERS = [
  {
    id: "1",
    email: "cortador@cutmetrics.com",
    password: "cortador123",
    nombre: "Juan Pérez",
    role: "cortador" as UserRole,
  },
  {
    id: "2",
    email: "jefe@cutmetrics.com",
    password: "jefe123",
    nombre: "María García",
    role: "jefe_ventas" as UserRole,
  },
  {
    id: "3",
    email: "asesor@cutmetrics.com",
    password: "asesor123",
    nombre: "Carlos Rodríguez",
    role: "asesor_ventas" as UserRole,
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userModel] = useState(() => UserModel.getInstance())

  useEffect(() => {
    // Verificar si hay sesión guardada
    const savedUser = localStorage.getItem("user_session")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = userModel.obtenerUsuarioPorEmail(email)

    console.log("[v0] Intentando login con:", email)
    console.log("[v0] Usuario encontrado:", foundUser)

    if (foundUser && foundUser.password === password) {
      const userData = { id: foundUser.id, nombre: foundUser.nombre, role: foundUser.role }
      setUser(userData)
      localStorage.setItem("user_session", JSON.stringify(userData))
      console.log("[v0] Login exitoso")
      return true
    }
    console.log("[v0] Login fallido")
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user_session")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}
