# Centro de Corte Mosquera - Sistema de Gestión

Sistema integral para la gestión y medición de rendimiento del Centro de Corte de Homecenter Mosquera.

## Características Principales

### 🔧 Módulos del Sistema

#### 1. **Módulo del Asesor de Ventas**
- Creación de Notas de Pedido (NP)
- Programación de fechas de corte
- Especificación de materiales (Aglomerado, Crudo, MDF)
- Registro de cantos (Flexible y Rígido) en metros enteros
- Visualización y seguimiento de NPs creadas
- Cierre de NPs completadas

#### 2. **Módulo del Cortador**
- Visualización de NPs pendientes organizadas por fecha
- Selección de trabajos a ejecutar
- **Sierra Striebig:** Control de corte con cronómetros individuales por lámina
  - Botones: Iniciar, Pausar, Finalizar
  - Registro automático de tiempos
- **Enchapadora Fravol:** Control de enchape separado para rígido y flexible
  - Cronómetros independientes
  - Pausas y reanudaciones
- Flujo automático: Corte → Enchape (si aplica)

#### 3. **Módulo del Jefe de Ventas**
- Dashboard completo con KPIs en tiempo real
- Gráficas de rendimiento por cortador
- Distribución de uso de máquinas
- Tendencias de productividad (últimos 7 días)
- Análisis de notas de pedido por asesor
- **Gestión de Usuarios:** Crear y administrar cortadores y asesores

## 🎨 Diseño

- **Colores corporativos:** Amarillo (#FFEB3B) y Negro (#1E1E1E) de Homecenter
- **Logo oficial:** Centro de Corte Mosquera integrado
- **Responsive:** Funciona perfectamente en móvil y PC
- **Interfaz intuitiva:** Diseño limpio y fácil de usar

## 🔒 Seguridad

- **Autenticación robusta** con control de sesiones
- **Límite de intentos:** Máximo 3 intentos de login antes de bloqueo temporal
- **Roles y permisos** bien definidos
- **Persistencia de datos** en localStorage
- **Validación de formularios** en todos los módulos

## 📊 Métricas y Reportes

- Cortes del día y totales
- Tiempo promedio por trabajo
- NPs pendientes vs completadas
- Cortadores activos
- Rendimiento individual de cada cortador
- Distribución de uso entre sierra y enchapadora
- Tendencias semanales de productividad
- Estados de notas de pedido

## 🚀 Flujo de Trabajo

1. **Asesor de Ventas** programa una NP con todos los detalles
2. **Sistema** registra la NP y la hace visible para cortadores
3. **Cortador** selecciona la NP y ejecuta el corte con cronómetro
4. **Sistema** habilita automáticamente el enchape si es necesario
5. **Cortador** finaliza el enchape
6. **Asesor de Ventas** cierra la NP como terminada
7. **Jefe de Ventas** visualiza todas las métricas y rendimientos

## 💻 Tecnologías

- **Framework:** Next.js 16 con React 19
- **UI Components:** shadcn/ui con Tailwind CSS v4
- **Gráficas:** Recharts
- **Gestión de Estado:** React Hooks + Context API
- **Persistencia:** localStorage (navegador)
- **Tipado:** TypeScript

## 📝 Credenciales de Acceso

Ver archivo `CREDENCIALES.md` para los usuarios de prueba.

## 🏗️ Arquitectura

El sistema utiliza el patrón **Modelo-Vista-Controlador (MVC)**:

- **Modelos:** `nota-pedido-model.ts`, `corte-model.ts`, `user-model.ts`
- **Controladores:** `nota-pedido-controller.ts`, `corte-controller.ts`
- **Vistas:** Componentes React en `components/`

## 👨‍💻 Desarrollo

**Autor:** Miguel Angel Pardo  
**Cliente:** Centro de Corte Mosquera - Homecenter  
**Año:** 2025

## 📄 Licencia

© 2025 Miguel Angel Pardo. Todos los derechos reservados.  
Sistema desarrollado exclusivamente para Centro de Corte Mosquera - Homecenter.

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2025
