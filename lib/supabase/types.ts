export interface Usuario {
  id: string
  nombre: string
  email: string
  password: string
  role: "cortador" | "jefe_ventas" | "asesor_ventas"
  activo: boolean
  es_baseline: boolean
  fecha_creacion: string
}

export interface NotaPedido {
  id: string
  numero: string
  asesor_id: string | null
  asesor_nombre: string
  fecha_creacion: string
  fecha_corte: string
  cantidad_laminas: number
  tipo_material: "aglomerado" | "crudo" | "mdf"
  lleva_canto: boolean
  canto_flexible: number
  canto_rigido: number
  estado: "pendiente" | "en_corte" | "cortado" | "en_enchape" | "completado" | "cerrado"
  cortador_asignado: string | null
  cortador_nombre: string | null
  tiempo_corte: number | null
  tiempo_enchape_rigido: number | null
  tiempo_enchape_flexible: number | null
  tiempo_pausado_corte: number
  tiempo_pausado_enchape: number
  fecha_inicio_proceso: string | null
  fecha_fin_corte: string | null
  fecha_inicio_enchape: string | null
  fecha_fin_enchape: string | null
  corte_completado: boolean
  enchape_completado: boolean
  archivos_ped: Array<{ nombre: string; url: string; fechaSubida: string }>
  imagenes_plano: Array<{ url: string; piezas: number }>
  tipo_entrega: "domicilio" | "retiro" | "portable"
  cantidad_desplazamientos: number
}

export interface RegistroCorte {
  id: string
  nota_id: string
  numero_lamina: number
  hora_inicio: string | null
  hora_fin: string | null
  tiempo_total: number | null
  tiempo_pausado: number
  estado: "pendiente" | "en_proceso" | "pausado" | "completado"
  cortador_id: string | null
}

export interface RegistroEnchape {
  id: string
  nota_id: string
  tipo: "rigido" | "flexible"
  hora_inicio: string | null
  hora_fin: string | null
  tiempo_total: number | null
  tiempo_pausado: number
  estado: "pendiente" | "en_proceso" | "pausado" | "completado"
  cortador_id: string | null
}

export interface Turno {
  id: string
  cortador_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string | null
  duracion_turno: number
  tiempo_activo: number
  tiempo_pausado: number
  tiempo_muerto: number
  estado: "activo" | "finalizado"
}

export interface MetricaBaseline {
  id: string
  tipo_operacion: "corte" | "enchape_rigido" | "enchape_flexible"
  tipo_material: string | null
  cantidad_laminas: number | null
  tiempo_promedio: number
  tiempo_minimo: number | null
  tiempo_maximo: number | null
  muestras: number
  usuario_baseline_id: string | null
  fecha_actualizacion: string
}

export interface Pausa {
  id: string
  registro_corte_id: string | null
  registro_enchape_id: string | null
  turno_id: string | null
  hora_inicio: string
  hora_fin: string | null
  duracion: number | null
  motivo: string | null
}

export interface LaminaDetalle {
  id: string
  nota_id: string
  tipo_material: "aglomerado" | "crudo" | "mdf"
  cantidad: number
  fecha_creacion: string
}
