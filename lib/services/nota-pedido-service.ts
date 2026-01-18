"use server"

import { createClient } from "@/lib/supabase/server"
import type { NotaPedido, RegistroCorte, RegistroEnchape } from "@/lib/supabase/types"

export async function crearNotaPedido(
  data: Omit<
    NotaPedido,
    | "id"
    | "fecha_creacion"
    | "corte_completado"
    | "enchape_completado"
    | "tiempo_pausado_corte"
    | "tiempo_pausado_enchape"
  >,
): Promise<NotaPedido | null> {
  const supabase = await createClient()

  const { data: nota, error } = await supabase
    .from("notas_pedido")
    .insert({
      ...data,
      corte_completado: false,
      enchape_completado: false,
      tiempo_pausado_corte: 0,
      tiempo_pausado_enchape: 0,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating nota:", error)
    return null
  }
  return nota as NotaPedido
}

export async function obtenerNotaPedido(id: string): Promise<NotaPedido | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("notas_pedido").select("*").eq("id", id).single()

  if (error || !data) return null
  return data as NotaPedido
}

export async function obtenerTodasLasNotas(): Promise<NotaPedido[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("notas_pedido").select("*").order("fecha_creacion", { ascending: false })

  if (error) return []
  return data as NotaPedido[]
}

export async function obtenerNotasPendientes(): Promise<NotaPedido[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notas_pedido")
    .select("*")
    .not("estado", "in", '("completado","cerrado")')
    .order("fecha_corte", { ascending: true })

  if (error) return []
  return data as NotaPedido[]
}

export async function obtenerNotasPorAsesor(asesorId: string): Promise<NotaPedido[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notas_pedido")
    .select("*")
    .eq("asesor_id", asesorId)
    .order("fecha_creacion", { ascending: false })

  if (error) return []
  return data as NotaPedido[]
}

export async function actualizarNotaPedido(id: string, updates: Partial<NotaPedido>): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("notas_pedido").update(updates).eq("id", id)

  return !error
}

export async function iniciarProcesoCorte(
  notaId: string,
  cortadorId: string,
  cortadorNombre: string,
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("notas_pedido")
    .update({
      estado: "en_corte",
      cortador_asignado: cortadorId,
      cortador_nombre: cortadorNombre,
      fecha_inicio_proceso: new Date().toISOString(),
    })
    .eq("id", notaId)

  return !error
}

export async function finalizarProcesoCorte(
  notaId: string,
  tiempoTotal: number,
  tiempoPausado: number,
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("notas_pedido")
    .update({
      tiempo_corte: tiempoTotal,
      tiempo_pausado_corte: tiempoPausado,
      fecha_fin_corte: new Date().toISOString(),
      corte_completado: true,
      estado: "cortado",
    })
    .eq("id", notaId)

  return !error
}

export async function iniciarProcesoEnchape(notaId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("notas_pedido")
    .update({
      estado: "en_enchape",
      fecha_inicio_enchape: new Date().toISOString(),
    })
    .eq("id", notaId)

  return !error
}

export async function finalizarProcesoEnchape(
  notaId: string,
  tiempoRigido: number,
  tiempoFlexible: number,
  tiempoPausado: number,
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("notas_pedido")
    .update({
      tiempo_enchape_rigido: tiempoRigido,
      tiempo_enchape_flexible: tiempoFlexible,
      tiempo_pausado_enchape: tiempoPausado,
      fecha_fin_enchape: new Date().toISOString(),
      enchape_completado: true,
      estado: "completado",
    })
    .eq("id", notaId)

  return !error
}

export async function cerrarNota(notaId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("notas_pedido").update({ estado: "cerrado" }).eq("id", notaId)

  return !error
}

// Registros de corte por lámina
export async function crearRegistrosCorte(notaId: string, cantidadLaminas: number): Promise<RegistroCorte[]> {
  const supabase = await createClient()

  const registros = Array.from({ length: cantidadLaminas }, (_, i) => ({
    nota_id: notaId,
    numero_lamina: i + 1,
    estado: "pendiente" as const,
    tiempo_pausado: 0,
  }))

  const { data, error } = await supabase.from("registros_corte").insert(registros).select()

  if (error) return []
  return data as RegistroCorte[]
}

export async function obtenerRegistrosCorte(notaId: string): Promise<RegistroCorte[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("registros_corte")
    .select("*")
    .eq("nota_id", notaId)
    .order("numero_lamina")

  if (error) return []
  return data as RegistroCorte[]
}

export async function actualizarRegistroCorte(id: string, updates: Partial<RegistroCorte>): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("registros_corte").update(updates).eq("id", id)

  return !error
}

// Registros de enchape
export async function crearRegistrosEnchape(
  notaId: string,
  tieneRigido: boolean,
  tieneFlexible: boolean,
): Promise<RegistroEnchape[]> {
  const supabase = await createClient()

  const registros: Array<{
    nota_id: string
    tipo: "rigido" | "flexible"
    estado: "pendiente"
    tiempo_pausado: number
  }> = []
  if (tieneRigido) {
    registros.push({ nota_id: notaId, tipo: "rigido", estado: "pendiente", tiempo_pausado: 0 })
  }
  if (tieneFlexible) {
    registros.push({ nota_id: notaId, tipo: "flexible", estado: "pendiente", tiempo_pausado: 0 })
  }

  if (registros.length === 0) return []

  const { data, error } = await supabase.from("registros_enchape").insert(registros).select()

  if (error) return []
  return data as RegistroEnchape[]
}

export async function obtenerRegistrosEnchape(notaId: string): Promise<RegistroEnchape[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("registros_enchape").select("*").eq("nota_id", notaId)

  if (error) return []
  return data as RegistroEnchape[]
}

export async function actualizarRegistroEnchape(id: string, updates: Partial<RegistroEnchape>): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("registros_enchape").update(updates).eq("id", id)

  return !error
}
