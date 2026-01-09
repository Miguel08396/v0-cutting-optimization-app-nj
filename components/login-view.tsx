"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export function LoginView() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [intentosFallidos, setIntentosFallidos] = useState(0)
  const [bloqueado, setBloqueado] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (bloqueado) {
      setError("Demasiados intentos fallidos. Recarga la página para intentar de nuevo.")
      return
    }

    setError("")
    setLoading(true)

    const success = await login(email, password)

    if (!success) {
      const nuevosIntentos = intentosFallidos + 1
      setIntentosFallidos(nuevosIntentos)

      if (nuevosIntentos >= 3) {
        setBloqueado(true)
        setError("Demasiados intentos fallidos. Recarga la página para intentar de nuevo.")
      } else {
        const intentosRestantes = 3 - nuevosIntentos
        setError(
          `Credenciales incorrectas. Te quedan ${intentosRestantes} ${intentosRestantes === 1 ? "intento" : "intentos"}.`,
        )
      }
    } else {
      setIntentosFallidos(0)
      setBloqueado(false)
      setEmail("")
      setPassword("")
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto">
            <Image
              src="/logo-centro-corte.jpg"
              alt="Centro de Corte Mosquera"
              width={120}
              height={120}
              className="rounded-lg mx-auto"
            />
          </div>
          <div>
            <CardTitle className="text-2xl">CENTRO DE CORTE MOSQUERA</CardTitle>
            <CardDescription>Homecenter - Sistema de Gestión y Rendimiento</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@mosquera.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={bloqueado}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={bloqueado}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading || bloqueado}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              © 2025 Miguel Angel Pardo - Centro de Corte Mosquera
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
