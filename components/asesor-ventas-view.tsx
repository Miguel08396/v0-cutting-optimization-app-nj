"use client"

import type React from "react"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, CheckCircle2, FileText, CalendarIcon, Upload, Download, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { NotaPedidoController } from "@/lib/nota-pedido-controller"
import type { NotaPedido } from "@/lib/nota-pedido-model"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function AsesorVentasView() {
  const { user } = useAuth()
  const [controller] = useState(() => new NotaPedidoController())

  const [fechaCorte, setFechaCorte] = useState<Date>(new Date())
  const [numeroNP, setNumeroNP] = useState("")
  const [cantidadLaminas, setCantidadLaminas] = useState(1)
  const [tipoMaterial, setTipoMaterial] = useState<"aglomerado" | "crudo" | "mdf">("aglomerado")
  const [llevaCanto, setLlevaCanto] = useState(false)
  const [cantoFlexible, setCantoFlexible] = useState(0)
  const [cantoRigido, setCantoRigido] = useState(0)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)

  const [archivosPed, setArchivosPed] = useState<File[]>([])

  const [notasPedido, setNotasPedido] = useState<NotaPedido[]>([])
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>("todos")

  useEffect(() => {
    if (user) {
      const notas = controller.obtenerNotasPorAsesor(user.id)
      setNotasPedido(notas)
    }
  }, [user, controller])

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

    console.log("[v0] Guardando NP con", archivosPed.length, "archivos .ped") // Debug log

    const archivosConvertidos = await Promise.all(
      archivosPed.map(async (file) => {
        const reader = new FileReader()
        return new Promise<{ nombre: string; url: string; fechaSubida: Date }>((resolve) => {
          reader.onload = () => {
            console.log("[v0] Archivo convertido:", file.name) // Debug log
            resolve({
              nombre: file.name,
              url: reader.result as string,
              fechaSubida: new Date(),
            })
          }
          reader.readAsDataURL(file)
        })
      }),
    )

    console.log("[v0] Archivos convertidos:", archivosConvertidos.length) // Debug log

    const nuevaNP = controller.crearNotaPedido({
      numero: numeroNP,
      asesorId: user.id,
      asesorNombre: user.nombre,
      fechaCorte: fechaCorte,
      cantidadLaminas,
      tipoMaterial,
      llevaCanto,
      cantoFlexible: llevaCanto ? cantoFlexible : 0,
      cantoRigido: llevaCanto ? cantoRigido : 0,
      archivosPed: archivosConvertidos, // Pasando archivos convertidos
    })

    console.log("[v0] NP creada:", nuevaNP.numero, "con", nuevaNP.archivosPed.length, "archivos") // Debug log

    const notas = controller.obtenerNotasPorAsesor(user.id)
    setNotasPedido(notas)

    setGuardadoExitoso(true)
    setTimeout(() => setGuardadoExitoso(false), 3000)

    // Reset form
    setNumeroNP("")
    setCantidadLaminas(1)
    setTipoMaterial("aglomerado")
    setLlevaCanto(false)
    setCantoFlexible(0)
    setCantoRigido(0)
    setFechaCorte(new Date())
    setArchivosPed([])
  }

  const handleCerrarNota = (notaId: string) => {
    console.log("[v0] Cerrando nota:", notaId)
    controller.cerrarNota(notaId)
    if (user) {
      const notas = controller.obtenerNotasPorAsesor(user.id)
      console.log("[v0] Notas actualizadas después de cerrar:", notas)
      setNotasPedido(notas)
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

  const estaRetrasada = (nota: NotaPedido) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaCorte = new Date(nota.fechaCorte)
    fechaCorte.setHours(0, 0, 0, 0)

    return fechaCorte < hoy && nota.estado !== "completado" && nota.estado !== "cerrado"
  }

  const obtenerDiaSemana = (fecha: Date) => {
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    return dias[new Date(fecha).getDay()]
  }

  const notasAgrupadas = notasPedido.reduce(
    (acc, nota) => {
      const dia = obtenerDiaSemana(nota.fechaCorte)
      if (!acc[dia]) acc[dia] = []
      acc[dia].push(nota)
      return acc
    },
    {} as Record<string, NotaPedido[]>,
  )

  const notasFiltradas = diaSeleccionado === "todos" ? notasPedido : notasAgrupadas[diaSeleccionado] || []

  const notasRetrasadas = notasPedido.filter(estaRetrasada).length

  const formatearTiempo = (segundos: number) => {
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
          <h2 className="text-3xl font-bold text-foreground">Panel de Programación</h2>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cantidadLaminas">Cantidad de Láminas</Label>
                <Input
                  id="cantidadLaminas"
                  type="number"
                  min={1}
                  value={cantidadLaminas}
                  onChange={(e) => setCantidadLaminas(Number.parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoMaterial">Tipo de Material</Label>
                <Select value={tipoMaterial} onValueChange={(v) => setTipoMaterial(v as any)}>
                  <SelectTrigger id="tipoMaterial">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aglomerado">Aglomerado</SelectItem>
                    <SelectItem value="crudo">Crudo</SelectItem>
                    <SelectItem value="mdf">MDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <Label htmlFor="cantoRigido">Canto Rígido (metros)</Label>
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
                  <p className="text-xs text-muted-foreground mt-1">Puedes seleccionar múltiples archivos</p>
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

            <Button onClick={handleGuardarNP} className="w-full" size="lg" disabled={!numeroNP}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Nota Pedido
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
                  <SelectItem value="todos">Todos los días</SelectItem>
                  <SelectItem value="Lunes">Lunes</SelectItem>
                  <SelectItem value="Martes">Martes</SelectItem>
                  <SelectItem value="Miércoles">Miércoles</SelectItem>
                  <SelectItem value="Jueves">Jueves</SelectItem>
                  <SelectItem value="Viernes">Viernes</SelectItem>
                  <SelectItem value="Sábado">Sábado</SelectItem>
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
                    ? "No has creado ninguna nota de pedido aún"
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
                        <div>
                          <p className="font-bold text-lg">{nota.numero}</p>
                          <p className="text-xs text-muted-foreground">
                            {obtenerDiaSemana(nota.fechaCorte)} - {format(nota.fechaCorte, "PPP", { locale: es })}
                          </p>
                          {estaRetrasada(nota) && (
                            <Badge variant="destructive" className="mt-1 text-xs">
                              Retrasada
                            </Badge>
                          )}
                        </div>
                        {getEstadoBadge(nota.estado)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Láminas:</span>
                          <span className="ml-2 font-medium">{nota.cantidadLaminas}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Material:</span>
                          <span className="ml-2 font-medium capitalize">{nota.tipoMaterial}</span>
                        </div>
                        {nota.llevaCanto && (
                          <>
                            <div>
                              <span className="text-muted-foreground">C. Flexible:</span>
                              <span className="ml-2 font-medium">{nota.cantoFlexible}m</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">C. Rígido:</span>
                              <span className="ml-2 font-medium">{nota.cantoRigido}m</span>
                            </div>
                          </>
                        )}
                      </div>

                      {(nota.tiempoCorte || nota.tiempoEnchapeRigido || nota.tiempoEnchapeFlexible) && (
                        <div className="mt-3 pt-3 border-t border-border space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Tiempos Registrados:</p>
                          {nota.tiempoCorte && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-primary" />
                              <span className="text-muted-foreground">Corte:</span>
                              <span className="font-medium text-primary">{formatearTiempo(nota.tiempoCorte)}</span>
                            </div>
                          )}
                          {nota.tiempoEnchapeRigido && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-green-600" />
                              <span className="text-muted-foreground">Enchape Rígido:</span>
                              <span className="font-medium text-green-600">
                                {formatearTiempo(nota.tiempoEnchapeRigido)}
                              </span>
                            </div>
                          )}
                          {nota.tiempoEnchapeFlexible && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-blue-600" />
                              <span className="text-muted-foreground">Enchape Flexible:</span>
                              <span className="font-medium text-blue-600">
                                {formatearTiempo(nota.tiempoEnchapeFlexible)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {nota.archivosPed && nota.archivosPed.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Planos Lepton ({nota.archivosPed.length}):
                          </p>
                          <div className="space-y-1">
                            {nota.archivosPed.map((archivo, idx) => (
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

                      {nota.cortadorNombre && (
                        <div className="mt-3 pt-3 border-t border-border text-sm">
                          <span className="text-muted-foreground">Cortador:</span>
                          <span className="ml-2 font-medium">{nota.cortadorNombre}</span>
                        </div>
                      )}

                      {nota.estado === "completado" && (
                        <Button
                          onClick={() => handleCerrarNota(nota.id)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-3"
                        >
                          Cerrar como Terminada
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
