# Credenciales de Acceso - Centro de Corte Mosquera

## Sistema de Gestion y Rendimiento - Homecenter

### Jefe de Ventas (Administrador)
- **Email:** jefe@mosquera.com
- **Contrasena:** jefe123
- **Permisos:**
  - Visualizar dashboard completo con metricas y graficas
  - Ver rendimiento de todos los cortadores
  - Crear, editar y eliminar usuarios (cortadores y asesores)
  - Acceso a todas las estadisticas y reportes
  - Ver comparacion de rendimiento vs baseline

### Asesor de Ventas
- **Email:** asesor@mosquera.com
- **Contrasena:** asesor123
- **Permisos:**
  - Crear notas de pedido (NP) con multiples materiales
  - Programar trabajos de corte y enchape
  - Visualizar sus propias notas de pedido
  - Cerrar notas completadas

### Cortador 1
- **Email:** cortador@mosquera.com
- **Contrasena:** cortador123
- **Permisos:**
  - Seleccionar notas de pedido asignadas
  - Iniciar/pausar/finalizar procesos de corte
  - Iniciar/pausar/finalizar procesos de enchape
  - Registrar tiempos de trabajo por lamina
  - Iniciar/finalizar turno de trabajo

### Cortador 2
- **Email:** cortador2@mosquera.com
- **Contrasena:** cortador123
- **Permisos:**
  - Mismos permisos que Cortador 1
  - Panel compartido con Cortador 1 (ambos ven las mismas notas)

### Usuario Baseline (Para establecer metricas de referencia)
- **Email:** baseline@mosquera.com
- **Contrasena:** baseline123
- **Uso especial:**
  - Este usuario se usa para establecer los tiempos de referencia
  - Cuando trabajas con este usuario, tus tiempos se guardan como "baseline"
  - Los tiempos baseline se usan para comparar el rendimiento de los demas cortadores
  - **Importante:** Usa este usuario cuando quieras establecer los tiempos de referencia

---

## Como Establecer Metricas de Referencia (Baseline)

1. **Iniciar sesion** con el usuario baseline@mosquera.com
2. **Seleccionar** una nota de pedido
3. **Ejecutar** el proceso de corte y/o enchape normalmente
4. **Los tiempos registrados** se guardaran automaticamente como referencia
5. En el panel del Jefe de Ventas, podras ver la comparacion de cada cortador vs el baseline

---

## Notas Importantes

1. **Persistencia de Datos:** Los datos se guardan en Supabase (base de datos en la nube). Puedes acceder desde cualquier dispositivo y los datos permanecen.

2. **Tiempo Pausado:** El sistema registra tanto el tiempo activo como el tiempo pausado por separado, permitiendo medir tiempos muertos.

3. **Turnos de 8 horas:** Al iniciar turno se registra la hora. Al finalizar, el sistema calcula:
   - Tiempo activo (trabajando)
   - Tiempo pausado (pausas durante el trabajo)
   - Tiempo muerto (diferencia entre duracion total y tiempo activo+pausado)

4. **Panel Compartido:** Cortador 1 y Cortador 2 ven las mismas notas pendientes. Los datos estan sincronizados en tiempo real.

5. **Multiples Materiales:** Ahora puedes crear notas con diferentes tipos de material (ej: 3 laminas de crudo + 2 de aglomerado + 1 de MDF).

6. **Seguridad:** El sistema permite maximo 3 intentos de login antes de bloquear temporalmente el acceso.

---

**Desarrollado por:** Miguel Angel Pardo  
**Version:** 2.0.0  
**Fecha:** Enero 2026  
**© 2025-2026 Centro de Corte Mosquera - Homecenter. Todos los derechos reservados.**
