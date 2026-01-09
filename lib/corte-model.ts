export interface LaminaRegistro {
  numero: number
  horaInicio?: Date
  horaFin?: Date
  tiempoTotal?: number // en segundos
  estado: "pendiente" | "en_proceso" | "completado"
}

export interface Corte {
  id: string
  cortadorId: string
  cortadorNombre: string
  maquina: "striebig" | "fravol"
  fecha: Date
  numeroLaminas: number
  piezasDetectadas?: number
  imagenPlano?: string
  laminas: LaminaRegistro[]
  estado: "en_proceso" | "completado" | "pausado"
  dimensionPlaca: string
  observaciones?: string
}

export class CorteModel {
  private cortes: Map<string, Corte>

  constructor() {
    this.cortes = new Map()
    this.cargarDatos()
  }

  private cargarDatos() {
    if (typeof window !== "undefined") {
      const datos = localStorage.getItem("cortes")
      if (datos) {
        const cortesArray = JSON.parse(datos)
        cortesArray.forEach((corte: Corte) => {
          // Convertir fechas de string a Date
          corte.fecha = new Date(corte.fecha)
          corte.laminas.forEach((lamina) => {
            if (lamina.horaInicio) lamina.horaInicio = new Date(lamina.horaInicio)
            if (lamina.horaFin) lamina.horaFin = new Date(lamina.horaFin)
          })
          this.cortes.set(corte.id, corte)
        })
      }
    }
  }

  private guardarDatos() {
    if (typeof window !== "undefined") {
      const cortesArray = Array.from(this.cortes.values())
      localStorage.setItem("cortes", JSON.stringify(cortesArray))
    }
  }

  crearCorte(data: Omit<Corte, "id" | "fecha" | "estado">): Corte {
    const id = `corte-${Date.now()}`
    const laminas: LaminaRegistro[] = Array.from({ length: data.numeroLaminas }, (_, i) => ({
      numero: i + 1,
      estado: "pendiente" as const,
    }))

    const corte: Corte = {
      ...data,
      id,
      fecha: new Date(),
      estado: "pausado",
      laminas,
    }

    this.cortes.set(id, corte)
    this.guardarDatos()
    return corte
  }

  iniciarLamina(corteId: string, numeroLamina: number): void {
    const corte = this.cortes.get(corteId)
    if (!corte) return

    const lamina = corte.laminas.find((l) => l.numero === numeroLamina)
    if (!lamina) return

    lamina.horaInicio = new Date()
    lamina.estado = "en_proceso"
    corte.estado = "en_proceso"

    this.cortes.set(corteId, corte)
    this.guardarDatos()
  }

  detenerLamina(corteId: string, numeroLamina: number): void {
    const corte = this.cortes.get(corteId)
    if (!corte) return

    const lamina = corte.laminas.find((l) => l.numero === numeroLamina)
    if (!lamina || !lamina.horaInicio) return

    lamina.horaFin = new Date()
    lamina.tiempoTotal = Math.floor((lamina.horaFin.getTime() - lamina.horaInicio.getTime()) / 1000)
    lamina.estado = "completado"

    // Verificar si todas las láminas están completadas
    const todasCompletadas = corte.laminas.every((l) => l.estado === "completado")
    if (todasCompletadas) {
      corte.estado = "completado"
    } else {
      corte.estado = "pausado"
    }

    this.cortes.set(corteId, corte)
    this.guardarDatos()
  }

  finalizarCorte(corteId: string): void {
    const corte = this.cortes.get(corteId)
    if (!corte) return

    corte.estado = "completado"
    this.cortes.set(corteId, corte)
    this.guardarDatos()
  }

  obtenerCorte(corteId: string): Corte | undefined {
    return this.cortes.get(corteId)
  }

  obtenerTodosLosCortes(): Corte[] {
    return Array.from(this.cortes.values()).sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
  }

  obtenerCortesPorCortador(cortadorId: string): Corte[] {
    return Array.from(this.cortes.values())
      .filter((c) => c.cortadorId === cortadorId)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
  }
}
