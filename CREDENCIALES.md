# Credenciales de Acceso - Centro de Corte Mosquera

## Sistema de Gestión y Rendimiento - Homecenter

### Jefe de Ventas (Administrador)
- **Email:** jefe@mosquera.com
- **Contraseña:** jefe123
- **Permisos:**
  - Visualizar dashboard completo con métricas y gráficas
  - Ver rendimiento de todos los cortadores
  - Crear, editar y eliminar usuarios (cortadores y asesores)
  - Acceso a todas las estadísticas y reportes

### Asesor de Ventas
- **Email:** asesor@mosquera.com
- **Contraseña:** asesor123
- **Permisos:**
  - Crear notas de pedido (NP)
  - Programar trabajos de corte y enchape
  - Visualizar sus propias notas de pedido
  - Cerrar notas completadas

### Cortador
- **Email:** cortador@mosquera.com
- **Contraseña:** cortador123
- **Permisos:**
  - Seleccionar notas de pedido asignadas
  - Iniciar/pausar/finalizar procesos de corte
  - Iniciar/pausar/finalizar procesos de enchape
  - Registrar tiempos de trabajo por lámina

---

## Notas Importantes

1. **Seguridad:** El sistema permite máximo 3 intentos de login antes de bloquear temporalmente el acceso.

2. **Creación de Usuarios:** Solo el Jefe de Ventas puede crear nuevos usuarios desde su panel.

3. **Flujo de Trabajo:**
   - Asesor crea NP → Cortador selecciona NP → Cortador ejecuta corte → Cortador ejecuta enchape (si aplica) → Asesor cierra NP

4. **Persistencia:** Todos los datos se guardan automáticamente en localStorage del navegador.

---

**Desarrollado por:** Miguel Angel Pardo  
**Versión:** 1.0.0  
**Fecha:** Diciembre 2025  
**© 2025 Centro de Corte Mosquera - Homecenter. Todos los derechos reservados.**
