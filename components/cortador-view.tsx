"use client"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, CheckCircle2, ArrowLeft, Pause, Scissors, Shield, Calendar, Download, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { NotaPedidoController } from "@/lib/nota-pedido-controller"
import type { NotaPedido } from "@/lib/nota-pedido-model"
import { format } from "date-fns"

interface LaminaCorte {
  numero: number
  estado: "sin_iniciar" | "en_proceso" | "completado"
  horaInicio: Date | null
  horaFin: Date | null
  tiempoTotal: number
}

interface EnchapeRegistro {
  tipo: "rigido" | "flexible"
  estado: "sin_iniciar" | "en_proceso" | "completado"
  horaInicio: Date | null
  horaFin: Date | null
  tiempoTotal: number
}

export function CortadorView() {
  const { user } = useAuth()
  const [controller] = useState(() => new NotaPedidoController())

  const [vistaActual, setVistaActual] = useState<"lista" | "seleccion" | "corte" | "enchape">("lista")
  const [notasPedido, setNotasPedido] = useState<NotaPedido[]>([])
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotaPedido | null>(null)

  const [laminasCorte, setLaminasCorte] = useState<LaminaCorte[]>([])
  const [laminaEnProceso, setLaminaEnProceso] = useState<number | null>(null)
  const [laminaPausada, setLaminaPausada] = useState<number | null>(null)
  const [tiempoActual, setTiempoActual] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null) // Keep this for corte timing

  const [enchapesRegistro, setEnchapesRegistro] = useState<EnchapeRegistro[]>([])
  const [enchapeEnProceso, setEnchapeEnProceso] = useState<"rigido" | "flexible" | null>(null)
  const [enchapePausado, setEnchapePausado] = useState<"rigido" | "flexible" | null>(null)
  const [tiempoEnchapeActual, setTiempoEnchapeActual] = useState(0)
  const intervalEnchapeRef = useRef<NodeJS.Timeout | null>(null) // Keep this for enchape timing

  const [diaSeleccionado, setDiaSeleccionado] = useState<string>("todos")

  const [imagenVisualizacion, setImagenVisualizacion] = useState<string | null>(null) // Keep this for dialog

  useEffect(() => {
    cargarNotas()
    const interval = setInterval(cargarNotas, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (laminaEnProceso !== null && !laminaPausada) {
      const lamina = laminasCorte.find((l) => l.numero === laminaEnProceso)
      if (lamina?.horaInicio) {
        intervalRef.current = setInterval(() => {
          const tiempoTranscurrido = Math.floor((new Date().getTime() - lamina.horaInicio!.getTime()) / 1000)
          setTiempoActual(tiempoTranscurrido)
        }, 1000)
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (!laminaPausada) {
        setTiempoActual(0) // Reset when not paused and not in process
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [laminaEnProceso, laminaPausada, laminasCorte])

  useEffect(() => {
    if (enchapeEnProceso && !enchapePausado) {
      const enchape = enchapesRegistro.find((e) => e.tipo === enchapeEnProceso)
      if (enchape?.horaInicio) {
        intervalEnchapeRef.current = setInterval(() => {
          const tiempoTranscurrido = Math.floor((new Date().getTime() - enchape.horaInicio!.getTime()) / 1000)
          setTiempoEnchapeActual(tiempoTranscurrido)
        }, 1000)
      }
    } else {
      if (intervalEnchapeRef.current) {
        clearInterval(intervalEnchapeRef.current)
        intervalEnchapeRef.current = null
      }
    }
    return () => {
      if (intervalEnchapeRef.current) {
        clearInterval(intervalEnchapeRef.current)
      }
    }
  }, [enchapeEnProceso, enchapePausado, enchapesRegistro])

  const cargarNotas = () => {
    const notas = controller.obtenerNotasPendientes()
    setNotasPedido(notas)
  }

  const handleSeleccionarNota = (nota: NotaPedido) => {
    console.log("[v0] Nota seleccionada:", nota)
    setNotaSeleccionada(nota)

    const laminas: LaminaCorte[] = Array.from({ length: nota.cantidadTableros }, (_, i) => ({
      numero: i + 1,
      estado: "sin_iniciar" as const,
      horaInicio: null,
      horaFin: null,
      tiempoTotal: 0,
    }))

    console.log("[v0] Láminas creadas:", laminas)
    setLaminasCorte(laminas)

    const enchapes: EnchapeRegistro[] = []
    if (nota.cantoRigido > 0) {
      enchapes.push({
        tipo: "rigido",
        estado: "sin_iniciar",
        horaInicio: null,
        horaFin: null,
        tiempoTotal: 0,
      })
    }
    if (nota.cantoFlexible > 0) {
      enchapes.push({
        tipo: "flexible",
        estado: "sin_iniciar",
        horaInicio: null,
        horaFin: null,
        tiempoTotal: 0,
      })
    }
    setEnchapesRegistro(enchapes)

    if (!nota.corteCompletado) {
      setVistaActual("seleccion")
    } else {
      setVistaActual("enchape")
    }
  }

  const handleIniciarCorte = () => {
    if (!notaSeleccionada || !user) return
    console.log("[v0] Iniciando proceso de corte")
    controller.iniciarProcesoCorte(notaSeleccionada.id, user.id, user.nombre)
    setVistaActual("corte")
  }

  const handleIniciarLamina = (numeroLamina: number) => {
    console.log("[v0] Iniciando lámina:", numeroLamina)
    setLaminasCorte((prev) =>
      prev.map((l) =>
        l.numero === numeroLamina
          ? {
              ...l,
              estado: "en_proceso" as const,
              horaInicio: new Date(),
            }
          : l,
      ),
    )
    setLaminaEnProceso(numeroLamina)
    setLaminaPausada(null) // Ensure not paused when starting
  }

  const handlePausarLamina = (numeroLamina: number) => {
    console.log("[v0] Pausando lámina:", numeroLamina)
    setLaminaPausada(numeroLamina)
  }

  const handleContinuarLamina = (numeroLamina: number) => {
    console.log("[v0] Continuing lámina:", numeroLamina)
    setLaminaPausada(null) // Clear pause state
  }

  const handleDetenerLamina = (numeroLamina: number) => {
    console.log("[v0] Finalizando lámina:", numeroLamina)
    const lamina = laminasCorte.find((l) => l.numero === numeroLamina)
    if (!lamina || !lamina.horaInicio) return

    const tiempoTotal = Math.floor((new Date().getTime() - lamina.horaInicio.getTime()) / 1000)

    setLaminasCorte((prev) =>
      prev.map((l) =>
        l.numero === numeroLamina
          ? {
              ...l,
              estado: "completado" as const,
              horaFin: new Date(),
              tiempoTotal,
            }
          : l,
      ),
    )
    setLaminaEnProceso(null)
    setLaminaPausada(null)
    setTiempoActual(0) // Reset timer
  }

  const handleFinalizarCorte = () => {
    console.log("[v0] Finalizando corte completo")
    if (!notaSeleccionada) return

    const tiempoTotal = laminasCorte.reduce((total, lamina) => total + (lamina.tiempoTotal || 0), 0)

    controller.finalizarProcesoCorte(notaSeleccionada.id, tiempoTotal)

    const requiereEnchape = notaSeleccionada.cantoRigido > 0 || notaSeleccionada.cantoFlexible > 0

    if (requiereEnchape) {
      setVistaActual("enchape")
    } else {
      cargarNotas()
      setVistaActual("lista")
      setNotaSeleccionada(null)
    }
  }

  const handleIniciarEnchape = () => {
    if (!notaSeleccionada) return
    console.log("[v0] Iniciando proceso de enchape")
    controller.iniciarProcesoEnchape(notaSeleccionada.id)
  }

  const handleIniciarEnchapeRegistro = (tipo: "rigido" | "flexible") => {
    console.log("[v0] Iniciando enchape:", tipo)
    setEnchapesRegistro((prev) =>
      prev.map((e) =>
        e.tipo === tipo
          ? {
              ...e,
              estado: "en_proceso" as const,
              horaInicio: new Date(),
            }
          : e,
      ),
    )
    setEnchapeEnProceso(tipo)
    setEnchapePausado(null) // Ensure not paused when starting
  }

  const handlePausarEnchape = (tipo: "rigido" | "flexible") => {
    console.log("[v0] Pausando enchape:", tipo)
    setEnchapePausado(tipo)
  }

  const handleContinuarEnchape = (tipo: "rigido" | "flexible") => {
    console.log("[v0] Continuing enchape:", tipo)
    setEnchapePausado(null) // Clear pause state
  }

  const handleDetenerEnchape = (tipo: "rigido" | "flexible") => {
    console.log("[v0] Finalizando enchape:", tipo)
    const enchape = enchapesRegistro.find((e) => e.tipo === tipo)
    if (!enchape || !enchape.horaInicio) return

    const tiempoTotal = Math.floor((new Date().getTime() - enchape.horaInicio.getTime()) / 1000)

    setEnchapesRegistro((prev) =>
      prev.map((e) =>
        e.tipo === tipo
          ? {
              ...e,
              estado: "completado" as const,
              horaFin: new Date(),
              tiempoTotal,
            }
          : e,
      ),
    )
    setEnchapeEnProceso(null)
    setEnchapePausado(null)
    setTiempoEnchapeActual(0) // Reset timer
  }

  const handleFinalizarEnchape = () => {
    console.log("[v0] Finalizando enchape completo")
    if (!notaSeleccionada) return

    const tiempoRigido = enchapesRegistro.find((e) => e.tipo === "rigido")?.tiempoTotal || 0
    const tiempoFlexible = enchapesRegistro.find((e) => e.tipo === "flexible")?.tiempoTotal || 0

    controller.finalizarProcesoEnchape(notaSeleccionada.id, tiempoRigido, tiempoFlexible)

    cargarNotas()
    setVistaActual("lista")
    setNotaSeleccionada(null)
  }

  const formatearTiempo = (segundos: number): string => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60

    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`
    }
    return `${minutos}m ${segs}s`
  }

  const obtenerDiaSemana = (fecha: Date) => {
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    return dias[new Date(fecha).getDay()]
  }

  const estaRetrasada = (nota: NotaPedido) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaCorte = new Date(nota.fechaCorte)
    fechaCorte.setHours(0, 0, 0, 0)

    return fechaCorte < hoy && nota.estado !== "completado" && nota.estado !== "cerrado"
  }

  const notasFiltradas =
    diaSeleccionado === "todos"
      ? notasPedido
      : notasPedido.filter((nota) => obtenerDiaSemana(nota.fechaCorte) === diaSeleccionado)

  const notasRetrasadas = notasPedido.filter(estaRetrasada).length // Corrected to use notasPedido

  const obtenerBadgeEstado = (nota: NotaPedido) => {
    if (nota.estado === "completado" || nota.estado === "cerrado") {
      return <Badge className="bg-green-600">Completado</Badge>
    }
    if (nota.corteCompletado && !nota.enchapeCompletado && (nota.enchapeRigido > 0 || nota.enchapeFlexible > 0)) {
      return <Badge className="bg-blue-600">Listo para Enchape</Badge>
    }
    if (nota.estado === "en_proceso" || nota.estado === "en_corte") {
      return <Badge variant="default">En Proceso</Badge>
    }
    return <Badge variant="secondary">Pendiente</Badge>
  }

  const descargarArchivo = (archivo: { nombre: string; url: string }) => {
    const link = document.createElement("a")
    link.href = archivo.url
    link.download = archivo.nombre
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (vistaActual === "lista") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Panel del Cortador</h2>
          <p className="text-muted-foreground">Bienvenido, {user?.nombre}</p>
          {notasRetrasadas > 0 && (
            <Badge variant="destructive" className="mt-2">
              {notasRetrasadas} nota{notasRetrasadas > 1 ? "s" : ""} retrasada{notasRetrasadas > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notas de Pedido Pendientes</CardTitle>
                <CardDescription>Selecciona una nota para comenzar ({notasPedido.length})</CardDescription>
              </div>
              <Select value={diaSeleccionado} onValueChange={setDiaSeleccionado}>
                <SelectTrigger className="w-[200px]">
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
            </div>
          </CardHeader>
          <CardContent>
            {notasFiltradas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>
                  {diaSeleccionado === "todos"
                    ? "No hay notas de pedido pendientes"
                    : `No hay notas programadas para ${diaSeleccionado}`}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {notasFiltradas.map((nota) => (
                  <Card
                    key={nota.id}
                    className={`cursor-pointer hover:bg-accent transition-colors border-l-4 ${
                      estaRetrasada(nota) ? "border-l-red-500" : "border-l-primary"
                    }`}
                    onClick={() => handleSeleccionarNota(nota)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg">{nota.numero}</p>
                          <p className="text-sm text-muted-foreground">
                            {obtenerDiaSemana(nota.fechaCorte)} - {format(nota.fechaCorte, "dd/MM/yyyy")}
                          </p>
                          {estaRetrasada(nota) && (
                            <Badge variant="destructive" className="mt-1 text-xs">
                              Retrasada
                            </Badge>
                          )}
                        </div>
                        {/* Replaced old badge logic with the new one */}
                        <Badge
                          variant={nota.corteCompletado ? "secondary" : "default"}
                          className={nota.corteCompletado ? "bg-yellow-500" : ""}
                        >
                          {nota.corteCompletado ? "Para Enchapar" : "Para Cortar"}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asesor:</span>
                          <span className="font-medium">{nota.asesorNombre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Láminas:</span>
                          <span className="font-medium">{nota.cantidadTableros}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Material:</span>
                          <span className="font-medium capitalize">{nota.tipoMaterial}</span>
                        </div>
                        {(nota.enchapeRigido > 0 || nota.enchapeFlexible > 0) && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">E. Flexible:</span>
                              <span className="font-medium">{nota.enchapeFlexible}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">E. Rígido:</span>
                              <span className="font-medium">{nota.enchapeRigido}m</span>
                            </div>
                          </>
                        )}
                      </div>

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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  descargarArchivo(archivo)
                                }}
                              >
                                <span className="truncate">{archivo.nombre}</span>
                                <Download className="h-3 w-3 ml-2" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (vistaActual === "seleccion") {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setVistaActual("lista")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div>
          <h2 className="text-2xl font-bold text-foreground">Trabajo en Proceso - {notaSeleccionada?.numero}</h2>
          <p className="text-muted-foreground">{notaSeleccionada?.asesorNombre}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 border-primary cursor-pointer hover:bg-accent" onClick={handleIniciarCorte}>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-primary/10 p-6">
                  <Scissors className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Sierra Striebig</h3>
                  <p className="text-sm text-muted-foreground">Módulo de Corte</p>
                  <p className="text-sm font-medium mt-2">{notaSeleccionada?.cantidadTableros} tableros para cortar</p>
                </div>
                <Button size="lg" className="w-full">
                  Iniciar Corte
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border-2 ${
              notaSeleccionada?.cantoRigido || notaSeleccionada?.cantoFlexible
                ? "border-border opacity-40" // Adjusted logic and styling
                : "border-border opacity-40"
            }`}
          >
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-6">
                  <Shield className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Enchapadora Fravol</h3>
                  <p className="text-sm text-muted-foreground">Módulo de Enchape</p>
                  {notaSeleccionada?.cantoRigido || notaSeleccionada?.cantoFlexible ? (
                    <p className="text-sm font-medium mt-2 text-yellow-600">No requiere enchape</p> // Updated text
                  ) : (
                    <p className="text-sm font-medium mt-2 text-muted-foreground">Completar corte primero</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {notaSeleccionada?.archivosPed && notaSeleccionada?.archivosPed.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-yellow-500">Planos de Corte Lepton</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Se encontraron {notaSeleccionada.archivosPed.length} archivo(s) .ped adjuntos
            </p>
            <div className="space-y-2">
              {notaSeleccionada.archivosPed.map((archivo, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="w-full justify-between bg-background hover:bg-yellow-500/20"
                  onClick={() => descargarArchivo(archivo)}
                >
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="truncate">{archivo.nombre}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(archivo.fechaSubida).toLocaleDateString()}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (vistaActual === "corte") {
    const todasCompletas = laminasCorte.every((l) => l.estado === "completado")

    return (
      <div className="space-y-6">
        <div className="bg-card border-2 border-primary rounded-lg p-4">
          <Button variant="ghost" onClick={() => setVistaActual("lista")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Proceso de Corte - Sierra Striebig</h2>
          <p className="text-sm text-muted-foreground">NP: {notaSeleccionada?.numero}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tableros para Cortar ({laminasCorte.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {laminasCorte.map((lamina) => (
              <Card
                key={lamina.numero}
                className={`border-l-4 ${
                  lamina.estado === "completado"
                    ? "border-l-green-500"
                    : lamina.estado === "en_proceso"
                      ? "border-l-primary"
                      : "border-l-border"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg">Tablero {lamina.numero}</p>
                      <p className="text-sm text-muted-foreground">
                        {lamina.estado === "completado" && (
                          <span className="text-green-600 font-medium">
                            ✓ Completado - {formatearTiempo(lamina.tiempoTotal)}
                          </span>
                        )}
                        {lamina.estado === "en_proceso" && (
                          <span className="text-primary font-medium">
                            ⏱ En proceso - {formatearTiempo(tiempoActual)}
                          </span>
                        )}
                        {lamina.estado === "sin_iniciar" && <span className="text-muted-foreground">Sin iniciar</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {lamina.estado === "sin_iniciar" && (
                      <Button onClick={() => handleIniciarLamina(lamina.numero)} className="flex-1" size="lg">
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar
                      </Button>
                    )}

                    {lamina.estado === "en_proceso" && laminaEnProceso === lamina.numero && (
                      <>
                        {laminaPausada === lamina.numero ? (
                          <Button
                            onClick={() => handleContinuarLamina(lamina.numero)}
                            variant="secondary"
                            className="flex-1"
                            size="lg"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Continuar
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePausarLamina(lamina.numero)}
                            variant="secondary"
                            className="flex-1"
                            size="lg"
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDetenerLamina(lamina.numero)}
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> {/* Changed from CheckCircle */}
                          Finalizar
                        </Button>
                      </>
                    )}

                    {lamina.estado === "completado" && (
                      <Badge variant="secondary" className="bg-green-500 text-white text-sm py-2 px-4">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> {/* Changed from CheckCircle */}
                        Completado
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {todasCompletas && (
          <Button onClick={handleFinalizarCorte} size="lg" className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="mr-2 h-5 w-5" /> {/* Changed from CheckCircle */}
            Finalizar Corte Completo
          </Button>
        )}
      </div>
    )
  }

  if (vistaActual === "enchape") {
    const todosCompletos = enchapesRegistro.every((e) => e.estado === "completado")

    return (
      <div className="space-y-6">
        <div className="bg-card border-2 border-green-500 rounded-lg p-4">
          <Button variant="ghost" onClick={() => setVistaActual("lista")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Proceso de Enchape - Enchapadora Fravol</h2>
          <p className="text-sm text-muted-foreground">NP: {notaSeleccionada?.numero}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enchapes a Realizar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enchapesRegistro.map((enchape) => (
              <Card
                key={enchape.tipo}
                className={`border-l-4 ${
                  enchape.estado === "completado"
                    ? "border-l-green-500"
                    : enchape.estado === "en_proceso"
                      ? "border-l-primary"
                      : "border-l-border"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg capitalize">Enchape {enchape.tipo}</p>
                      <p className="text-sm text-muted-foreground">
                        {enchape.tipo === "rigido"
                          ? `${notaSeleccionada?.cantoRigido}m`
                          : `${notaSeleccionada?.cantoFlexible}m`}
                      </p>
                      <p className="text-sm">
                        {enchape.estado === "completado" && (
                          <span className="text-green-600 font-medium">
                            ✓ Completado - {formatearTiempo(enchape.tiempoTotal)}
                          </span>
                        )}
                        {enchape.estado === "en_proceso" && (
                          <span className="text-primary font-medium">
                            ⏱ En proceso - {formatearTiempo(tiempoEnchapeActual)}
                          </span>
                        )}
                        {enchape.estado === "sin_iniciar" && <span className="text-muted-foreground">Sin iniciar</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {enchape.estado === "sin_iniciar" && (
                      <Button onClick={() => handleIniciarEnchapeRegistro(enchape.tipo)} className="flex-1" size="lg">
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar
                      </Button>
                    )}

                    {enchape.estado === "en_proceso" && enchapeEnProceso === enchape.tipo && (
                      <>
                        {enchapePausado === enchape.tipo ? (
                          <Button
                            onClick={() => handleContinuarEnchape(enchape.tipo)}
                            variant="secondary"
                            className="flex-1"
                            size="lg"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Continuar
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePausarEnchape(enchape.tipo)}
                            variant="secondary"
                            className="flex-1"
                            size="lg"
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDetenerEnchape(enchape.tipo)}
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> {/* Changed from CheckCircle */}
                          Finalizar
                        </Button>
                      </>
                    )}

                    {enchape.estado === "completado" && (
                      <Badge variant="secondary" className="bg-green-500 text-white text-sm py-2 px-4">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> {/* Changed from CheckCircle */}
                        Completado
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {todosCompletos && (
          <Button onClick={handleFinalizarEnchape} size="lg" className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="mr-2 h-5 w-5" /> {/* Changed from CheckCircle */}
            Finalizar Enchape y Completar Trabajo
          </Button>
        )}
      </div>
    )
  }

  return null
}
