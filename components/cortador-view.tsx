"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  CheckCircle2,
  ArrowLeft,
  Pause,
  Scissors,
  Shield,
  Calendar,
  Download,
  FileText,
  Clock,
  Timer,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { NotaPedido, RegistroCorte, RegistroEnchape, Turno } from "@/lib/supabase/types"
import { format } from "date-fns"

interface LaminaCorteLocal {
  id: string
  numero: number
  estado: "pendiente" | "en_proceso" | "pausado" | "completado"
  horaInicio: Date | null
  horaFin: Date | null
  tiempoTotal: number
  tiempoPausado: number
  pausaActual: Date | null // Hora de inicio de pausa actual
}

interface EnchapeRegistroLocal {
  id: string
  tipo: "rigido" | "flexible"
  estado: "pendiente" | "en_proceso" | "pausado" | "completado"
  horaInicio: Date | null
  horaFin: Date | null
  tiempoTotal: number
  tiempoPausado: number
  pausaActual: Date | null
}

export function CortadorView() {
  const { user } = useAuth()
  const supabase = createClient()

  const [vistaActual, setVistaActual] = useState<"lista" | "seleccion" | "corte" | "enchape">("lista")
  const [notasPedido, setNotasPedido] = useState<NotaPedido[]>([])
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotaPedido | null>(null)

  const [laminasCorte, setLaminasCorte] = useState<LaminaCorteLocal[]>([])
  const [laminaEnProceso, setLaminaEnProceso] = useState<number | null>(null)
  const [tiempoActual, setTiempoActual] = useState(0)
  const [tiempoPausadoActual, setTiempoPausadoActual] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [enchapesRegistro, setEnchapesRegistro] = useState<EnchapeRegistroLocal[]>([])
  const [enchapeEnProceso, setEnchapeEnProceso] = useState<"rigido" | "flexible" | null>(null)
  const [tiempoEnchapeActual, setTiempoEnchapeActual] = useState(0)
  const [tiempoPausadoEnchapeActual, setTiempoPausadoEnchapeActual] = useState(0)
  const intervalEnchapeRef = useRef<NodeJS.Timeout | null>(null)

  const [diaSeleccionado, setDiaSeleccionado] = useState<string>("todos")

  const [turnoActivo, setTurnoActivo] = useState<Turno | null>(null)

  // Cargar notas desde Supabase
  const cargarNotas = useCallback(async () => {
    const { data, error } = await supabase
      .from("notas_pedido")
      .select("*")
      .not("estado", "in", '("completado","cerrado")')
      .order("fecha_corte", { ascending: true })

    if (!error && data) {
      setNotasPedido(data as NotaPedido[])
    }
  }, [supabase])

  // Cargar turno activo
  const cargarTurnoActivo = useCallback(async () => {
    if (!user) return

    const hoy = new Date().toISOString().split("T")[0]
    const { data } = await supabase
      .from("turnos")
      .select("*")
      .eq("cortador_id", user.id)
      .eq("fecha", hoy)
      .eq("estado", "activo")
      .single()

    if (data) {
      setTurnoActivo(data as Turno)
    }
  }, [supabase, user])

  useEffect(() => {
    cargarNotas()
    cargarTurnoActivo()
    const interval = setInterval(cargarNotas, 5000)
    return () => clearInterval(interval)
  }, [cargarNotas, cargarTurnoActivo])

  // Timer para lámina en proceso
  useEffect(() => {
    if (laminaEnProceso !== null) {
      const lamina = laminasCorte.find((l) => l.numero === laminaEnProceso)
      if (lamina?.horaInicio) {
        intervalRef.current = setInterval(() => {
          const ahora = new Date()

          if (lamina.estado === "pausado" && lamina.pausaActual) {
            // Calcular tiempo pausado acumulado
            const tiempoPausaActual = Math.floor((ahora.getTime() - lamina.pausaActual.getTime()) / 1000)
            setTiempoPausadoActual(lamina.tiempoPausado + tiempoPausaActual)
          } else if (lamina.estado === "en_proceso") {
            // Calcular tiempo activo (total - pausado)
            const tiempoTranscurrido = Math.floor((ahora.getTime() - lamina.horaInicio!.getTime()) / 1000)
            setTiempoActual(tiempoTranscurrido - lamina.tiempoPausado)
            setTiempoPausadoActual(lamina.tiempoPausado)
          }
        }, 1000)
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setTiempoActual(0)
      setTiempoPausadoActual(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [laminaEnProceso, laminasCorte])

  // Timer para enchape en proceso
  useEffect(() => {
    if (enchapeEnProceso) {
      const enchape = enchapesRegistro.find((e) => e.tipo === enchapeEnProceso)
      if (enchape?.horaInicio) {
        intervalEnchapeRef.current = setInterval(() => {
          const ahora = new Date()

          if (enchape.estado === "pausado" && enchape.pausaActual) {
            const tiempoPausaActual = Math.floor((ahora.getTime() - enchape.pausaActual.getTime()) / 1000)
            setTiempoPausadoEnchapeActual(enchape.tiempoPausado + tiempoPausaActual)
          } else if (enchape.estado === "en_proceso") {
            const tiempoTranscurrido = Math.floor((ahora.getTime() - enchape.horaInicio!.getTime()) / 1000)
            setTiempoEnchapeActual(tiempoTranscurrido - enchape.tiempoPausado)
            setTiempoPausadoEnchapeActual(enchape.tiempoPausado)
          }
        }, 1000)
      }
    } else {
      if (intervalEnchapeRef.current) {
        clearInterval(intervalEnchapeRef.current)
        intervalEnchapeRef.current = null
      }
      setTiempoEnchapeActual(0)
      setTiempoPausadoEnchapeActual(0)
    }
    return () => {
      if (intervalEnchapeRef.current) {
        clearInterval(intervalEnchapeRef.current)
      }
    }
  }, [enchapeEnProceso, enchapesRegistro])

  const handleIniciarTurno = async () => {
    if (!user) return

    const hoy = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("turnos")
      .insert({
        cortador_id: user.id,
        fecha: hoy,
        hora_inicio: new Date().toISOString(),
        duracion_turno: 28800,
        tiempo_activo: 0,
        tiempo_pausado: 0,
        tiempo_muerto: 0,
        estado: "activo",
      })
      .select()
      .single()

    if (!error && data) {
      setTurnoActivo(data as Turno)
    }
  }

  const handleFinalizarTurno = async () => {
    if (!turnoActivo) return

    const horaFin = new Date()
    const horaInicio = new Date(turnoActivo.hora_inicio)
    const duracionReal = Math.floor((horaFin.getTime() - horaInicio.getTime()) / 1000)
    const tiempoMuerto = Math.max(0, duracionReal - turnoActivo.tiempo_activo - turnoActivo.tiempo_pausado)

    await supabase
      .from("turnos")
      .update({
        hora_fin: horaFin.toISOString(),
        tiempo_muerto: tiempoMuerto,
        estado: "finalizado",
      })
      .eq("id", turnoActivo.id)

    setTurnoActivo(null)
  }

  const handleSeleccionarNota = async (nota: NotaPedido) => {
    console.log("[v0] Nota seleccionada:", nota)
    setNotaSeleccionada(nota)

    // Cargar registros de corte existentes o crear nuevos
    const { data: registrosCorte } = await supabase
      .from("registros_corte")
      .select("*")
      .eq("nota_id", nota.id)
      .order("numero_lamina")

    if (registrosCorte && registrosCorte.length > 0) {
      // Usar registros existentes
      const laminas: LaminaCorteLocal[] = registrosCorte.map((r: RegistroCorte) => ({
        id: r.id,
        numero: r.numero_lamina,
        estado: r.estado,
        horaInicio: r.hora_inicio ? new Date(r.hora_inicio) : null,
        horaFin: r.hora_fin ? new Date(r.hora_fin) : null,
        tiempoTotal: r.tiempo_total || 0,
        tiempoPausado: r.tiempo_pausado || 0,
        pausaActual: null,
      }))
      setLaminasCorte(laminas)
    } else {
      // Crear nuevos registros
      const nuevosRegistros = Array.from({ length: nota.cantidad_laminas }, (_, i) => ({
        nota_id: nota.id,
        numero_lamina: i + 1,
        estado: "pendiente" as const,
        tiempo_pausado: 0,
      }))

      const { data: insertados } = await supabase.from("registros_corte").insert(nuevosRegistros).select()

      if (insertados) {
        const laminas: LaminaCorteLocal[] = insertados.map((r: RegistroCorte) => ({
          id: r.id,
          numero: r.numero_lamina,
          estado: "pendiente" as const,
          horaInicio: null,
          horaFin: null,
          tiempoTotal: 0,
          tiempoPausado: 0,
          pausaActual: null,
        }))
        setLaminasCorte(laminas)
      }
    }

    // Cargar registros de enchape existentes o crear nuevos
    const { data: registrosEnchape } = await supabase.from("registros_enchape").select("*").eq("nota_id", nota.id)

    if (registrosEnchape && registrosEnchape.length > 0) {
      const enchapes: EnchapeRegistroLocal[] = registrosEnchape.map((r: RegistroEnchape) => ({
        id: r.id,
        tipo: r.tipo,
        estado: r.estado,
        horaInicio: r.hora_inicio ? new Date(r.hora_inicio) : null,
        horaFin: r.hora_fin ? new Date(r.hora_fin) : null,
        tiempoTotal: r.tiempo_total || 0,
        tiempoPausado: r.tiempo_pausado || 0,
        pausaActual: null,
      }))
      setEnchapesRegistro(enchapes)
    } else {
      const nuevosEnchapes: Array<{
        nota_id: string
        tipo: "rigido" | "flexible"
        estado: "pendiente"
        tiempo_pausado: number
      }> = []
      if (nota.canto_rigido > 0) {
        nuevosEnchapes.push({ nota_id: nota.id, tipo: "rigido", estado: "pendiente", tiempo_pausado: 0 })
      }
      if (nota.canto_flexible > 0) {
        nuevosEnchapes.push({ nota_id: nota.id, tipo: "flexible", estado: "pendiente", tiempo_pausado: 0 })
      }

      if (nuevosEnchapes.length > 0) {
        const { data: insertados } = await supabase.from("registros_enchape").insert(nuevosEnchapes).select()

        if (insertados) {
          const enchapes: EnchapeRegistroLocal[] = insertados.map((r: RegistroEnchape) => ({
            id: r.id,
            tipo: r.tipo,
            estado: "pendiente" as const,
            horaInicio: null,
            horaFin: null,
            tiempoTotal: 0,
            tiempoPausado: 0,
            pausaActual: null,
          }))
          setEnchapesRegistro(enchapes)
        }
      } else {
        setEnchapesRegistro([])
      }
    }

    if (!nota.corte_completado) {
      setVistaActual("seleccion")
    } else {
      setVistaActual("enchape")
    }
  }

  const handleIniciarCorte = async () => {
    if (!notaSeleccionada || !user) return
    console.log("[v0] Iniciando proceso de corte")

    await supabase
      .from("notas_pedido")
      .update({
        estado: "en_corte",
        cortador_asignado: user.id,
        cortador_nombre: user.nombre,
        fecha_inicio_proceso: new Date().toISOString(),
      })
      .eq("id", notaSeleccionada.id)

    setVistaActual("corte")
  }

  const handleIniciarLamina = async (numeroLamina: number) => {
    console.log("[v0] Iniciando lámina:", numeroLamina)
    const lamina = laminasCorte.find((l) => l.numero === numeroLamina)
    if (!lamina) return

    const ahora = new Date()

    // Actualizar en Supabase
    await supabase
      .from("registros_corte")
      .update({
        estado: "en_proceso",
        hora_inicio: ahora.toISOString(),
        cortador_id: user?.id,
      })
      .eq("id", lamina.id)

    setLaminasCorte((prev) =>
      prev.map((l) =>
        l.numero === numeroLamina
          ? {
              ...l,
              estado: "en_proceso" as const,
              horaInicio: ahora,
            }
          : l,
      ),
    )
    setLaminaEnProceso(numeroLamina)
  }

  const handlePausarLamina = async (numeroLamina: number) => {
    console.log("[v0] Pausando lámina:", numeroLamina)
    const lamina = laminasCorte.find((l) => l.numero === numeroLamina)
    if (!lamina) return

    const ahora = new Date()

    // Registrar pausa en Supabase
    await supabase.from("pausas").insert({
      registro_corte_id: lamina.id,
      hora_inicio: ahora.toISOString(),
    })

    await supabase.from("registros_corte").update({ estado: "pausado" }).eq("id", lamina.id)

    setLaminasCorte((prev) =>
      prev.map((l) =>
        l.numero === numeroLamina
          ? {
              ...l,
              estado: "pausado" as const,
              pausaActual: ahora,
            }
          : l,
      ),
    )
  }

  const handleContinuarLamina = async (numeroLamina: number) => {
    console.log("[v0] Continuando lámina:", numeroLamina)
    const lamina = laminasCorte.find((l) => l.numero === numeroLamina)
    if (!lamina || !lamina.pausaActual) return

    const ahora = new Date()
    const duracionPausa = Math.floor((ahora.getTime() - lamina.pausaActual.getTime()) / 1000)
    const nuevoTiempoPausado = lamina.tiempoPausado + duracionPausa

    // Finalizar pausa en Supabase
    const { data: pausaActiva } = await supabase
      .from("pausas")
      .select("*")
      .eq("registro_corte_id", lamina.id)
      .is("hora_fin", null)
      .single()

    if (pausaActiva) {
      await supabase
        .from("pausas")
        .update({
          hora_fin: ahora.toISOString(),
          duracion: duracionPausa,
        })
        .eq("id", pausaActiva.id)
    }

    await supabase
      .from("registros_corte")
      .update({
        estado: "en_proceso",
        tiempo_pausado: nuevoTiempoPausado,
      })
      .eq("id", lamina.id)

    setLaminasCorte((prev) =>
      prev.map((l) =>
        l.numero === numeroLamina
          ? {
              ...l,
              estado: "en_proceso" as const,
              tiempoPausado: nuevoTiempoPausado,
              pausaActual: null,
            }
          : l,
      ),
    )
  }

  const handleDetenerLamina = async (numeroLamina: number) => {
    console.log("[v0] Finalizando lámina:", numeroLamina)
    const lamina = laminasCorte.find((l) => l.numero === numeroLamina)
    if (!lamina || !lamina.horaInicio) return

    const ahora = new Date()

    // Si estaba pausado, calcular tiempo de pausa final
    let tiempoPausadoFinal = lamina.tiempoPausado
    if (lamina.pausaActual) {
      const duracionPausaFinal = Math.floor((ahora.getTime() - lamina.pausaActual.getTime()) / 1000)
      tiempoPausadoFinal += duracionPausaFinal

      // Finalizar pausa activa
      const { data: pausaActiva } = await supabase
        .from("pausas")
        .select("*")
        .eq("registro_corte_id", lamina.id)
        .is("hora_fin", null)
        .single()

      if (pausaActiva) {
        await supabase
          .from("pausas")
          .update({
            hora_fin: ahora.toISOString(),
            duracion: duracionPausaFinal,
          })
          .eq("id", pausaActiva.id)
      }
    }

    const tiempoTotalBruto = Math.floor((ahora.getTime() - lamina.horaInicio.getTime()) / 1000)
    const tiempoTotalNeto = tiempoTotalBruto - tiempoPausadoFinal

    // Actualizar en Supabase
    await supabase
      .from("registros_corte")
      .update({
        estado: "completado",
        hora_fin: ahora.toISOString(),
        tiempo_total: tiempoTotalNeto,
        tiempo_pausado: tiempoPausadoFinal,
      })
      .eq("id", lamina.id)

    // Actualizar tiempo activo del turno
    if (turnoActivo) {
      await supabase
        .from("turnos")
        .update({
          tiempo_activo: turnoActivo.tiempo_activo + tiempoTotalNeto,
          tiempo_pausado: turnoActivo.tiempo_pausado + tiempoPausadoFinal,
        })
        .eq("id", turnoActivo.id)

      setTurnoActivo((prev) =>
        prev
          ? {
              ...prev,
              tiempo_activo: prev.tiempo_activo + tiempoTotalNeto,
              tiempo_pausado: prev.tiempo_pausado + tiempoPausadoFinal,
            }
          : null,
      )
    }

    setLaminasCorte((prev) =>
      prev.map((l) =>
        l.numero === numeroLamina
          ? {
              ...l,
              estado: "completado" as const,
              horaFin: ahora,
              tiempoTotal: tiempoTotalNeto,
              tiempoPausado: tiempoPausadoFinal,
              pausaActual: null,
            }
          : l,
      ),
    )
    setLaminaEnProceso(null)
    setTiempoActual(0)
    setTiempoPausadoActual(0)
  }

  const handleFinalizarCorte = async () => {
    console.log("[v0] Finalizando corte completo")
    if (!notaSeleccionada) return

    const tiempoTotalNeto = laminasCorte.reduce((total, lamina) => total + (lamina.tiempoTotal || 0), 0)
    const tiempoTotalPausado = laminasCorte.reduce((total, lamina) => total + (lamina.tiempoPausado || 0), 0)

    await supabase
      .from("notas_pedido")
      .update({
        tiempo_corte: tiempoTotalNeto,
        tiempo_pausado_corte: tiempoTotalPausado,
        fecha_fin_corte: new Date().toISOString(),
        corte_completado: true,
        estado: "cortado",
      })
      .eq("id", notaSeleccionada.id)

    if (user?.es_baseline) {
      await actualizarBaseline(
        "corte",
        tiempoTotalNeto,
        notaSeleccionada.tipo_material,
        notaSeleccionada.cantidad_laminas,
      )
    }

    const requiereEnchape = notaSeleccionada.canto_rigido > 0 || notaSeleccionada.canto_flexible > 0

    if (requiereEnchape) {
      setVistaActual("enchape")
    } else {
      cargarNotas()
      setVistaActual("lista")
      setNotaSeleccionada(null)
    }
  }

  // Funciones de enchape similares con tracking de pausas
  const handleIniciarEnchapeRegistro = async (tipo: "rigido" | "flexible") => {
    console.log("[v0] Iniciando enchape:", tipo)
    const enchape = enchapesRegistro.find((e) => e.tipo === tipo)
    if (!enchape) return

    const ahora = new Date()

    await supabase
      .from("registros_enchape")
      .update({
        estado: "en_proceso",
        hora_inicio: ahora.toISOString(),
        cortador_id: user?.id,
      })
      .eq("id", enchape.id)

    // Actualizar estado de la nota si es el primer enchape
    if (!notaSeleccionada?.fecha_inicio_enchape) {
      await supabase
        .from("notas_pedido")
        .update({
          estado: "en_enchape",
          fecha_inicio_enchape: ahora.toISOString(),
        })
        .eq("id", notaSeleccionada?.id)
    }

    setEnchapesRegistro((prev) =>
      prev.map((e) =>
        e.tipo === tipo
          ? {
              ...e,
              estado: "en_proceso" as const,
              horaInicio: ahora,
            }
          : e,
      ),
    )
    setEnchapeEnProceso(tipo)
  }

  const handlePausarEnchape = async (tipo: "rigido" | "flexible") => {
    console.log("[v0] Pausando enchape:", tipo)
    const enchape = enchapesRegistro.find((e) => e.tipo === tipo)
    if (!enchape) return

    const ahora = new Date()

    await supabase.from("pausas").insert({
      registro_enchape_id: enchape.id,
      hora_inicio: ahora.toISOString(),
    })

    await supabase.from("registros_enchape").update({ estado: "pausado" }).eq("id", enchape.id)

    setEnchapesRegistro((prev) =>
      prev.map((e) =>
        e.tipo === tipo
          ? {
              ...e,
              estado: "pausado" as const,
              pausaActual: ahora,
            }
          : e,
      ),
    )
  }

  const handleContinuarEnchape = async (tipo: "rigido" | "flexible") => {
    console.log("[v0] Continuando enchape:", tipo)
    const enchape = enchapesRegistro.find((e) => e.tipo === tipo)
    if (!enchape || !enchape.pausaActual) return

    const ahora = new Date()
    const duracionPausa = Math.floor((ahora.getTime() - enchape.pausaActual.getTime()) / 1000)
    const nuevoTiempoPausado = enchape.tiempoPausado + duracionPausa

    const { data: pausaActiva } = await supabase
      .from("pausas")
      .select("*")
      .eq("registro_enchape_id", enchape.id)
      .is("hora_fin", null)
      .single()

    if (pausaActiva) {
      await supabase
        .from("pausas")
        .update({
          hora_fin: ahora.toISOString(),
          duracion: duracionPausa,
        })
        .eq("id", pausaActiva.id)
    }

    await supabase
      .from("registros_enchape")
      .update({
        estado: "en_proceso",
        tiempo_pausado: nuevoTiempoPausado,
      })
      .eq("id", enchape.id)

    setEnchapesRegistro((prev) =>
      prev.map((e) =>
        e.tipo === tipo
          ? {
              ...e,
              estado: "en_proceso" as const,
              tiempoPausado: nuevoTiempoPausado,
              pausaActual: null,
            }
          : e,
      ),
    )
  }

  const handleDetenerEnchape = async (tipo: "rigido" | "flexible") => {
    console.log("[v0] Finalizando enchape:", tipo)
    const enchape = enchapesRegistro.find((e) => e.tipo === tipo)
    if (!enchape || !enchape.horaInicio) return

    const ahora = new Date()

    let tiempoPausadoFinal = enchape.tiempoPausado
    if (enchape.pausaActual) {
      const duracionPausaFinal = Math.floor((ahora.getTime() - enchape.pausaActual.getTime()) / 1000)
      tiempoPausadoFinal += duracionPausaFinal

      const { data: pausaActiva } = await supabase
        .from("pausas")
        .select("*")
        .eq("registro_enchape_id", enchape.id)
        .is("hora_fin", null)
        .single()

      if (pausaActiva) {
        await supabase
          .from("pausas")
          .update({
            hora_fin: ahora.toISOString(),
            duracion: duracionPausaFinal,
          })
          .eq("id", pausaActiva.id)
      }
    }

    const tiempoTotalBruto = Math.floor((ahora.getTime() - enchape.horaInicio.getTime()) / 1000)
    const tiempoTotalNeto = tiempoTotalBruto - tiempoPausadoFinal

    await supabase
      .from("registros_enchape")
      .update({
        estado: "completado",
        hora_fin: ahora.toISOString(),
        tiempo_total: tiempoTotalNeto,
        tiempo_pausado: tiempoPausadoFinal,
      })
      .eq("id", enchape.id)

    // Actualizar tiempo activo del turno
    if (turnoActivo) {
      await supabase
        .from("turnos")
        .update({
          tiempo_activo: turnoActivo.tiempo_activo + tiempoTotalNeto,
          tiempo_pausado: turnoActivo.tiempo_pausado + tiempoPausadoFinal,
        })
        .eq("id", turnoActivo.id)

      setTurnoActivo((prev) =>
        prev
          ? {
              ...prev,
              tiempo_activo: prev.tiempo_activo + tiempoTotalNeto,
              tiempo_pausado: prev.tiempo_pausado + tiempoPausadoFinal,
            }
          : null,
      )
    }

    setEnchapesRegistro((prev) =>
      prev.map((e) =>
        e.tipo === tipo
          ? {
              ...e,
              estado: "completado" as const,
              horaFin: ahora,
              tiempoTotal: tiempoTotalNeto,
              tiempoPausado: tiempoPausadoFinal,
              pausaActual: null,
            }
          : e,
      ),
    )
    setEnchapeEnProceso(null)
    setTiempoEnchapeActual(0)
    setTiempoPausadoEnchapeActual(0)
  }

  const handleFinalizarEnchape = async () => {
    console.log("[v0] Finalizando enchape completo")
    if (!notaSeleccionada) return

    const tiempoRigido = enchapesRegistro.find((e) => e.tipo === "rigido")?.tiempoTotal || 0
    const tiempoFlexible = enchapesRegistro.find((e) => e.tipo === "flexible")?.tiempoTotal || 0
    const tiempoTotalPausado = enchapesRegistro.reduce((total, e) => total + (e.tiempoPausado || 0), 0)

    await supabase
      .from("notas_pedido")
      .update({
        tiempo_enchape_rigido: tiempoRigido,
        tiempo_enchape_flexible: tiempoFlexible,
        tiempo_pausado_enchape: tiempoTotalPausado,
        fecha_fin_enchape: new Date().toISOString(),
        enchape_completado: true,
        estado: "completado",
      })
      .eq("id", notaSeleccionada.id)

    if (user?.es_baseline) {
      if (tiempoRigido > 0) {
        await actualizarBaseline("enchape_rigido", tiempoRigido)
      }
      if (tiempoFlexible > 0) {
        await actualizarBaseline("enchape_flexible", tiempoFlexible)
      }
    }

    cargarNotas()
    setVistaActual("lista")
    setNotaSeleccionada(null)
  }

  const actualizarBaseline = async (
    tipoOperacion: "corte" | "enchape_rigido" | "enchape_flexible",
    tiempoNuevo: number,
    tipoMaterial?: string,
    cantidadLaminas?: number,
  ) => {
    const { data: existente } = await supabase
      .from("metricas_baseline")
      .select("*")
      .eq("tipo_operacion", tipoOperacion)
      .maybeSingle()

    if (existente) {
      const nuevoPromedio = Math.round(
        (existente.tiempo_promedio * existente.muestras + tiempoNuevo) / (existente.muestras + 1),
      )
      const nuevoMinimo = existente.tiempo_minimo ? Math.min(existente.tiempo_minimo, tiempoNuevo) : tiempoNuevo
      const nuevoMaximo = existente.tiempo_maximo ? Math.max(existente.tiempo_maximo, tiempoNuevo) : tiempoNuevo

      await supabase
        .from("metricas_baseline")
        .update({
          tiempo_promedio: nuevoPromedio,
          tiempo_minimo: nuevoMinimo,
          tiempo_maximo: nuevoMaximo,
          muestras: existente.muestras + 1,
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq("id", existente.id)
    } else {
      await supabase.from("metricas_baseline").insert({
        tipo_operacion: tipoOperacion,
        tipo_material: tipoMaterial || null,
        cantidad_laminas: cantidadLaminas || null,
        tiempo_promedio: tiempoNuevo,
        tiempo_minimo: tiempoNuevo,
        tiempo_maximo: tiempoNuevo,
        muestras: 1,
        usuario_baseline_id: user?.id || null,
      })
    }
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

  const obtenerDiaSemana = (fecha: string) => {
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    return dias[new Date(fecha).getDay()]
  }

  const estaRetrasada = (nota: NotaPedido) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaCorte = new Date(nota.fecha_corte)
    fechaCorte.setHours(0, 0, 0, 0)

    return fechaCorte < hoy && nota.estado !== "completado" && nota.estado !== "cerrado"
  }

  const notasFiltradas =
    diaSeleccionado === "todos"
      ? notasPedido
      : notasPedido.filter((nota) => obtenerDiaSemana(nota.fecha_corte) === diaSeleccionado)

  const notasRetrasadas = notasPedido.filter(estaRetrasada).length

  const descargarArchivo = (archivo: { nombre: string; url: string }) => {
    const link = document.createElement("a")
    link.href = archivo.url
    link.download = archivo.nombre
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const TurnoPanel = () => {
    if (!turnoActivo) {
      return (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">No hay turno activo</p>
                  <p className="text-sm text-muted-foreground">Inicia tu turno para comenzar a registrar tiempos</p>
                </div>
              </div>
              <Button onClick={handleIniciarTurno} className="bg-yellow-500 hover:bg-yellow-600 text-background">
                <Play className="mr-2 h-4 w-4" />
                Iniciar Turno
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    const horaInicio = new Date(turnoActivo.hora_inicio)
    const ahora = new Date()
    const tiempoTranscurrido = Math.floor((ahora.getTime() - horaInicio.getTime()) / 1000)
    const tiempoMuertoActual = Math.max(0, tiempoTranscurrido - turnoActivo.tiempo_activo - turnoActivo.tiempo_pausado)

    return (
      <Card className="mb-6 border-green-500/50 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-600">Turno Activo</p>
                <p className="text-sm text-muted-foreground">
                  Inicio: {format(horaInicio, "HH:mm")} - {format(new Date(), "dd/MM/yyyy")}
                </p>
              </div>
            </div>
            <Button onClick={handleFinalizarTurno} variant="outline" size="sm">
              Finalizar Turno
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-background">
              <p className="text-xs text-muted-foreground mb-1">Tiempo Activo</p>
              <p className="text-lg font-bold text-green-600">{formatearTiempo(turnoActivo.tiempo_activo)}</p>
            </div>
            <div className="p-3 rounded-lg bg-background">
              <p className="text-xs text-muted-foreground mb-1">Tiempo Pausado</p>
              <p className="text-lg font-bold text-yellow-600">{formatearTiempo(turnoActivo.tiempo_pausado)}</p>
            </div>
            <div className="p-3 rounded-lg bg-background">
              <p className="text-xs text-muted-foreground mb-1">Tiempo Muerto</p>
              <p className="text-lg font-bold text-red-600">{formatearTiempo(tiempoMuertoActual)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (vistaActual === "lista") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Panel del Cortador</h2>
          <p className="text-muted-foreground">Bienvenido, {user?.nombre}</p>
          {user?.es_baseline && (
            <Badge className="mt-2 bg-blue-500">Usuario Baseline - Tus tiempos se usan como referencia</Badge>
          )}
          {notasRetrasadas > 0 && (
            <Badge variant="destructive" className="mt-2 ml-2">
              {notasRetrasadas} nota{notasRetrasadas > 1 ? "s" : ""} retrasada{notasRetrasadas > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <TurnoPanel />

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
                            {obtenerDiaSemana(nota.fecha_corte)} - {format(new Date(nota.fecha_corte), "dd/MM/yyyy")}
                          </p>
                          {estaRetrasada(nota) && (
                            <Badge variant="destructive" className="mt-1 text-xs">
                              Retrasada
                            </Badge>
                          )}
                        </div>
                        <Badge
                          variant={nota.corte_completado ? "secondary" : "default"}
                          className={nota.corte_completado ? "bg-yellow-500 text-background" : ""}
                        >
                          {nota.corte_completado ? "Para Enchapar" : "Para Cortar"}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asesor:</span>
                          <span className="font-medium">{nota.asesor_nombre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Láminas:</span>
                          <span className="font-medium">{nota.cantidad_laminas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Material:</span>
                          <span className="font-medium capitalize">{nota.tipo_material}</span>
                        </div>
                        {(nota.canto_rigido > 0 || nota.canto_flexible > 0) && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">E. Flexible:</span>
                              <span className="font-medium">{nota.canto_flexible}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">E. Rígido:</span>
                              <span className="font-medium">{nota.canto_rigido}m</span>
                            </div>
                          </>
                        )}
                      </div>

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
          <p className="text-muted-foreground">{notaSeleccionada?.asesor_nombre}</p>
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
                  <p className="text-sm font-medium mt-2">{notaSeleccionada?.cantidad_laminas} tableros para cortar</p>
                </div>
                <Button size="lg" className="w-full">
                  Iniciar Corte
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border opacity-40">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-6">
                  <Shield className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Enchapadora Fravol</h3>
                  <p className="text-sm text-muted-foreground">Módulo de Enchape</p>
                  <p className="text-sm font-medium mt-2 text-muted-foreground">Completar corte primero</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {notaSeleccionada?.archivos_ped && notaSeleccionada?.archivos_ped.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-yellow-500">Planos de Corte Lepton</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Se encontraron {notaSeleccionada.archivos_ped.length} archivo(s) .ped adjuntos
            </p>
            <div className="space-y-2">
              {notaSeleccionada.archivos_ped.map((archivo, idx) => (
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
                      : lamina.estado === "pausado"
                        ? "border-l-yellow-500"
                        : "border-l-border"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg">Tablero {lamina.numero}</p>
                      <div className="text-sm">
                        {lamina.estado === "completado" && (
                          <div className="space-y-1">
                            <span className="text-green-600 font-medium block">
                              Completado - Activo: {formatearTiempo(lamina.tiempoTotal)}
                            </span>
                            {lamina.tiempoPausado > 0 && (
                              <span className="text-yellow-600 text-xs block">
                                Pausado: {formatearTiempo(lamina.tiempoPausado)}
                              </span>
                            )}
                          </div>
                        )}
                        {lamina.estado === "en_proceso" && laminaEnProceso === lamina.numero && (
                          <div className="space-y-1">
                            <span className="text-primary font-medium block">
                              En proceso - Activo: {formatearTiempo(tiempoActual)}
                            </span>
                            {tiempoPausadoActual > 0 && (
                              <span className="text-yellow-600 text-xs block">
                                Pausado: {formatearTiempo(tiempoPausadoActual)}
                              </span>
                            )}
                          </div>
                        )}
                        {lamina.estado === "pausado" && laminaEnProceso === lamina.numero && (
                          <div className="space-y-1">
                            <span className="text-yellow-600 font-medium flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              PAUSADO - {formatearTiempo(tiempoPausadoActual)}
                            </span>
                          </div>
                        )}
                        {lamina.estado === "pendiente" && <span className="text-muted-foreground">Sin iniciar</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {lamina.estado === "pendiente" && (
                      <Button onClick={() => handleIniciarLamina(lamina.numero)} className="flex-1" size="lg">
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar
                      </Button>
                    )}

                    {lamina.estado === "en_proceso" && laminaEnProceso === lamina.numero && (
                      <>
                        <Button
                          onClick={() => handlePausarLamina(lamina.numero)}
                          variant="secondary"
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-background"
                          size="lg"
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar
                        </Button>
                        <Button
                          onClick={() => handleDetenerLamina(lamina.numero)}
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Finalizar
                        </Button>
                      </>
                    )}

                    {lamina.estado === "pausado" && laminaEnProceso === lamina.numero && (
                      <>
                        <Button
                          onClick={() => handleContinuarLamina(lamina.numero)}
                          variant="secondary"
                          className="flex-1"
                          size="lg"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Continuar
                        </Button>
                        <Button
                          onClick={() => handleDetenerLamina(lamina.numero)}
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Finalizar
                        </Button>
                      </>
                    )}

                    {lamina.estado === "completado" && (
                      <Badge variant="secondary" className="bg-green-500 text-white text-sm py-2 px-4">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
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
            <CheckCircle2 className="mr-2 h-5 w-5" />
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
                      : enchape.estado === "pausado"
                        ? "border-l-yellow-500"
                        : "border-l-border"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg capitalize">Enchape {enchape.tipo}</p>
                      <p className="text-sm text-muted-foreground">
                        {enchape.tipo === "rigido"
                          ? `${notaSeleccionada?.canto_rigido}m`
                          : `${notaSeleccionada?.canto_flexible}m`}
                      </p>
                      <div className="text-sm">
                        {enchape.estado === "completado" && (
                          <div className="space-y-1">
                            <span className="text-green-600 font-medium block">
                              Completado - Activo: {formatearTiempo(enchape.tiempoTotal)}
                            </span>
                            {enchape.tiempoPausado > 0 && (
                              <span className="text-yellow-600 text-xs block">
                                Pausado: {formatearTiempo(enchape.tiempoPausado)}
                              </span>
                            )}
                          </div>
                        )}
                        {enchape.estado === "en_proceso" && enchapeEnProceso === enchape.tipo && (
                          <div className="space-y-1">
                            <span className="text-primary font-medium block">
                              En proceso - Activo: {formatearTiempo(tiempoEnchapeActual)}
                            </span>
                            {tiempoPausadoEnchapeActual > 0 && (
                              <span className="text-yellow-600 text-xs block">
                                Pausado: {formatearTiempo(tiempoPausadoEnchapeActual)}
                              </span>
                            )}
                          </div>
                        )}
                        {enchape.estado === "pausado" && enchapeEnProceso === enchape.tipo && (
                          <div className="space-y-1">
                            <span className="text-yellow-600 font-medium flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              PAUSADO - {formatearTiempo(tiempoPausadoEnchapeActual)}
                            </span>
                          </div>
                        )}
                        {enchape.estado === "pendiente" && <span className="text-muted-foreground">Sin iniciar</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {enchape.estado === "pendiente" && (
                      <Button onClick={() => handleIniciarEnchapeRegistro(enchape.tipo)} className="flex-1" size="lg">
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar
                      </Button>
                    )}

                    {enchape.estado === "en_proceso" && enchapeEnProceso === enchape.tipo && (
                      <>
                        <Button
                          onClick={() => handlePausarEnchape(enchape.tipo)}
                          variant="secondary"
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-background"
                          size="lg"
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar
                        </Button>
                        <Button
                          onClick={() => handleDetenerEnchape(enchape.tipo)}
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Finalizar
                        </Button>
                      </>
                    )}

                    {enchape.estado === "pausado" && enchapeEnProceso === enchape.tipo && (
                      <>
                        <Button
                          onClick={() => handleContinuarEnchape(enchape.tipo)}
                          variant="secondary"
                          className="flex-1"
                          size="lg"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Continuar
                        </Button>
                        <Button
                          onClick={() => handleDetenerEnchape(enchape.tipo)}
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Finalizar
                        </Button>
                      </>
                    )}

                    {enchape.estado === "completado" && (
                      <Badge variant="secondary" className="bg-green-500 text-white text-sm py-2 px-4">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
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
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Finalizar Enchape y Completar Trabajo
          </Button>
        )}
      </div>
    )
  }

  return null
}
