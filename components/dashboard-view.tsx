"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, TrendingUp, Scissors, AlertCircle } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Datos de ejemplo
const rendimientoData = [
  { hora: "08:00", cortes: 12, tiempo: 180 },
  { hora: "09:00", cortes: 15, tiempo: 165 },
  { hora: "10:00", cortes: 18, tiempo: 155 },
  { hora: "11:00", cortes: 14, tiempo: 170 },
  { hora: "12:00", cortes: 10, tiempo: 190 },
  { hora: "14:00", cortes: 16, tiempo: 160 },
  { hora: "15:00", cortes: 19, tiempo: 148 },
  { hora: "16:00", cortes: 17, tiempo: 158 },
]

const tiempoPromedioData = [
  { dia: "Lun", promedio: 165 },
  { dia: "Mar", promedio: 158 },
  { dia: "Mié", promedio: 172 },
  { dia: "Jue", promedio: 163 },
  { dia: "Vie", promedio: 155 },
]

export function DashboardView() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Cortes Hoy</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">121</div>
            <p className="text-xs text-accent flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12% vs ayer
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">2:43 min</div>
            <p className="text-xs text-accent flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              -8% más rápido
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Eficiencia</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">94.2%</div>
            <p className="text-xs text-accent flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +3.1% esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Tiempo Activo</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">6.5 hrs</div>
            <p className="text-xs text-muted-foreground mt-1">de 8 hrs totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas principales */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Rendimiento por Hora</CardTitle>
            <CardDescription className="text-muted-foreground">Cortes completados cada hora</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={rendimientoData}>
                <defs>
                  <linearGradient id="colorCortes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hora" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cortes"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorCortes)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Tiempo Promedio Semanal</CardTitle>
            <CardDescription className="text-muted-foreground">Segundos por corte</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tiempoPromedioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Bar dataKey="promedio" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
