"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, User, Layers } from "lucide-react"

const historialData = [
  {
    id: 1,
    cortador: "Juan Pérez",
    maquina: "Striebig",
    piezas: 24,
    tiempo: "58:32",
    fecha: "2025-01-15 14:23",
    eficiencia: 95,
  },
  {
    id: 2,
    cortador: "María González",
    maquina: "Striebig",
    piezas: 18,
    tiempo: "45:18",
    fecha: "2025-01-15 13:45",
    eficiencia: 92,
  },
  {
    id: 3,
    cortador: "Juan Pérez",
    maquina: "Fravol",
    piezas: 32,
    tiempo: "72:15",
    fecha: "2025-01-15 11:30",
    eficiencia: 88,
  },
  {
    id: 4,
    cortador: "Carlos Ruiz",
    maquina: "Striebig",
    piezas: 15,
    tiempo: "38:42",
    fecha: "2025-01-15 10:15",
    eficiencia: 97,
  },
  {
    id: 5,
    cortador: "María González",
    maquina: "Striebig",
    piezas: 21,
    tiempo: "52:08",
    fecha: "2025-01-15 09:00",
    eficiencia: 93,
  },
]

export function HistorialView() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Historial de Trabajos</CardTitle>
        <CardDescription className="text-muted-foreground">Registro completo de cortes realizados</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {historialData.map((trabajo) => (
              <div
                key={trabajo.id}
                className="rounded-lg border border-border bg-background p-4 space-y-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{trabajo.cortador}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{trabajo.fecha}</p>
                  </div>
                  <Badge
                    variant={trabajo.eficiencia >= 95 ? "default" : "secondary"}
                    className={trabajo.eficiencia >= 95 ? "bg-accent text-accent-foreground" : ""}
                  >
                    {trabajo.eficiencia}% eficiencia
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Layers className="h-3 w-3" />
                      Piezas
                    </div>
                    <p className="text-lg font-semibold text-foreground">{trabajo.piezas}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Tiempo
                    </div>
                    <p className="text-lg font-semibold text-foreground">{trabajo.tiempo}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Máquina</p>
                    <p className="text-sm font-medium text-foreground">{trabajo.maquina}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
