"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const cortadoresData = [
  { nombre: "Juan Pérez", cortes: 145, promedio: 162 },
  { nombre: "María González", cortes: 132, promedio: 168 },
  { nombre: "Carlos Ruiz", cortes: 128, promedio: 159 },
  { nombre: "Ana Martínez", cortes: 118, promedio: 175 },
]

const maquinasData = [
  { nombre: "Striebig", value: 68, color: "#3B82F6" },
  { nombre: "Fravol", value: 32, color: "#10B981" },
]

const tendenciaData = [
  { semana: "S1", eficiencia: 88, cortes: 520 },
  { semana: "S2", eficiencia: 90, cortes: 548 },
  { semana: "S3", eficiencia: 89, cortes: 535 },
  { semana: "S4", eficiencia: 92, cortes: 582 },
  { semana: "S5", eficiencia: 94, cortes: 601 },
]

export function EstadisticasView() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="cortadores" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="cortadores">Cortadores</TabsTrigger>
          <TabsTrigger value="maquinas">Máquinas</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="cortadores" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Rendimiento por Cortador</CardTitle>
              <CardDescription className="text-muted-foreground">
                Comparación de productividad del equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cortadoresData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="nombre" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="cortes" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Cortes realizados" />
                  <Bar dataKey="promedio" fill="#F59E0B" radius={[8, 8, 0, 0]} name="Tiempo promedio (seg)" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {cortadoresData.map((cortador, index) => (
                  <div key={index} className="rounded-lg border border-border bg-background p-4">
                    <h4 className="font-semibold text-foreground mb-2">{cortador.nombre}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total cortes:</span>
                        <span className="font-medium text-foreground">{cortador.cortes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tiempo promedio:</span>
                        <span className="font-medium text-foreground">{cortador.promedio}s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maquinas" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Uso de Máquinas</CardTitle>
              <CardDescription className="text-muted-foreground">Distribución de trabajos por equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={maquinasData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nombre, value }) => `${nombre}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {maquinasData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col justify-center space-y-4">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: "#3B82F6" }} />
                      <h4 className="font-semibold text-foreground">Sierra Striebig</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uso:</span>
                        <span className="font-medium text-foreground">68%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cortes esta semana:</span>
                        <span className="font-medium text-foreground">412</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: "#10B981" }} />
                      <h4 className="font-semibold text-foreground">Enchapadora Fravol</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uso:</span>
                        <span className="font-medium text-foreground">32%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cortes esta semana:</span>
                        <span className="font-medium text-foreground">189</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tendencias" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Tendencias de Productividad</CardTitle>
              <CardDescription className="text-muted-foreground">Evolución de eficiencia y volumen</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={tendenciaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="semana" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="eficiencia"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: "#10B981", r: 5 }}
                    name="Eficiencia (%)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cortes"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", r: 5 }}
                    name="Total cortes"
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground mb-1">Mejor semana</p>
                  <p className="text-2xl font-bold text-foreground">S5</p>
                  <p className="text-sm text-accent mt-1">601 cortes</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground mb-1">Eficiencia pico</p>
                  <p className="text-2xl font-bold text-foreground">94%</p>
                  <p className="text-sm text-accent mt-1">+6% vs inicio</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground mb-1">Crecimiento</p>
                  <p className="text-2xl font-bold text-foreground">+15.6%</p>
                  <p className="text-sm text-accent mt-1">Últimas 5 semanas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
