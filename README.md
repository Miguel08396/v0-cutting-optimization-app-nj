# Centro de Corte Mosquera - Sistema de Gestion

Sistema integral para la gestion y medicion de rendimiento del Centro de Corte de Homecenter Mosquera.

## Caracteristicas Principales

### Modulos del Sistema

#### 1. **Modulo del Asesor de Ventas**
- Creacion de Notas de Pedido (NP) con **multiples materiales**
- Programacion de fechas de corte
- Especificacion de materiales (Aglomerado, Crudo, MDF) - ahora con soporte para combinar varios
- Registro de cantos (Flexible y Rigido) en metros enteros
- Carga de archivos .ped de Lepton
- Visualizacion y seguimiento de NPs creadas
- Cierre de NPs completadas

#### 2. **Modulo del Cortador**
- **Sistema de Turnos:** Inicio/fin de turno con calculo de tiempo activo, pausado y muerto
- Visualizacion de NPs pendientes organizadas por fecha
- **Panel compartido:** Cortador 1 y Cortador 2 ven las mismas notas
- Seleccion de trabajos a ejecutar
- **Sierra Striebig:** Control de corte con cronometros individuales por lamina
  - Botones: Iniciar, Pausar, Continuar, Finalizar
  - Registro automatico de tiempos activos y pausados
- **Enchapadora Fravol:** Control de enchape separado para rigido y flexible
  - Cronometros independientes con tracking de pausas
- Flujo automatico: Corte → Enchape (si aplica)

#### 3. **Modulo del Jefe de Ventas**
- Dashboard completo con KPIs en tiempo real
- **Indicador de conexion en vivo** (Supabase Realtime)
- Graficas de rendimiento por cortador
- **Grafica de tiempo pausado** por cortador
- Distribucion de uso de maquinas
- Tendencias de productividad (ultimos 7 dias)
- Analisis de notas de pedido
- Descarga de planos .ped
- **Gestion de Usuarios:** Crear y administrar cortadores y asesores

#### 4. **Sistema Baseline** (Nuevo)
- Usuario especial para establecer metricas de referencia
- Los tiempos registrados como baseline se usan para comparar rendimiento
- Comparacion automatica de cortadores vs tiempo de referencia

## Diseno

- **Colores corporativos:** Amarillo (#FFEB3B) y Negro (#1E1E1E) de Homecenter
- **Logo oficial:** Centro de Corte Mosquera integrado
- **Responsive:** Funciona perfectamente en movil y PC
- **Interfaz intuitiva:** Diseno limpio y facil de usar

## Seguridad

- **Autenticacion robusta** con control de sesiones
- **Limite de intentos:** Maximo 3 intentos de login antes de bloqueo temporal
- **Roles y permisos** bien definidos
- **Persistencia de datos** en Supabase (base de datos en la nube)
- **Datos sincronizados** entre dispositivos

## Metricas y Reportes

- Cortes del dia y totales
- **Tiempo promedio activo** por trabajo
- **Tiempo promedio pausado** por trabajo
- **Tiempo muerto del turno** (8 horas - activo - pausado)
- NPs pendientes vs completadas
- Cortadores activos
- Rendimiento individual de cada cortador
- **Comparacion vs baseline**
- Distribucion de uso entre sierra y enchapadora
- Tendencias semanales de productividad

## Flujo de Trabajo

1. **Asesor de Ventas** programa una NP con todos los detalles (multiples materiales)
2. **Sistema** registra la NP en Supabase y la hace visible para cortadores
3. **Cortador** inicia turno e indica que comienza su jornada
4. **Cortador** selecciona la NP y ejecuta el corte con cronometro
5. **Sistema** registra tiempo activo y tiempo pausado por separado
6. **Sistema** habilita automaticamente el enchape si es necesario
7. **Cortador** finaliza el enchape
8. **Cortador** finaliza turno - sistema calcula tiempo muerto
9. **Asesor de Ventas** cierra la NP como terminada
10. **Jefe de Ventas** visualiza todas las metricas y rendimientos

## Tecnologias

- **Framework:** Next.js 16 con React 19
- **Base de Datos:** Supabase (PostgreSQL)
- **Realtime:** Supabase Realtime para actualizaciones en vivo
- **UI Components:** shadcn/ui con Tailwind CSS v4
- **Graficas:** Recharts
- **Gestion de Estado:** React Hooks + Context API
- **Tipado:** TypeScript

## Credenciales de Acceso

Ver archivo `CREDENCIALES.md` para los usuarios de prueba.

## Arquitectura

El sistema utiliza una arquitectura por capas:

- **Base de Datos:** Supabase (PostgreSQL)
- **Servicios:** `/lib/services/` - Logica de negocio
- **Tipos:** `/lib/supabase/types.ts` - Definiciones TypeScript
- **Hooks:** `/lib/hooks/` - Hooks personalizados (Realtime, etc.)
- **Vistas:** Componentes React en `/components/`

## Tablas de Base de Datos

- `usuarios` - Usuarios del sistema con campo `es_baseline`
- `notas_pedido` - Notas de pedido con tiempos activos y pausados
- `laminas_detalle` - Detalle de laminas por material (nuevo)
- `registros_corte` - Registro individual por lamina
- `registros_enchape` - Registro de enchapes
- `turnos` - Turnos de trabajo con tiempo activo, pausado y muerto
- `pausas` - Registro detallado de pausas
- `metricas_baseline` - Metricas de referencia

## Desarrollo

**Autor:** Miguel Angel Pardo  
**Cliente:** Centro de Corte Mosquera - Homecenter  
**Ano:** 2025-2026

## Licencia

© 2025-2026 Miguel Angel Pardo. Todos los derechos reservados.  
Sistema desarrollado exclusivamente para Centro de Corte Mosquera - Homecenter.

---

**Version:** 2.0.0  
**Ultima actualizacion:** Enero 2026
