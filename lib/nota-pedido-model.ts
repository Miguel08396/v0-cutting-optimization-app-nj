export interface NotaPedido {
  id: string
  numero: string // Consecutivo de la Nota de Pedido
  asesorId: string
  asesorNombre: string
  fechaCreacion: Date
  fechaCorte: Date // Fecha programada para el corte
  cantidadLaminas: number // Campo corregido para coincidir con AsesorVentasView
  tipoMaterial: "aglomerado" | "crudo" | "mdf"
  llevaCanto: boolean
  cantoFlexible: number // Nombres de campos corregidos para coincidir con AsesorVentasView
  cantoRigido: number // Nombres de campos corregidos para coincidir con AsesorVentasView
  estado: "pendiente" | "en_corte" | "cortado" | "en_enchape" | "completado" | "cerrado"
  cortadorAsignado?: string
  cortadorNombre?: string
  tiempoCorte?: number // tiempo total en segundos del corte
  tiempoEnchapeRigido?: number
  tiempoEnchapeFlexible?: number
  fechaInicioProceso?: Date // Corregido typo de fechaInicioConte
  fechaFinCorte?: Date
  fechaInicioEnchape?: Date
  fechaFinEnchape?: Date
  corteCompletado: boolean // Agregado para tracking de corte
  enchapeCompletado: boolean // Agregado para tracking de enchape
  imagenesPlano: Array<{ url: string; piezas: number }> // Agregado para planos
  cantidadTableros: number // Agregado para compatibilidad con vista de cortador
  archivosPed: Array<{ nombre: string; url: string; fechaSubida: Date }> // Archivos de planos Lepton
}

export class NotaPedidoModel {
  private notasPedido: Map<string, NotaPedido>

  constructor() {
    this.notasPedido = new Map()
    this.cargarDatos()
  }

  private cargarDatos() {
    if (typeof window !== "undefined") {
      const datos = localStorage.getItem("notas_pedido")
      if (datos) {
        const notasArray = JSON.parse(datos)
        notasArray.forEach((nota: NotaPedido) => {
          nota.fechaCreacion = new Date(nota.fechaCreacion)
          nota.fechaCorte = new Date(nota.fechaCorte)
          if (nota.fechaInicioProceso) nota.fechaInicioProceso = new Date(nota.fechaInicioProceso)
          if (nota.fechaFinCorte) nota.fechaFinCorte = new Date(nota.fechaFinCorte)
          if (nota.fechaInicioEnchape) nota.fechaInicioEnchape = new Date(nota.fechaInicioEnchape)
          if (nota.fechaFinEnchape) nota.fechaFinEnchape = new Date(nota.fechaFinEnchape)
          if (nota.archivosPed) {
            nota.archivosPed.forEach((archivo) => {
              archivo.fechaSubida = new Date(archivo.fechaSubida)
            })
          }
          this.notasPedido.set(nota.id, nota)
        })
      }
    }
  }

  private guardarDatos() {
    if (typeof window !== "undefined") {
      const notasArray = Array.from(this.notasPedido.values())
      localStorage.setItem("notas_pedido", JSON.stringify(notasArray))
    }
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
    > & { archivosPed?: Array<{ nombre: string; url: string; fechaSubida: Date }> },
  ): NotaPedido {
    const id = `NP-${Date.now()}`
    const notaPedido: NotaPedido = {
      ...data,
      id,
      fechaCreacion: new Date(),
      estado: "pendiente",
      corteCompletado: false,
      enchapeCompletado: false,
      tiempoEnchapeRigido: data.cantoRigido,
      tiempoEnchapeFlexible: data.cantoFlexible,
      cantidadTableros: data.cantidadLaminas,
      imagenesPlano: [],
      archivosPed: data.archivosPed || [],
    }

    console.log("[v0] Creando nota pedido:", id, "con archivos:", notaPedido.archivosPed.length)

    this.notasPedido.set(id, notaPedido)
    this.guardarDatos()
    return notaPedido
  }

  actualizarNotaPedido(id: string, data: Partial<NotaPedido>): void {
    const nota = this.notasPedido.get(id)
    if (!nota) return

    Object.assign(nota, data)
    this.notasPedido.set(id, nota)
    this.guardarDatos()
  }

  obtenerNotaPedido(id: string): NotaPedido | undefined {
    return this.notasPedido.get(id)
  }

  obtenerTodasLasNotas(): NotaPedido[] {
    return Array.from(this.notasPedido.values()).sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime())
  }

  obtenerNotasPendientes(): NotaPedido[] {
    return Array.from(this.notasPedido.values())
      .filter((n) => n.estado !== "completado" && n.estado !== "cerrado")
      .sort((a, b) => a.fechaCorte.getTime() - b.fechaCorte.getTime())
  }

  obtenerNotasPorAsesor(asesorId: string): NotaPedido[] {
    return Array.from(this.notasPedido.values())
      .filter((n) => n.asesorId === asesorId)
      .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime())
  }

  obtenerNotasPorFecha(fecha: Date): NotaPedido[] {
    return Array.from(this.notasPedido.values())
      .filter((n) => {
        const fechaCorte = new Date(n.fechaCorte)
        return (
          fechaCorte.getDate() === fecha.getDate() &&
          fechaCorte.getMonth() === fecha.getMonth() &&
          fechaCorte.getFullYear() === fecha.getFullYear()
        )
      })
      .sort((a, b) => a.fechaCorte.getTime() - b.fechaCorte.getTime())
  }

  obtenerNotasParaEnchapar(): NotaPedido[] {
    return Array.from(this.notasPedido.values())
      .filter(
        (n) => n.corteCompletado && !n.enchapeCompletado && (n.tiempoEnchapeFlexible > 0 || n.tiempoEnchapeRigido > 0),
      )
      .sort((a, b) => (a.fechaFinCorte?.getTime() || 0) - (b.fechaFinCorte?.getTime() || 0))
  }
}
