import { CorteModel, type Corte } from "./corte-model"

export class CorteController {
  private model: CorteModel

  constructor() {
    this.model = new CorteModel()
  }

  // Crear nuevo registro de corte
  crearCorte(data: Omit<Corte, "id" | "fecha" | "estado">): Corte {
    return this.model.crearCorte(data)
  }

  // Iniciar lámina
  iniciarLamina(corteId: string, numeroLamina: number): void {
    this.model.iniciarLamina(corteId, numeroLamina)
  }

  // Detener lámina
  detenerLamina(corteId: string, numeroLamina: number): void {
    this.model.detenerLamina(corteId, numeroLamina)
  }

  // Finalizar corte completo
  finalizarCorte(corteId: string): void {
    this.model.finalizarCorte(corteId)
  }

  // Obtener corte por ID
  obtenerCorte(corteId: string): Corte | undefined {
    return this.model.obtenerCorte(corteId)
  }

  // Obtener todos los cortes
  obtenerTodosLosCortes(): Corte[] {
    return this.model.obtenerTodosLosCortes()
  }

  // Obtener cortes por cortador
  obtenerCortesPorCortador(cortadorId: string): Corte[] {
    return this.model.obtenerCortesPorCortador(cortadorId)
  }

  // Calcular tiempo total de un corte
  calcularTiempoTotal(corteId: string): number {
    const corte = this.obtenerCorte(corteId)
    if (!corte) return 0

    return corte.laminas.reduce((total, lamina) => {
      return total + (lamina.tiempoTotal || 0)
    }, 0)
  }

  // Calcular tiempo promedio por lámina
  calcularTiempoPromedioPorLamina(corteId: string): number {
    const corte = this.obtenerCorte(corteId)
    if (!corte || corte.laminas.length === 0) return 0

    const tiempoTotal = this.calcularTiempoTotal(corteId)
    return tiempoTotal / corte.laminas.length
  }

  // Obtener estado del corte
  obtenerEstadoCorte(corteId: string): "en_proceso" | "completado" | "pausado" {
    const corte = this.obtenerCorte(corteId)
    return corte?.estado || "pausado"
  }
}
