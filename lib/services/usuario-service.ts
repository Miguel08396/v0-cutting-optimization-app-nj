"use server"

import { createClient } from "@/lib/supabase/server"
import type { Usuario } from "@/lib/supabase/types"

export async function obtenerUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("usuarios").select("*").eq("email", email).eq("activo", true).single()

  if (error || !data) return null
  return data as Usuario
}

export async function obtenerTodosLosUsuarios(): Promise<Usuario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("usuarios").select("*").eq("activo", true).order("nombre")

  if (error) return []
  return data as Usuario[]
}

export async function obtenerUsuariosPorRole(role: Usuario["role"]): Promise<Usuario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("role", role)
    .eq("activo", true)
    .order("nombre")

  if (error) return []
  return data as Usuario[]
}

export async function crearUsuario(userData: Omit<Usuario, "id" | "fecha_creacion">): Promise<Usuario | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("usuarios").insert(userData).select().single()

  if (error) return null
  return data as Usuario
}

export async function actualizarUsuario(id: string, userData: Partial<Usuario>): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("usuarios").update(userData).eq("id", id)

  return !error
}

export async function obtenerUsuarioBaseline(): Promise<Usuario | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("es_baseline", true)
    .eq("activo", true)
    .single()

  if (error || !data) return null
  return data as Usuario
}
