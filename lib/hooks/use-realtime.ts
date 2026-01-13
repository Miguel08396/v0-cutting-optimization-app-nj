"use client"

import { useEffect, useState, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

// Cliente singleton para Supabase en el cliente
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseClient
}

type TableName = "notas_pedido" | "turnos" | "registros_corte" | "registros_enchape" | "pausas" | "usuarios"

interface UseRealtimeOptions<T> {
  table: TableName
  filter?: {
    column: string
    value: string
  }
  onInsert?: (data: T) => void
  onUpdate?: (data: T) => void
  onDelete?: (data: T) => void
}

// Hook genérico para suscripción a cambios en tiempo real
export function useRealtimeSubscription<T extends { id: string }>({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions<T>) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()
    let channel: RealtimeChannel

    const setupSubscription = () => {
      const channelName = filter ? `${table}_${filter.column}_${filter.value}` : `${table}_changes`

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: table,
            filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
          },
          (payload: RealtimePostgresChangesPayload<T>) => {
            console.log("[v0] Realtime event:", payload.eventType, table)

            if (payload.eventType === "INSERT" && onInsert) {
              onInsert(payload.new as T)
            } else if (payload.eventType === "UPDATE" && onUpdate) {
              onUpdate(payload.new as T)
            } else if (payload.eventType === "DELETE" && onDelete) {
              onDelete(payload.old as T)
            }
          },
        )
        .subscribe((status) => {
          console.log("[v0] Realtime subscription status:", status)
          setIsConnected(status === "SUBSCRIBED")
        })
    }

    setupSubscription()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [table, filter, onInsert, onUpdate, onDelete])

  return { isConnected }
}

// Hook específico para notas de pedido con estado local
export function useRealtimeNotas(initialNotas: any[] = []) {
  const [notas, setNotas] = useState(initialNotas)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const handleInsert = useCallback((newNota: any) => {
    setNotas((prev) => [newNota, ...prev])
    setLastUpdate(new Date())
  }, [])

  const handleUpdate = useCallback((updatedNota: any) => {
    setNotas((prev) => prev.map((nota) => (nota.id === updatedNota.id ? updatedNota : nota)))
    setLastUpdate(new Date())
  }, [])

  const handleDelete = useCallback((deletedNota: any) => {
    setNotas((prev) => prev.filter((nota) => nota.id !== deletedNota.id))
    setLastUpdate(new Date())
  }, [])

  const { isConnected } = useRealtimeSubscription({
    table: "notas_pedido",
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  })

  // Función para actualizar manualmente las notas
  const refreshNotas = useCallback((newNotas: any[]) => {
    setNotas(newNotas)
  }, [])

  return {
    notas,
    isConnected,
    lastUpdate,
    refreshNotas,
  }
}

// Hook específico para turnos de un cortador
export function useRealtimeTurnos(cortadorId: string, initialTurnos: any[] = []) {
  const [turnos, setTurnos] = useState(initialTurnos)

  const handleInsert = useCallback((newTurno: any) => {
    setTurnos((prev) => [newTurno, ...prev])
  }, [])

  const handleUpdate = useCallback((updatedTurno: any) => {
    setTurnos((prev) => prev.map((turno) => (turno.id === updatedTurno.id ? updatedTurno : turno)))
  }, [])

  const { isConnected } = useRealtimeSubscription({
    table: "turnos",
    filter: { column: "cortador_id", value: cortadorId },
    onInsert: handleInsert,
    onUpdate: handleUpdate,
  })

  return { turnos, isConnected }
}

// Hook para detectar cambios en cualquier tabla (para dashboard)
export function useRealtimeDashboard() {
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const incrementUpdate = useCallback(() => {
    setUpdateCount((prev) => prev + 1)
    setLastUpdate(new Date())
  }, [])

  useRealtimeSubscription({
    table: "notas_pedido",
    onInsert: incrementUpdate,
    onUpdate: incrementUpdate,
  })

  useRealtimeSubscription({
    table: "turnos",
    onInsert: incrementUpdate,
    onUpdate: incrementUpdate,
  })

  return { updateCount, lastUpdate }
}
