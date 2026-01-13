"use server"

import { createClient } from "@/lib/supabase/server"
import type { MetricaBaseline } from "@/lib/supabase/types"

export async function obtenerMetricasBaseline(): Promise<MetricaBaseline[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("metricas_baseline").select("*").order("tipo_operacion")

  if (error) return []
  return data as MetricaBaseline[]
}

export async function obtenerMetricaBaseline(
  tipoOperacion: "corte" | "enchape_rigido" | "enchape_flexible",
  tipoMaterial?: string,
): Promise<MetricaBaseline | null> {
  const supabase = await createClient()

  let query = supabase.from("metricas_baseline").select("*").eq("tipo_operacion", tipoOperacion)

  if (tipoMaterial) {
    query = query.eq("tipo_material", tipoMaterial)
  }

  const { data, error } = await query.single()

  if (error || !data) return null
  return data as MetricaBaseline
}

export async function actualizarMetricaBaseline(
  tipoOperacion: "corte" | "enchape_rigido" | "enchape_flexible",
  tiempoNuevo: number,
  tipoMaterial?: string,
  cantidadLaminas?: number,
  usuarioBaselineId?: string,
): Promise<boolean> {
  const supabase = await createClient()

  // Buscar si existe la métrica
  let query = supabase.from("metricas_baseline").select("*").eq("tipo_operacion", tipoOperacion)

  if (tipoMaterial) {
    query = query.eq("tipo_material", tipoMaterial)
  }

  const { data: existente } = await query.single()

  if (existente) {
    // Actualizar promedio con nueva muestra
    const nuevoPromedio = Math.round(
      (existente.tiempo_promedio * existente.muestras + tiempoNuevo) / (existente.muestras + 1),
    )
    const nuevoMinimo = existente.tiempo_minimo ? Math.min(existente.tiempo_minimo, tiempoNuevo) : tiempoNuevo
    const nuevoMaximo = existente.tiempo_maximo ? Math.max(existente.tiempo_maximo, tiempoNuevo) : tiempoNuevo

    const { error } = await supabase
      .from("metricas_baseline")
      .update({
        tiempo_promedio: nuevoPromedio,
        tiempo_minimo: nuevoMinimo,
        tiempo_maximo: nuevoMaximo,
        muestras: existente.muestras + 1,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq("id", existente.id)

    return !error
  } else {
    // Crear nueva métrica
    const { error } = await supabase.from("metricas_baseline").insert({
      tipo_operacion: tipoOperacion,
      tipo_material: tipoMaterial || null,
      cantidad_laminas: cantidadLaminas || null,
      tiempo_promedio: tiempoNuevo,
      tiempo_minimo: tiempoNuevo,
      tiempo_maximo: tiempoNuevo,
      muestras: 1,
      usuario_baseline_id: usuarioBaselineId || null,
    })

    return !error
  }
}

export async function calcularRendimiento(
  tiempoReal: number,
  tipoOperacion: "corte" | "enchape_rigido" | "enchape_flexible",
  tipoMaterial?: string,
): Promise<{ porcentaje: number; comparacion: "mejor" | "igual" | "peor" } | null> {
  const metrica = await obtenerMetricaBaseline(tipoOperacion, tipoMaterial)

  if (!metrica) return null

  const diferencia = tiempoReal - metrica.tiempo_promedio
  const porcentaje = Math.round((diferencia / metrica.tiempo_promedio) * 100)

  let comparacion: "mejor" | "igual" | "peor" = "igual"
  if (porcentaje < -5) {
    comparacion = "mejor" // Más rápido que el baseline
  } else if (porcentaje > 5) {
    comparacion = "peor" // Más lento que el baseline
  }

  return { porcentaje, comparacion }
}
