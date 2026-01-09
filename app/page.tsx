"use client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginView } from "@/components/login-view"
import { CortadorView } from "@/components/cortador-view"
import { JefeVentasView } from "@/components/jefe-ventas-view"
import { AsesorVentasView } from "@/components/asesor-ventas-view"
import { useState } from "react"
import { PrivacyPolicy } from "@/components/privacy-policy"
import Image from "next/image"

function AppContent() {
  const { user, logout, isAuthenticated } = useAuth()
  const [showPrivacy, setShowPrivacy] = useState(false)

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <PrivacyPolicy open={showPrivacy} onOpenChange={setShowPrivacy} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-centro-corte.jpg"
                alt="Centro de Corte Mosquera"
                width={60}
                height={60}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">CENTRO DE CORTE MOSQUERA</h1>
                <p className="text-xs text-muted-foreground">Homecenter - Sistema de Gestión y Rendimiento</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.nombre}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role.replace("_", " ")}</p>
              </div>
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1">
        {user?.role === "cortador" && <CortadorView />}
        {user?.role === "jefe_ventas" && <JefeVentasView />}
        {user?.role === "asesor_ventas" && <AsesorVentasView />}
      </main>

      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Centro de Corte Mosquera - Homecenter</p>
          <p className="text-xs mt-1">Desarrollado por Miguel Angel Pardo. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
