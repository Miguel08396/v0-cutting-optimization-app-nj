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
import { Users, Clock, Target, AlertCircle, UserPlus, Trash2, FileText, Download, Wifi, WifiOff } from "lucide-react"
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

  const { notas, isConnected, refreshNotas } = useRealtimeNotas(notasPedidoData)
  const { lastUpdate } = useRealtimeDashboard()

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
      console.error("[v0] Error al descargar plano:", error)
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
          {isConnected ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <Wifi className="h-3 w-3 mr-1" />
              En vivo
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              <WifiOff className="h-3 w-3 mr-1" />
              Reconectando...
            </Badge>
          )}
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
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {cortesCompletados.length > 0 ? (
                  cortesCompletados.map((np) => {
                    const tiempoCorteMin = np.tiempo_corte ? Math.floor(np.tiempo_corte / 60) : 0
                    const tiempoCorteSegs = np.tiempo_corte ? np.tiempo_corte % 60 : 0
                    const tiempoEnchapeRigidoMin = np.tiempo_enchape_rigido
                      ? Math.floor(np.tiempo_enchape_rigido / 60)
                      : 0
                    const tiempoEnchapeRigidoSegs = np.tiempo_enchape_rigido ? np.tiempo_enchape_rigido % 60 : 0
                    const tiempoEnchapeFlexibleMin = np.tiempo_enchape_flexible
                      ? Math.floor(np.tiempo_enchape_flexible / 60)
                      : 0
                    const tiempoEnchapeFlexibleSegs = np.tiempo_enchape_flexible ? np.tiempo_enchape_flexible % 60 : 0
                    const tiempoTotal =
                      (np.tiempo_corte || 0) + (np.tiempo_enchape_rigido || 0) + (np.tiempo_enchape_flexible || 0)
                    const tiempoTotalMin = Math.floor(tiempoTotal / 60)
                    const tiempoTotalSegs = tiempoTotal % 60
                    const promedioPorLamina =
                      np.cantidad_laminas > 0 ? Math.round(tiempoTotal / np.cantidad_laminas / 60) : 0

                    const tiempoPausadoTotal = (np.tiempo_pausado_corte || 0) + (np.tiempo_pausado_enchape || 0)
                    const tiempoPausadoMin = Math.floor(tiempoPausadoTotal / 60)
                    const tiempoPausadoSegs = tiempoPausadoTotal % 60

                    return (
                      <Card key={np.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                  {np.estado === "cerrado" ? "Cerrado" : "Completado"}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">NP: {np.numero}</p>
                              <p className="text-xs text-muted-foreground">Asesor: {np.asesor_nombre}</p>
                              <p className="text-xs text-muted-foreground">Cortador: {np.cortador_nombre || "N/A"}</p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Material y Cantidad</p>
                              <p className="text-sm font-medium">{np.cantidad_laminas} láminas</p>
                              <p className="text-xs">{np.tipo_material?.toUpperCase()}</p>
                              {np.lleva_canto && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {(np.canto_rigido || 0) > 0 && <div>Rígido: {np.canto_rigido}m</div>}
                                  {(np.canto_flexible || 0) > 0 && <div>Flexible: {np.canto_flexible}m</div>}
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Tiempos Detallados</p>
                              {(np.tiempo_corte || 0) > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium">Corte:</span> {tiempoCorteMin}:
                                  {tiempoCorteSegs.toString().padStart(2, "0")} min
                                </div>
                              )}
                              {(np.tiempo_enchape_rigido || 0) > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium">Enchape Rígido:</span> {tiempoEnchapeRigidoMin}:
                                  {tiempoEnchapeRigidoSegs.toString().padStart(2, "0")} min
                                </div>
                              )}
                              {(np.tiempo_enchape_flexible || 0) > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium">Enchape Flexible:</span> {tiempoEnchapeFlexibleMin}:
                                  {tiempoEnchapeFlexibleSegs.toString().padStart(2, "0")} min
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Tiempo Pausado</p>
                              <p className="text-lg font-bold text-yellow-600">
                                {tiempoPausadoMin}:{tiempoPausadoSegs.toString().padStart(2, "0")}
                              </p>
                              <p className="text-xs text-muted-foreground">minutos</p>
                            </div>

                            <div className="flex flex-col justify-center">
                              <div className="text-center p-3 bg-primary/10 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Tiempo Total</p>
                                <p className="text-2xl font-bold text-primary">
                                  {tiempoTotalMin}:{tiempoTotalSegs.toString().padStart(2, "0")}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Promedio: {promedioPorLamina} min/lámina
                                </p>
                              </div>
                            </div>
                          </div>

                          {np.archivos_ped && np.archivos_ped.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground mb-2">Archivos de Planos:</p>
                              <div className="flex flex-wrap gap-2">
                                {np.archivos_ped.map((archivo: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={archivo.url}
                                    download={archivo.nombre}
                                    className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1 rounded-md transition-colors"
                                  >
                                    {archivo.nombre}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay notas terminadas aún</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Planos Lepton (.ped)</CardTitle>
              <CardDescription>
                Buscar y descargar archivos de planos por nota de pedido - Total:{" "}
                {notasPedido.filter((np) => np.archivos_ped && np.archivos_ped.length > 0).length} notas con planos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por número de NP..."
                    className="flex-1"
                    value={busquedaNP}
                    onChange={(e) => setBusquedaNP(e.target.value)}
                  />
                  <Button variant="outline" onClick={() => setBusquedaNP("")}>
                    Limpiar
                  </Button>
                </div>

                {notasConPlanos.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">
                      {busquedaNP.trim()
                        ? `No se encontraron planos para la NP: ${busquedaNP}`
                        : "No hay notas de pedido con planos cargados"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {busquedaNP.trim()
                        ? "Verifica el número de nota de pedido"
                        : "Los asesores pueden cargar archivos .ped al crear las notas"}
                    </p>
                  </div>
                )}

                {notasConPlanos.length > 0 && (
                  <div className="grid gap-4">
                    {notasConPlanos.map((np) => (
                      <Card key={np.id} className="border-yellow-600/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">NP: {np.numero}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                Asesor: {np.asesor_nombre} •{" "}
                                {np.fecha_creacion && format(new Date(np.fecha_creacion), "dd/MM/yyyy")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Fecha de corte: {format(new Date(np.fecha_corte), "dd/MM/yyyy")}
                              </p>
                            </div>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                np.estado === "completado" || np.estado === "cerrado"
                                  ? "bg-green-500/20 text-green-400"
                                  : np.estado === "en_corte" || np.estado === "en_enchape"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {np.estado.toUpperCase().replace("_", " ")}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Láminas:</span>
                              <span className="ml-2 font-medium">{np.cantidad_laminas}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Material:</span>
                              <span className="ml-2 font-medium">{np.tipo_material?.toUpperCase()}</span>
                            </div>
                            {(np.canto_rigido || 0) > 0 && (
                              <div>
                                <span className="text-muted-foreground">Canto Rígido:</span>
                                <span className="ml-2 font-medium">{np.canto_rigido}m</span>
                              </div>
                            )}
                            {(np.canto_flexible || 0) > 0 && (
                              <div>
                                <span className="text-muted-foreground">Canto Flexible:</span>
                                <span className="ml-2 font-medium">{np.canto_flexible}m</span>
                              </div>
                            )}
                          </div>

                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-3 flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-yellow-400" />
                              Archivos .ped ({np.archivos_ped?.length || 0})
                            </p>
                            <div className="space-y-2">
                              {np.archivos_ped?.map((archivo: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-muted/30 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex-1 min-w-0 mr-4">
                                    <p className="text-sm font-medium truncate">{archivo.nombre}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {archivo.fechaSubida &&
                                        `Subido el ${format(new Date(archivo.fechaSubida), "dd/MM/yyyy HH:mm")}`}
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => descargarPlano(archivo)}
                                    className="bg-yellow-600 hover:bg-yellow-500 text-black"
                                    size="sm"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Crear Nuevo Usuario
                </CardTitle>
                <CardDescription>Agregar cortadores o asesores de ventas al sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    placeholder="Juan Pérez"
                    value={nuevoUsuario.nombre}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@mosquera.com"
                    value={nuevoUsuario.email}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={nuevoUsuario.password}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
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
                    <SelectTrigger id="role">
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
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Usuario
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuarios Registrados
                </CardTitle>
                <CardDescription>Total: {usuarios.length} usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {usuarios.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{usuario.nombre}</p>
                        <p className="text-sm text-muted-foreground">{usuario.email}</p>
                        <div className="flex gap-2">
                          <Badge
                            variant={usuario.role === "jefe_ventas" ? "default" : "secondary"}
                            className={
                              usuario.role === "cortador"
                                ? "bg-blue-500"
                                : usuario.role === "asesor_ventas"
                                  ? "bg-green-500"
                                  : ""
                            }
                          >
                            {usuario.role === "jefe_ventas"
                              ? "Jefe de Ventas"
                              : usuario.role === "cortador"
                                ? "Cortador"
                                : "Asesor de Ventas"}
                          </Badge>
                          {usuario.es_baseline && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                              Baseline
                            </Badge>
                          )}
                        </div>
                      </div>
                      {usuario.role !== "jefe_ventas" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarUsuario(usuario.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
