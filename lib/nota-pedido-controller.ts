import { NotaPedidoModel, type NotaPedido } from "./nota-pedido-model"

export class NotaPedidoController {
  private model: NotaPedidoModel

  constructor() {
    this.model = new NotaPedidoModel()
  }

  crearNotaPedido(
    data: Omit<
      NotaPedido,
      | "id"
      | "fechaCreacion"
      | "estado"
      | "corteCompletado"
      | "enchapeCompletado"
      | "tiempoEnchapeRigido"
      | "tiempoEnchapeFlexible"
      | "cantidadTableros"
      | "imagenesPlano"
    >,
  ): NotaPedido {
    return this.model.crearNotaPedido(data)
  }

  actualizarNotaPedido(id: string, data: Partial<NotaPedido>): void {
    this.model.actualizarNotaPedido(id, data)
  }

  obtenerNotaPedido(id: string): NotaPedido | undefined {
    return this.model.obtenerNotaPedido(id)
  }

  obtenerTodasLasNotas(): NotaPedido[] {
    return this.model.obtenerTodasLasNotas()
  }

  obtenerNotasPendientes(): NotaPedido[] {
    return this.model.obtenerNotasPendientes()
  }

  obtenerNotasPorAsesor(asesorId: string): NotaPedido[] {
    return this.model.obtenerNotasPorAsesor(asesorId)
  }

  obtenerNotasPorFecha(fecha: Date): NotaPedido[] {
    return this.model.obtenerNotasPorFecha(fecha)
  }

  obtenerNotasParaEnchapar(): NotaPedido[] {
    return this.model.obtenerNotasParaEnchapar()
  }

  iniciarProcesoCorte(notaPedidoId: string, cortadorId: string, cortadorNombre: string): void {
    this.model.actualizarNotaPedido(notaPedidoId, {
      estado: "en_corte",
      cortadorAsignado: cortadorId,
      cortadorNombre: cortadorNombre,
      fechaInicioProceso: new Date(),
    })
  }

  finalizarProcesoCorte(notaPedidoId: string, tiempoTotal: number): void {
    const nota = this.model.obtenerNotaPedido(notaPedidoId)
    if (!nota) return

    this.model.actualizarNotaPedido(notaPedidoId, {
      tiempoCorte: tiempoTotal,
      fechaFinCorte: new Date(),
      corteCompletado: true,
      estado: "cortado",
    })
  }

  iniciarProcesoEnchape(notaPedidoId: string): void {
    this.model.actualizarNotaPedido(notaPedidoId, {
      estado: "en_enchape",
      fechaInicioEnchape: new Date(),
    })
  }

  finalizarProcesoEnchape(notaPedidoId: string, tiempoRigido: number, tiempoFlexible: number): void {
    this.model.actualizarNotaPedido(notaPedidoId, {
      tiempoEnchapeRigido: tiempoRigido,
      tiempoEnchapeFlexible: tiempoFlexible,
      fechaFinEnchape: new Date(),
      enchapeCompletado: true,
      estado: "completado",
    })
  }

  cerrarNota(notaPedidoId: string): void {
    console.log("[v0] Controller: Cerrando nota", notaPedidoId)
    this.model.actualizarNotaPedido(notaPedidoId, {
      estado: "cerrado",
    })
  }
}
