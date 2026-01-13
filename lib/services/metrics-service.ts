"use server"

import { createClient } from "@/lib/supabase/server"

export interface RendimientoCortador {
  cortador_id: string
  cortador_nombre: string
  total_trabajos: number
  trabajos_completados: number
  tiempo_promedio_corte: number
  tiempo_promedio_enchape: number
  tiempo_promedio_pausado: number
  total_laminas_cortadas: number
  segundos_por_lamina: number
}

export interface MetricaTurno {
  turno_id: string
  cortador_id: string
  cortador_nombre: string
  fecha: string
  hora_inicio: string
  hora_fin: string | null
  duracion_turno: number
  tiempo_activo: number
  tiempo_pausado: number
  tiempo_muerto: number
  porcentaje_productividad: number
  porcentaje_tiempo_muerto: number
}

export interface ResumenDiario {
  fecha: string
  notas_totales: number
  completadas: number
  pendientes: number
  en_proceso: number
  laminas_totales: number
  tiempo_promedio_corte: number
  tiempo_promedio_pausado: number
}

// Obtener rendimiento de todos los cortadores
export async function obtenerRendimientoCortadores(): Promise<RendimientoCortador[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("v_rendimiento_cortadores").select("*")

  if (error) {
    console.error("[v0] Error fetching rendimiento:", error)
    return []
  }

  return data as RendimientoCortador[]
}

// Obtener métricas de turnos
export async function obtenerMetricasTurnos(limite = 50): Promise<MetricaTurno[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("v_metricas_turnos").select("*").limit(limite)

  if (error) {
    console.error("[v0] Error fetching metricas turnos:", error)
    return []
  }

  return data as MetricaTurno[]
}

// Obtener resumen diario
export async function obtenerResumenDiario(dias = 30): Promise<ResumenDiario[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("v_resumen_diario").select("*").limit(dias)

  if (error) {
    console.error("[v0] Error fetching resumen diario:", error)
    return []
  }

  return data as ResumenDiario[]
}

// Obtener tiempo por material
export async function obtenerTiempoPorMaterial() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("v_tiempo_por_material").select("*")

  if (error) {
    console.error("[v0] Error fetching tiempo por material:", error)
    return []
  }

  return data
}

// Obtener comparación con baseline
export async function obtenerComparacionBaseline() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("v_comparacion_baseline").select("*")

  if (error) {
    console.error("[v0] Error fetching comparacion baseline:", error)
    return []
  }

  return data
}

// Obtener logs de auditoría (solo jefes)
export async function obtenerAuditLogs(limite = 100) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("audit_log")
    .select(
      `
      *,
      usuario:usuario_id (nombre, email)
    `,
    )
    .order("fecha_hora", { ascending: false })
    .limit(limite)

  if (error) {
    console.error("[v0] Error fetching audit logs:", error)
    return []
  }

  return data
}
