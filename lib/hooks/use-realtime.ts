"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { RealtimeChannel } from "@supabase/supabase-js"

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
  enabled?: boolean
}

export function useRealtimeSubscription<T extends { id: string }>({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeOptions<T>) {
  const [isConnected, setIsConnected] = useState(false)
  const [usePolling, setUsePolling] = useState(false)
  const retryCount = useRef(0)
  const maxRetries = 3

  useEffect(() => {
    if (!enabled) return

    const supabase = getSupabaseClient()
    let channel: RealtimeChannel | null = null

    const setupSubscription = () => {
      const channelName = filter
        ? `${table}_${filter.column}_${filter.value}_${Date.now()}`
        : `${table}_changes_${Date.now()}`

      try {
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
            (payload) => {
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
            if (status === "SUBSCRIBED") {
              setIsConnected(true)
              retryCount.current = 0
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              setIsConnected(false)
              retryCount.current++

              if (retryCount.current >= maxRetries) {
                setUsePolling(true)
                if (channel) {
                  channel.unsubscribe()
                }
              }
            } else if (status === "CLOSED") {
              setIsConnected(false)
            }
          })
      } catch (error) {
        // Silently fall back to polling
        setUsePolling(true)
        setIsConnected(false)
      }
    }

    setupSubscription()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [table, filter, onInsert, onUpdate, onDelete, enabled])

  return { isConnected, usePolling }
}

export function useRealtimeNotas(initialNotas: any[] = []) {
  const [notas, setNotas] = useState(initialNotas)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const handleInsert = useCallback((newNota: any) => {
    setNotas((prev) => {
      // Evitar duplicados
      if (prev.some((n) => n.id === newNota.id)) return prev
      return [newNota, ...prev]
    })
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

  const { isConnected, usePolling } = useRealtimeSubscription({
    table: "notas_pedido",
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  })

  const refreshNotas = useCallback((newNotas: any[]) => {
    setNotas(newNotas)
  }, [])

  return {
    notas,
    isConnected,
    displayConnected: isConnected || usePolling,
    lastUpdate,
    refreshNotas,
    usePolling,
  }
}

// Hook para turnos de un cortador
export function useRealtimeTurnos(cortadorId: string, initialTurnos: any[] = []) {
  const [turnos, setTurnos] = useState(initialTurnos)

  const handleInsert = useCallback((newTurno: any) => {
    setTurnos((prev) => [newTurno, ...prev])
  }, [])

  const handleUpdate = useCallback((updatedTurno: any) => {
    setTurnos((prev) => prev.map((turno) => (turno.id === updatedTurno.id ? updatedTurno : turno)))
  }, [])

  const { isConnected, usePolling } = useRealtimeSubscription({
    table: "turnos",
    filter: { column: "cortador_id", value: cortadorId },
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    enabled: !!cortadorId,
  })

  return { turnos, isConnected: isConnected || usePolling }
}

export function useRealtimeDashboard() {
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const incrementUpdate = useCallback(() => {
    setUpdateCount((prev) => prev + 1)
    setLastUpdate(new Date())
  }, [])

  const { isConnected: notasConnected } = useRealtimeSubscription({
    table: "notas_pedido",
    onInsert: incrementUpdate,
    onUpdate: incrementUpdate,
  })

  const { isConnected: turnosConnected } = useRealtimeSubscription({
    table: "turnos",
    onInsert: incrementUpdate,
    onUpdate: incrementUpdate,
  })

  return {
    updateCount,
    lastUpdate,
    isConnected: notasConnected || turnosConnected,
  }
}
