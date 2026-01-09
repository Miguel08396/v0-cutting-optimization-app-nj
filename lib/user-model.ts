export interface Usuario {
  id: string
  nombre: string
  email: string
  password: string
  role: "cortador" | "jefe_ventas" | "asesor_ventas"
  activo: boolean
  fechaCreacion: Date
}

export class UserModel {
  private static instance: UserModel
  private usuarios: Map<string, Usuario>

  private constructor() {
    this.usuarios = new Map()
    this.cargarDatos()
  }

  static getInstance(): UserModel {
    if (!UserModel.instance) {
      UserModel.instance = new UserModel()
    }
    return UserModel.instance
  }

  private cargarDatos() {
    if (typeof window !== "undefined") {
      const datos = localStorage.getItem("usuarios")
      if (datos) {
        const usuariosArray = JSON.parse(datos)
        usuariosArray.forEach((user: Usuario) => {
          user.fechaCreacion = new Date(user.fechaCreacion)
          this.usuarios.set(user.id, user)
        })
      } else {
        // Usuarios por defecto
        this.crearUsuarioDefault()
      }
    }
  }

  private crearUsuarioDefault() {
    const usuariosDefault: Omit<Usuario, "id" | "fechaCreacion">[] = [
      {
        nombre: "Cortador 1",
        email: "cortador1@mosquera.com",
        password: "cortador123",
        role: "cortador",
        activo: true,
      },
      {
        nombre: "Cortador 2",
        email: "cortador2@mosquera.com",
        password: "cortador123",
        role: "cortador",
        activo: true,
      },
      {
        nombre: "Jefe de Ventas",
        email: "jefe@mosquera.com",
        password: "jefe123",
        role: "jefe_ventas",
        activo: true,
      },
      {
        nombre: "Asesor de Ventas",
        email: "asesor@mosquera.com",
        password: "asesor123",
        role: "asesor_ventas",
        activo: true,
      },
    ]

    usuariosDefault.forEach((user) => {
      const id = `user-${Date.now()}-${Math.random()}`
      this.usuarios.set(id, {
        ...user,
        id,
        fechaCreacion: new Date(),
      })
    })

    this.guardarDatos()
  }

  private guardarDatos() {
    if (typeof window !== "undefined") {
      const usuariosArray = Array.from(this.usuarios.values())
      localStorage.setItem("usuarios", JSON.stringify(usuariosArray))
    }
  }

  crearUsuario(data: Omit<Usuario, "id" | "fechaCreacion">): Usuario {
    const id = `user-${Date.now()}`
    const usuario: Usuario = {
      ...data,
      id,
      fechaCreacion: new Date(),
    }

    this.usuarios.set(id, usuario)
    this.guardarDatos()
    return usuario
  }

  obtenerUsuarioPorEmail(email: string): Usuario | undefined {
    return Array.from(this.usuarios.values()).find((u) => u.email === email && u.activo)
  }

  obtenerTodosLosUsuarios(): Usuario[] {
    return Array.from(this.usuarios.values()).filter((u) => u.activo)
  }

  obtenerUsuariosPorRole(role: Usuario["role"]): Usuario[] {
    return Array.from(this.usuarios.values()).filter((u) => u.role === role && u.activo)
  }

  desactivarUsuario(id: string): void {
    const usuario = this.usuarios.get(id)
    if (usuario) {
      usuario.activo = false
      this.guardarDatos()
    }
  }

  actualizarUsuario(id: string, data: Partial<Usuario>): void {
    const usuario = this.usuarios.get(id)
    if (!usuario) return

    Object.assign(usuario, data)
    this.usuarios.set(id, usuario)
    this.guardarDatos()
  }
}
