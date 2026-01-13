"use server"

import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import type { Usuario } from "@/lib/supabase/types"

const SALT_ROUNDS = 10

export interface LoginResult {
  success: boolean
  user?: Usuario
  error?: string
}

export interface RegisterResult {
  success: boolean
  user?: Usuario
  error?: string
}

// Verificar si una contraseña está hasheada (bcrypt hashes empiezan con $2)
function isPasswordHashed(password: string): boolean {
  return password.startsWith("$2")
}

// Hash de contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Verificar contraseña
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Si el hash no es bcrypt, comparar directamente (para migración)
  if (!isPasswordHashed(hash)) {
    return password === hash
  }
  return bcrypt.compare(password, hash)
}

// Login con soporte para contraseñas legadas y bcrypt
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .eq("activo", true)
    .single()

  if (error || !user) {
    return { success: false, error: "Credenciales inválidas" }
  }

  // Verificar contraseña
  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return { success: false, error: "Credenciales inválidas" }
  }

  // Si la contraseña no estaba hasheada, actualizarla a bcrypt
  if (!isPasswordHashed(user.password)) {
    const hashedPassword = await hashPassword(password)
    await supabase.from("usuarios").update({ password: hashedPassword }).eq("id", user.id)
  }

  // No devolver la contraseña al cliente
  const { password: _, ...userWithoutPassword } = user
  return { success: true, user: userWithoutPassword as Usuario }
}

// Registrar nuevo usuario con contraseña hasheada
export async function registerUser(
  nombre: string,
  email: string,
  password: string,
  role: "cortador" | "jefe_ventas" | "asesor_ventas",
): Promise<RegisterResult> {
  const supabase = await createClient()

  // Verificar si el email ya existe
  const { data: existing } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single()

  if (existing) {
    return { success: false, error: "El email ya está registrado" }
  }

  // Hash de la contraseña
  const hashedPassword = await hashPassword(password)

  const { data: user, error } = await supabase
    .from("usuarios")
    .insert({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      activo: true,
      es_baseline: false,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error registering user:", error)
    return { success: false, error: "Error al registrar usuario" }
  }

  const { password: _, ...userWithoutPassword } = user
  return { success: true, user: userWithoutPassword as Usuario }
}

// Cambiar contraseña
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Obtener usuario actual
  const { data: user, error } = await supabase.from("usuarios").select("password").eq("id", userId).single()

  if (error || !user) {
    return { success: false, error: "Usuario no encontrado" }
  }

  // Verificar contraseña actual
  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) {
    return { success: false, error: "Contraseña actual incorrecta" }
  }

  // Hash de la nueva contraseña
  const hashedPassword = await hashPassword(newPassword)

  const { error: updateError } = await supabase.from("usuarios").update({ password: hashedPassword }).eq("id", userId)

  if (updateError) {
    return { success: false, error: "Error al actualizar contraseña" }
  }

  return { success: true }
}

// Obtener usuario por ID
export async function getUserById(id: string): Promise<Usuario | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, email, role, activo, es_baseline, fecha_creacion")
    .eq("id", id)
    .single()

  if (error || !data) return null
  return data as Usuario
}

// Obtener todos los usuarios (para jefe de ventas)
export async function getAllUsers(): Promise<Usuario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, email, role, activo, es_baseline, fecha_creacion")
    .order("nombre")

  if (error) return []
  return data as Usuario[]
}

// Desactivar usuario
export async function deactivateUser(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("usuarios").update({ activo: false }).eq("id", userId)

  return !error
}

// Activar usuario
export async function activateUser(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("usuarios").update({ activo: true }).eq("id", userId)

  return !error
}
