"use server"

import { createClient } from "@/lib/supabase/server"
import type { Turno, Pausa } from "@/lib/supabase/types"

export async function obtenerTurnoActivo(cortadorId: string): Promise<Turno | null> {
  const supabase = await createClient()
  const hoy = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("turnos")
    .select("*")
    .eq("cortador_id", cortadorId)
    .eq("fecha", hoy)
    .eq("estado", "activo")
    .single()

  if (error || !data) return null
  return data as Turno
}

export async function iniciarTurno(cortadorId: string, duracionHoras = 8): Promise<Turno | null> {
  const supabase = await createClient()
  const hoy = new Date().toISOString().split("T")[0]

  // Verificar si ya existe un turno activo
  const turnoExistente = await obtenerTurnoActivo(cortadorId)
  if (turnoExistente) return turnoExistente

  const { data, error } = await supabase
    .from("turnos")
    .insert({
      cortador_id: cortadorId,
      fecha: hoy,
      hora_inicio: new Date().toISOString(),
      duracion_turno: duracionHoras * 3600, // Convertir a segundos
      tiempo_activo: 0,
      tiempo_pausado: 0,
      tiempo_muerto: 0,
      estado: "activo",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating turno:", error)
    return null
  }
  return data as Turno
}

export async function actualizarTurno(id: string, updates: Partial<Turno>): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("turnos").update(updates).eq("id", id)

  return !error
}

export async function finalizarTurno(id: string): Promise<boolean> {
  const supabase = await createClient()

  // Obtener el turno actual
  const { data: turno, error: fetchError } = await supabase.from("turnos").select("*").eq("id", id).single()

  if (fetchError || !turno) return false

  const horaFin = new Date()
  const horaInicio = new Date(turno.hora_inicio)
  const duracionReal = Math.floor((horaFin.getTime() - horaInicio.getTime()) / 1000)

  // Calcular tiempo muerto (tiempo no trabajado - tiempo pausado)
  const tiempoMuerto = Math.max(0, duracionReal - turno.tiempo_activo - turno.tiempo_pausado)

  const { error } = await supabase
    .from("turnos")
    .update({
      hora_fin: horaFin.toISOString(),
      tiempo_muerto: tiempoMuerto,
      estado: "finalizado",
    })
    .eq("id", id)

  return !error
}

export async function obtenerTurnosPorCortador(cortadorId: string, limite = 30): Promise<Turno[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("turnos")
    .select("*")
    .eq("cortador_id", cortadorId)
    .order("fecha", { ascending: false })
    .limit(limite)

  if (error) return []
  return data as Turno[]
}

// Pausas
export async function registrarPausa(data: {
  registroCorteId?: string
  registroEnchapeId?: string
  turnoId?: string
  motivo?: string
}): Promise<Pausa | null> {
  const supabase = await createClient()

  const { data: pausa, error } = await supabase
    .from("pausas")
    .insert({
      registro_corte_id: data.registroCorteId || null,
      registro_enchape_id: data.registroEnchapeId || null,
      turno_id: data.turnoId || null,
      hora_inicio: new Date().toISOString(),
      motivo: data.motivo || null,
    })
    .select()
    .single()

  if (error) return null
  return pausa as Pausa
}

export async function finalizarPausa(id: string): Promise<number> {
  const supabase = await createClient()

  // Obtener la pausa actual
  const { data: pausa, error: fetchError } = await supabase.from("pausas").select("*").eq("id", id).single()

  if (fetchError || !pausa) return 0

  const horaFin = new Date()
  const horaInicio = new Date(pausa.hora_inicio)
  const duracion = Math.floor((horaFin.getTime() - horaInicio.getTime()) / 1000)

  const { error } = await supabase
    .from("pausas")
    .update({
      hora_fin: horaFin.toISOString(),
      duracion: duracion,
    })
    .eq("id", id)

  if (error) return 0
  return duracion
}

export async function obtenerPausaActiva(registroCorteId?: string, registroEnchapeId?: string): Promise<Pausa | null> {
  const supabase = await createClient()

  let query = supabase.from("pausas").select("*").is("hora_fin", null)

  if (registroCorteId) {
    query = query.eq("registro_corte_id", registroCorteId)
  } else if (registroEnchapeId) {
    query = query.eq("registro_enchape_id", registroEnchapeId)
  }

  const { data, error } = await query.single()

  if (error || !data) return null
  return data as Pausa
}
