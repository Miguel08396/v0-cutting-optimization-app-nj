"use client"

import type React from "react"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, CheckCircle2, FileText, CalendarIcon, Upload, Download, Clock, Plus, Trash2, Bell } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { NotaPedido } from "@/lib/supabase/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface MaterialEntry {
  id: string
  tipo: "aglomerado" | "crudo" | "mdf"
  cantidad: number
}

export function AsesorVentasView() {
  const { user } = useAuth()
  const supabase = createClient()

  const [fechaCorte, setFechaCorte] = useState<Date>(new Date())
  const [numeroNP, setNumeroNP] = useState("")
  const [materiales, setMateriales] = useState<MaterialEntry[]>([
    { id: crypto.randomUUID(), tipo: "aglomerado", cantidad: 1 },
  ])
  const [llevaCanto, setLlevaCanto] = useState(false)
  const [cantoFlexible, setCantoFlexible] = useState(0)
  const [cantoRigido, setCantoRigido] = useState(0)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [tipoEntrega, setTipoEntrega] = useState<"domicilio" | "retiro" | "portable">("retiro")
  const [cantidadDesplazamientos, setCantidadDesplazamientos] = useState(0)

  const [archivosPed, setArchivosPed] = useState<File[]>([])

  const [notasPedido, setNotasPedido] = useState<NotaPedido[]>([])
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>("todos")

  const cargarNotas = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("notas_pedido")
      .select("*")
      .eq("asesor_id", user.id)
      .order("fecha_creacion", { ascending: false })

    if (!error && data) {
      setNotasPedido(data as NotaPedido[])
    }
  }, [supabase, user])

  useEffect(() => {
    cargarNotas()
  }, [cargarNotas])

  const handleAgregarMaterial = () => {
    setMateriales((prev) => [...prev, { id: crypto.randomUUID(), tipo: "aglomerado", cantidad: 1 }])
  }

  const handleEliminarMaterial = (id: string) => {
    if (materiales.length > 1) {
      setMateriales((prev) => prev.filter((m) => m.id !== id))
    }
  }

  const handleCambiarMaterial = (id: string, campo: "tipo" | "cantidad", valor: string | number) => {
    setMateriales((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [campo]: campo === "cantidad" ? Number(valor) || 1 : valor } : m)),
    )
  }

  const cantidadTotalLaminas = materiales.reduce((sum, m) => sum + m.cantidad, 0)

  const handleCargarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const pedFiles = files.filter((f) => f.name.toLowerCase().endsWith(".ped"))
    setArchivosPed((prev) => [...prev, ...pedFiles])
  }

  const handleEliminarArchivo = (index: number) => {
    setArchivosPed((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGuardarNP = async () => {
    if (!user || !numeroNP) return
    setIsLoading(true)

    try {
      // Convertir archivos a base64
      const archivosConvertidos = await Promise.all(
        archivosPed.map(async (file) => {
          const reader = new FileReader()
          return new Promise<{ nombre: string; url: string; fechaSubida: string }>((resolve) => {
            reader.onload = () => {
              resolve({
                nombre: file.name,
                url: reader.result as string,
                fechaSubida: new Date().toISOString(),
              })
            }
            reader.readAsDataURL(file)
          })
        }),
      )

      // Determinar el tipo de material principal (el de mayor cantidad)
      const materialPrincipal = materiales.reduce((prev, curr) => (curr.cantidad > prev.cantidad ? curr : prev))

      // Crear nota en Supabase
      const { data: nuevaNota, error: errorNota } = await supabase
        .from("notas_pedido")
        .insert({
          numero: numeroNP,
          asesor_id: user.id,
          asesor_nombre: user.nombre,
          fecha_corte: fechaCorte.toISOString(),
          cantidad_laminas: cantidadTotalLaminas,
          tipo_material: materialPrincipal.tipo,
          lleva_canto: llevaCanto,
          canto_flexible: llevaCanto ? cantoFlexible : 0,
          canto_rigido: llevaCanto ? cantoRigido : 0,
          estado: "pendiente",
          corte_completado: false,
          enchape_completado: false,
          tiempo_pausado_corte: 0,
          tiempo_pausado_enchape: 0,
          archivos_ped: archivosConvertidos,
          imagenes_plano: [],
          tipo_entrega: tipoEntrega,
          cantidad_desplazamientos: cantidadDesplazamientos,
        })
        .select()
        .single()

      if (errorNota) throw errorNota

      if (nuevaNota) {
        const detallesMateriales = materiales.map((m) => ({
          nota_id: nuevaNota.id,
          tipo_material: m.tipo,
          cantidad: m.cantidad,
        }))

        await supabase.from("laminas_detalle").insert(detallesMateriales)
      }

      await cargarNotas()

      setGuardadoExitoso(true)
      setTimeout(() => setGuardadoExitoso(false), 3000)

      // Reset form
      setNumeroNP("")
      setMateriales([{ id: crypto.randomUUID(), tipo: "aglomerado", cantidad: 1 }])
      setLlevaCanto(false)
      setCantoFlexible(0)
      setCantoRigido(0)
      setFechaCorte(new Date())
      setArchivosPed([])
      setTipoEntrega("retiro")
      setCantidadDesplazamientos(0)
    } catch (error) {
      console.error("[v0] Error al guardar NP:", error)
      alert("Error al guardar la nota de pedido")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCerrarNota = async (notaId: string) => {
    const { error } = await supabase.from("notas_pedido").update({ estado: "cerrado" }).eq("id", notaId)

    if (!error) {
      await cargarNotas()
    }
  }

  const getEstadoBadge = (estado: NotaPedido["estado"]) => {
    const badges = {
      pendiente: <Badge variant="secondary">Pendiente</Badge>,
      en_corte: <Badge className="bg-blue-500">En Corte</Badge>,
      cortado: <Badge className="bg-yellow-500">Cortado</Badge>,
      en_enchape: <Badge className="bg-purple-500">En Enchape</Badge>,
      completado: <Badge className="bg-green-500">Completado</Badge>,
      cerrado: <Badge variant="outline">Cerrado</Badge>,
    }
    return badges[estado]
  }

  const getPrioridadColor = (tipoEntrega: NotaPedido["tipo_entrega"]) => {
    switch (tipoEntrega) {
      case "domicilio":
        return "text-red-500"
      case "retiro":
        return "text-yellow-500"
      case "portable":
        return "text-green-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getTipoEntregaLabel = (tipoEntrega: NotaPedido["tipo_entrega"]) => {
    switch (tipoEntrega) {
      case "domicilio":
        return "Domicilio"
      case "retiro":
        return "Retiro en tienda"
      case "portable":
        return "Portable"
      default:
        return "Sin especificar"
    }
  }

  const estaRetrasada = (nota: NotaPedido) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaCorteNota = new Date(nota.fecha_corte)
    fechaCorteNota.setHours(0, 0, 0, 0)

    return fechaCorteNota < hoy && nota.estado !== "completado" && nota.estado !== "cerrado"
  }

  const obtenerDiaSemana = (fecha: string | Date) => {
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    return dias[new Date(fecha).getDay()]
  }

  const notasAgrupadas = notasPedido.reduce(
    (acc, nota) => {
      const dia = obtenerDiaSemana(nota.fecha_corte)
      if (!acc[dia]) acc[dia] = []
      acc[dia].push(nota)
      return acc
    },
    {} as Record<string, NotaPedido[]>,
  )

  const notasFiltradas = diaSeleccionado === "todos" ? notasPedido : notasAgrupadas[diaSeleccionado] || []

  const notasRetrasadas = notasPedido.filter(estaRetrasada).length

  const formatearTiempo = (segundos: number | null) => {
    if (!segundos) return "0m 0s"
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins}m ${secs}s`
  }

  const descargarArchivo = (archivo: { nombre: string; url: string }) => {
    const link = document.createElement("a")
    link.href = archivo.url
    link.download = archivo.nombre
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Panel de Programacion</h2>
          <p className="text-muted-foreground">Bienvenido, {user?.nombre}</p>
          {notasRetrasadas > 0 && (
            <Badge variant="destructive" className="mt-2">
              {notasRetrasadas} nota{notasRetrasadas > 1 ? "s" : ""} retrasada{notasRetrasadas > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nueva Nota de Pedido</CardTitle>
            <CardDescription>Programa un nuevo trabajo de corte y enchape</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numeroNP">Consecutivo Nota Pedido (NP)</Label>
              <Input
                id="numeroNP"
                placeholder="ej: NP-2025-001"
                value={numeroNP}
                onChange={(e) => setNumeroNP(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoEntrega">Tipo de Entrega</Label>
              <Select value={tipoEntrega} onValueChange={(v) => setTipoEntrega(v as typeof tipoEntrega)}>
                <SelectTrigger className="bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domicilio">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-red-500" />
                      Domicilio (Alta prioridad)
                    </div>
                  </SelectItem>
                  <SelectItem value="retiro">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-yellow-500" />
                      Retiro en tienda (Media prioridad)
                    </div>
                  </SelectItem>
                  <SelectItem value="portable">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-green-500" />
                      Portable (Baja prioridad)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Corte</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fechaCorte, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={fechaCorte} onSelect={(date) => date && setFechaCorte(date)} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Laminas por Material</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarMaterial}
                  className="bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Material
                </Button>
              </div>

              {materiales.map((material, index) => (
                <div key={material.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <Select value={material.tipo} onValueChange={(v) => handleCambiarMaterial(material.id, "tipo", v)}>
                      <SelectTrigger className="bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aglomerado">Aglomerado</SelectItem>
                        <SelectItem value="crudo">Crudo</SelectItem>
                        <SelectItem value="mdf">MDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min={1}
                      value={material.cantidad}
                      onChange={(e) => handleCambiarMaterial(material.id, "cantidad", e.target.value)}
                      placeholder="Cant."
                    />
                  </div>
                  {materiales.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEliminarMaterial(material.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <p className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{cantidadTotalLaminas} laminas</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desplazamientos">Cantidad de Desplazamientos de Sierra</Label>
              <Input
                id="desplazamientos"
                type="number"
                min={0}
                placeholder="ej: 15"
                value={cantidadDesplazamientos || ""}
                onChange={(e) => setCantidadDesplazamientos(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Numero de movimientos de sierra necesarios para completar el corte
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="llevaCanto"
                  checked={llevaCanto}
                  onChange={(e) => setLlevaCanto(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="llevaCanto" className="cursor-pointer">
                  Lleva canto
                </Label>
              </div>

              {llevaCanto && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cantoFlexible">Canto Flexible (metros)</Label>
                    <Input
                      id="cantoFlexible"
                      type="number"
                      min={0}
                      step="1"
                      placeholder="0"
                      value={cantoFlexible}
                      onChange={(e) => setCantoFlexible(Math.round(Number.parseFloat(e.target.value) || 0))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantoRigido">Canto Rigido (metros)</Label>
                    <Input
                      id="cantoRigido"
                      type="number"
                      min={0}
                      step="1"
                      placeholder="0"
                      value={cantoRigido}
                      onChange={(e) => setCantoRigido(Math.round(Number.parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="archivosPed">Planos de Corte (Archivos .ped de Lepton)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <input
                  id="archivosPed"
                  type="file"
                  accept=".ped"
                  multiple
                  onChange={handleCargarArchivos}
                  className="hidden"
                />
                <label htmlFor="archivosPed" className="cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Haz clic para cargar archivos .ped</p>
                  <p className="text-xs text-muted-foreground mt-1">Puedes seleccionar multiples archivos</p>
                </label>
              </div>

              {archivosPed.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-sm font-medium">Archivos cargados ({archivosPed.length}):</p>
                  {archivosPed.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarArchivo(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleGuardarNP} className="w-full" size="lg" disabled={!numeroNP || isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Guardando..." : "Guardar Nota Pedido"}
            </Button>

            {guardadoExitoso && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/20 p-3 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Nota de Pedido guardada exitosamente</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Notas de Pedido</CardTitle>
            <CardDescription>
              Notas programadas ({notasPedido.length})
              <Select value={diaSeleccionado} onValueChange={setDiaSeleccionado}>
                <SelectTrigger className="w-[200px] mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los dias</SelectItem>
                  <SelectItem value="Lunes">Lunes</SelectItem>
                  <SelectItem value="Martes">Martes</SelectItem>
                  <SelectItem value="Miercoles">Miercoles</SelectItem>
                  <SelectItem value="Jueves">Jueves</SelectItem>
                  <SelectItem value="Viernes">Viernes</SelectItem>
                  <SelectItem value="Sabado">Sabado</SelectItem>
                  <SelectItem value="Domingo">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {diaSeleccionado === "todos"
                    ? "No has creado ninguna nota de pedido aun"
                    : `No hay notas programadas para ${diaSeleccionado}`}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {notasFiltradas.map((nota) => (
                  <Card
                    key={nota.id}
                    className={`border-l-4 ${estaRetrasada(nota) ? "border-l-red-500" : "border-l-primary"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Bell className={`h-5 w-5 ${getPrioridadColor(nota.tipo_entrega)}`} />
                          <div>
                            <p className="font-bold text-lg">{nota.numero}</p>
                            <p className="text-xs text-muted-foreground">
                              {obtenerDiaSemana(nota.fecha_corte)} -{" "}
                              {format(new Date(nota.fecha_corte), "PPP", { locale: es })}
                            </p>
                            {estaRetrasada(nota) && (
                              <Badge variant="destructive" className="mt-1 text-xs">
                                Retrasada
                              </Badge>
                            )}
                          </div>
                        </div>
                        {getEstadoBadge(nota.estado)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Laminas:</span>
                          <span className="ml-2 font-medium">{nota.cantidad_laminas}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Material:</span>
                          <span className="ml-2 font-medium capitalize">{nota.tipo_material}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Entrega:</span>
                          <span className={`ml-2 font-medium ${getPrioridadColor(nota.tipo_entrega)}`}>
                            {getTipoEntregaLabel(nota.tipo_entrega)}
                          </span>
                        </div>
                        {nota.cantidad_desplazamientos > 0 && (
                          <div>
                            <span className="text-muted-foreground">Desplaz.:</span>
                            <span className="ml-2 font-medium">{nota.cantidad_desplazamientos}</span>
                          </div>
                        )}
                        {nota.lleva_canto && (
                          <>
                            <div>
                              <span className="text-muted-foreground">C. Flexible:</span>
                              <span className="ml-2 font-medium">{nota.canto_flexible}m</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">C. Rigido:</span>
                              <span className="ml-2 font-medium">{nota.canto_rigido}m</span>
                            </div>
                          </>
                        )}
                      </div>

                      {(nota.tiempo_corte || nota.tiempo_enchape_rigido || nota.tiempo_enchape_flexible) && (
                        <div className="mt-3 pt-3 border-t border-border space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Tiempos Registrados:</p>
                          {nota.tiempo_corte && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-primary" />
                              <span className="text-muted-foreground">Corte:</span>
                              <span className="font-medium text-primary">{formatearTiempo(nota.tiempo_corte)}</span>
                              {nota.tiempo_pausado_corte > 0 && (
                                <span className="text-xs text-yellow-600">
                                  (+{formatearTiempo(nota.tiempo_pausado_corte)} pausado)
                                </span>
                              )}
                            </div>
                          )}
                          {nota.tiempo_enchape_rigido && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-green-600" />
                              <span className="text-muted-foreground">Enchape Rigido:</span>
                              <span className="font-medium text-green-600">
                                {formatearTiempo(nota.tiempo_enchape_rigido)}
                              </span>
                            </div>
                          )}
                          {nota.tiempo_enchape_flexible && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-blue-600" />
                              <span className="text-muted-foreground">Enchape Flexible:</span>
                              <span className="font-medium text-blue-600">
                                {formatearTiempo(nota.tiempo_enchape_flexible)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {nota.archivos_ped && nota.archivos_ped.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Planos Lepton ({nota.archivos_ped.length}):
                          </p>
                          <div className="space-y-1">
                            {nota.archivos_ped.map((archivo, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="w-full justify-between text-xs bg-transparent"
                                onClick={() => descargarArchivo(archivo)}
                              >
                                <span className="truncate">{archivo.nombre}</span>
                                <Download className="h-3 w-3 ml-2" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {nota.estado === "completado" && (
                        <Button
                          onClick={() => handleCerrarNota(nota.id)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 bg-transparent"
                        >
                          Cerrar Nota
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
