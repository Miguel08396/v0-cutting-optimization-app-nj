"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  Users,
  Clock,
  Target,
  AlertCircle,
  UserPlus,
  Trash2,
  FileText,
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useRealtimeNotas, useRealtimeDashboard } from "@/lib/hooks/use-realtime"
import { registerUser, getAllUsers, deactivateUser } from "@/lib/services/auth-service"
import type { Usuario, NotaPedido } from "@/lib/supabase/types"

const COLORS = ["#FFEB3B", "#1E1E1E", "#FDD835", "#424242", "#FFEE58"]

export function JefeVentasView() {
  const [notasPedidoData, setNotasPedidoData] = useState<NotaPedido[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "cortador" as "cortador" | "jefe_ventas" | "asesor_ventas",
  })

  const [busquedaNP, setBusquedaNP] = useState("")

  const { notas, displayConnected, refreshNotas, usePolling } = useRealtimeNotas(notasPedidoData)
  const { lastUpdate, isConnected: dashboardConnected } = useRealtimeDashboard()

  // Cargar datos iniciales desde Supabase
  const cargarDatos = useCallback(async () => {
    const supabase = createClient()

    const [notasRes, usuariosRes] = await Promise.all([
      supabase.from("notas_pedido").select("*").order("fecha_creacion", { ascending: false }),
      getAllUsers(),
    ])

    if (notasRes.data) {
      setNotasPedidoData(notasRes.data as NotaPedido[])
      refreshNotas(notasRes.data as NotaPedido[])
    }

    setUsuarios(usuariosRes)
    setIsLoading(false)
  }, [refreshNotas])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  useEffect(() => {
    if (usePolling) {
      const interval = setInterval(() => {
        cargarDatos()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [usePolling, cargarDatos])

  // Recargar cuando haya actualizaciones realtime
  useEffect(() => {
    if (lastUpdate) {
      cargarDatos()
    }
  }, [lastUpdate, cargarDatos])

  // Usar notas del hook realtime
  const notasPedido = notas.length > 0 ? notas : notasPedidoData

  const handleCrearUsuario = async () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password) {
      alert("Por favor complete todos los campos")
      return
    }

    const result = await registerUser(nuevoUsuario.nombre, nuevoUsuario.email, nuevoUsuario.password, nuevoUsuario.role)

    if (!result.success) {
      alert(result.error || "Error al crear usuario")
      return
    }

    setUsuarios(await getAllUsers())
    setNuevoUsuario({ nombre: "", email: "", password: "", role: "cortador" })
    alert(`Usuario ${nuevoUsuario.nombre} creado exitosamente`)
  }

  const handleEliminarUsuario = async (id: string) => {
    if (confirm("¿Está seguro de eliminar este usuario?")) {
      await deactivateUser(id)
      setUsuarios(await getAllUsers())
    }
  }

  // Cálculos de métricas usando los datos de Supabase
  const cortesHoy = notasPedido.filter((np) => {
    const hoy = new Date()
    const fechaProceso = np.fecha_inicio_proceso ? new Date(np.fecha_inicio_proceso) : null
    return (
      fechaProceso &&
      fechaProceso.getDate() === hoy.getDate() &&
      fechaProceso.getMonth() === hoy.getMonth() &&
      fechaProceso.getFullYear() === hoy.getFullYear()
    )
  })

  const cortesCompletados = notasPedido.filter((np) => np.estado === "completado" || np.estado === "cerrado")

  const tiempoPromedio =
    cortesCompletados.length > 0
      ? cortesCompletados.reduce((acc, np) => {
          const tiempoTotal =
            (np.tiempo_corte || 0) + (np.tiempo_enchape_rigido || 0) + (np.tiempo_enchape_flexible || 0)
          return acc + tiempoTotal
        }, 0) /
        cortesCompletados.length /
        60
      : 0

  const tiempoPausadoPromedio =
    cortesCompletados.length > 0
      ? cortesCompletados.reduce((acc, np) => {
          return acc + (np.tiempo_pausado_corte || 0) + (np.tiempo_pausado_enchape || 0)
        }, 0) /
        cortesCompletados.length /
        60
      : 0

  const npsPendientes = notasPedido.filter(
    (np) => np.estado === "pendiente" || np.estado === "en_corte" || np.estado === "en_enchape",
  )
  const npsCompletadas = notasPedido.filter((np) => np.estado === "completado" || np.estado === "cerrado")

  const cortadoresMap = new Map<
    string,
    { nombre: string; cortes: number; tiempoPromedio: number; tiempoPausado: number }
  >()
  notasPedido.forEach((np) => {
    if (np.cortador_nombre && (np.estado === "completado" || np.estado === "cerrado")) {
      const existente = cortadoresMap.get(np.cortador_nombre) || {
        nombre: np.cortador_nombre,
        cortes: 0,
        tiempoPromedio: 0,
        tiempoPausado: 0,
      }
      existente.cortes += 1
      const tiempoTotal = (np.tiempo_corte || 0) + (np.tiempo_enchape_rigido || 0) + (np.tiempo_enchape_flexible || 0)
      existente.tiempoPromedio += tiempoTotal
      existente.tiempoPausado += (np.tiempo_pausado_corte || 0) + (np.tiempo_pausado_enchape || 0)
      cortadoresMap.set(np.cortador_nombre, existente)
    }
  })

  const rendimientoCortadores = Array.from(cortadoresMap.values()).map((c) => ({
    nombre: c.nombre,
    cortes: c.cortes,
    tiempoPromedio: c.cortes > 0 ? Math.round(c.tiempoPromedio / c.cortes / 60) : 0,
    tiempoPausado: c.cortes > 0 ? Math.round(c.tiempoPausado / c.cortes / 60) : 0,
  }))

  const distribucionMaquinas = [
    {
      name: "Sierra Striebig",
      value: notasPedido.filter((np) => np.corte_completado).length,
    },
    {
      name: "Enchapadora Fravol",
      value: notasPedido.filter((np) => np.enchape_completado).length,
    },
  ]

  const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - (6 - i))
    const npsDia = notasPedido.filter((np) => {
      const fechaProceso = np.fecha_inicio_proceso ? new Date(np.fecha_inicio_proceso) : null
      return (
        fechaProceso &&
        fechaProceso.getDate() === fecha.getDate() &&
        fechaProceso.getMonth() === fecha.getMonth() &&
        fechaProceso.getFullYear() === fecha.getFullYear()
      )
    })
    return {
      fecha: fecha.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      cortes: npsDia.length,
      completados: npsDia.filter((np) => np.estado === "completado" || np.estado === "cerrado").length,
    }
  })

  const notasConPlanos = notasPedido.filter((np) => {
    if (busquedaNP.trim()) {
      return np.numero.toLowerCase().includes(busquedaNP.toLowerCase()) && np.archivos_ped && np.archivos_ped.length > 0
    }
    return np.archivos_ped && np.archivos_ped.length > 0
  })

  const descargarPlano = (archivo: { nombre: string; url: string; fechaSubida?: string }) => {
    try {
      const link = document.createElement("a")
      link.href = archivo.url
      link.download = archivo.nombre
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al descargar plano:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Panel del Jefe de Ventas</h2>
          <p className="text-muted-foreground">Vista general del rendimiento del centro de corte</p>
        </div>
        <div className="flex items-center gap-2">
          {displayConnected || dashboardConnected ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              {usePolling ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Auto-refresh
                </>
              ) : (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  En vivo
                </>
              )}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground border-muted">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={cargarDatos}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cortes Hoy</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{cortesHoy.length}</div>
            <p className="text-xs text-muted-foreground">{cortesCompletados.length} total completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(tiempoPromedio)} min</div>
            <p className="text-xs text-muted-foreground">Por trabajo completado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Pausado</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{Math.round(tiempoPausadoPromedio)} min</div>
            <p className="text-xs text-muted-foreground">Promedio por trabajo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPs Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{npsPendientes.length}</div>
            <p className="text-xs text-muted-foreground">{npsCompletadas.length} completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cortadores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cortadoresMap.size}</div>
            <p className="text-xs text-muted-foreground">Personal registrado</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas y análisis */}
      <Tabs defaultValue="rendimiento" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rendimiento">Rendimiento</TabsTrigger>
          <TabsTrigger value="maquinas">Máquinas</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          <TabsTrigger value="notasterminadas">Notas Terminadas</TabsTrigger>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="rendimiento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Cortador</CardTitle>
              <CardDescription>Comparación de cortes realizados y tiempo promedio</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {rendimientoCortadores.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rendimientoCortadores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="nombre" stroke="hsl(var(--foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar dataKey="cortes" fill="#FFEB3B" name="Cortes Completados" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No hay datos de rendimiento disponibles
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiempo Pausado por Cortador</CardTitle>
              <CardDescription>Minutos de pausa promedio por trabajo</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {rendimientoCortadores.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rendimientoCortadores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--foreground))" fontSize={12} />
                    <YAxis dataKey="nombre" type="category" stroke="hsl(var(--foreground))" fontSize={12} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar dataKey="tiempoPromedio" fill="#1E1E1E" name="Tiempo Activo (min)" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="tiempoPausado" fill="#FFA726" name="Tiempo Pausado (min)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maquinas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Uso de Máquinas</CardTitle>
              <CardDescription>Porcentaje de trabajos por tipo de máquina</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {distribucionMaquinas.some((m) => m.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionMaquinas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribucionMaquinas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#FFEB3B" : "#1E1E1E"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No hay datos de máquinas disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tendencias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Productividad</CardTitle>
              <CardDescription>Cortes iniciados y completados en los últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ultimos7Dias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="fecha" stroke="hsl(var(--foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--foreground))",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cortes"
                    stroke="#FFEB3B"
                    strokeWidth={3}
                    dot={{ fill: "#FFEB3B", r: 5 }}
                    activeDot={{ r: 8 }}
                    name="Iniciados"
                  />
                  <Line
                    type="monotone"
                    dataKey="completados"
                    stroke="#4CAF50"
                    strokeWidth={3}
                    dot={{ fill: "#4CAF50", r: 5 }}
                    name="Completados"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notasterminadas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas de Pedido Terminadas</CardTitle>
              <CardDescription>
                Detalles de tiempos por nota - Promedio:{" "}
                {cortesCompletados.length > 0
                  ? `${Math.round(cortesCompletados.reduce((acc, np) => acc + (np.cantidad_laminas || 1), 0) / cortesCompletados.length)} láminas/nota, ${Math.round(
                      cortesCompletados.reduce((acc, np) => {
                        const tiempoTotal =
                          (np.tiempo_corte || 0) + (np.tiempo_enchape_rigido || 0) + (np.tiempo_enchape_flexible || 0)
                        return acc + tiempoTotal / (np.cantidad_laminas || 1)
                      }, 0) /
                        cortesCompletados.length /
                        60,
                    )} min/lámina`
                  : "Sin datos"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">NP</th>
                      <th className="text-left p-2 font-medium">Cliente</th>
                      <th className="text-left p-2 font-medium">Cortador</th>
                      <th className="text-right p-2 font-medium">Láminas</th>
                      <th className="text-right p-2 font-medium">T. Corte</th>
                      <th className="text-right p-2 font-medium">T. Enchape</th>
                      <th className="text-right p-2 font-medium">T. Pausado</th>
                      <th className="text-right p-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cortesCompletados.slice(0, 20).map((np) => {
                      const tiempoTotal =
                        (np.tiempo_corte || 0) + (np.tiempo_enchape_rigido || 0) + (np.tiempo_enchape_flexible || 0)
                      const tiempoPausado = (np.tiempo_pausado_corte || 0) + (np.tiempo_pausado_enchape || 0)
                      return (
                        <tr key={np.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-sm">{np.numero}</td>
                          <td className="p-2 text-sm">{np.cliente}</td>
                          <td className="p-2 text-sm">{np.cortador_nombre || "-"}</td>
                          <td className="p-2 text-right text-sm">{np.cantidad_laminas || 1}</td>
                          <td className="p-2 text-right text-sm">{Math.round((np.tiempo_corte || 0) / 60)} min</td>
                          <td className="p-2 text-right text-sm">
                            {Math.round(((np.tiempo_enchape_rigido || 0) + (np.tiempo_enchape_flexible || 0)) / 60)} min
                          </td>
                          <td className="p-2 text-right text-sm text-yellow-600">
                            {Math.round(tiempoPausado / 60)} min
                          </td>
                          <td className="p-2 text-right text-sm font-medium">{Math.round(tiempoTotal / 60)} min</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {cortesCompletados.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">No hay notas completadas</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Planos de Notas de Pedido
              </CardTitle>
              <CardDescription>Visualización y descarga de archivos .ped subidos por los asesores</CardDescription>
              <div className="mt-4">
                <Input
                  placeholder="Buscar por número de NP..."
                  value={busquedaNP}
                  onChange={(e) => setBusquedaNP(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notasConPlanos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {busquedaNP ? "No se encontraron planos con ese número de NP" : "No hay planos cargados aún"}
                  </div>
                ) : (
                  notasConPlanos.map((np) => (
                    <div key={np.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-mono font-bold text-primary">{np.numero}</span>
                          <span className="mx-2">-</span>
                          <span>{np.cliente}</span>
                        </div>
                        <Badge
                          variant={np.estado === "completado" || np.estado === "cerrado" ? "default" : "secondary"}
                        >
                          {np.estado}
                        </Badge>
                      </div>
                      <div className="grid gap-2">
                        {np.archivos_ped?.map((archivo, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted/50 rounded p-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{archivo.nombre}</span>
                              {archivo.fechaSubida && (
                                <span className="text-xs text-muted-foreground">
                                  ({format(new Date(archivo.fechaSubida), "dd/MM/yyyy HH:mm")})
                                </span>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => descargarPlano(archivo)}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Descargar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Crear Nuevo Usuario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    value={nuevoUsuario.nombre}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={nuevoUsuario.email}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                    placeholder="Ej: juan@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={nuevoUsuario.password}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={nuevoUsuario.role}
                    onValueChange={(value: "cortador" | "jefe_ventas" | "asesor_ventas") =>
                      setNuevoUsuario({ ...nuevoUsuario, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cortador">Cortador</SelectItem>
                      <SelectItem value="asesor_ventas">Asesor de Ventas</SelectItem>
                      <SelectItem value="jefe_ventas">Jefe de Ventas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCrearUsuario} className="w-full">
                  Crear Usuario
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usuarios Registrados</CardTitle>
                <CardDescription>Lista de usuarios activos en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-auto">
                  {usuarios.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{u.nombre}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {u.role === "cortador"
                            ? "Cortador"
                            : u.role === "jefe_ventas"
                              ? "Jefe de Ventas"
                              : "Asesor de Ventas"}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleEliminarUsuario(u.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {usuarios.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">No hay usuarios registrados</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
