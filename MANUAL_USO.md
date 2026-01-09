# Manual de Usuario - Centro de Corte Mosquera

## Índice
1. [Inicio de Sesión](#inicio-de-sesión)
2. [Módulo Asesor de Ventas](#módulo-asesor-de-ventas)
3. [Módulo Cortador](#módulo-cortador)
4. [Módulo Jefe de Ventas](#módulo-jefe-de-ventas)
5. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Inicio de Sesión

1. Ingresa tu correo electrónico corporativo
2. Ingresa tu contraseña
3. Haz clic en "Iniciar Sesión"

**Importante:** Tienes 3 intentos para ingresar las credenciales correctas. Después del tercer intento fallido, deberás recargar la página.

---

## Módulo Asesor de Ventas

### Crear Nueva Nota de Pedido

1. **Consecutivo NP:** Ingresa el número de nota pedido (ej: NP-2025-001)
2. **Fecha de Corte:** Selecciona la fecha programada usando el calendario
3. **Cantidad de Láminas:** Indica cuántos tableros se van a cortar
4. **Tipo de Material:** Selecciona entre Aglomerado, Crudo o MDF
5. **Lleva Canto:** Marca la casilla si requiere enchape
   - **Canto Flexible:** Metros lineales (solo números enteros)
   - **Canto Rígido:** Metros lineales (solo números enteros)
6. Haz clic en **"Guardar Nota Pedido"**

### Gestionar Notas Existentes

- Visualiza todas tus notas en el panel derecho
- Estados: Pendiente, En Corte, Cortado, En Enchape, Completado, Cerrado
- **Cerrar Nota:** Cuando el estado sea "Completado", puedes cerrarla como terminada

---

## Módulo Cortador

### Seleccionar Nota de Pedido

1. Visualiza todas las notas programadas
2. Revisa los detalles: tableros, material, cantos
3. Haz clic en **"Seleccionar"** en la nota que vas a procesar

### Proceso de Corte (Sierra Striebig)

1. Haz clic en la tarjeta **"Sierra Striebig"**
2. Verás la lista de todos los tableros a cortar
3. Para cada tablero:
   - **Iniciar Corte:** Comienza el cronómetro
   - **Pausar:** Detiene temporalmente el tiempo
   - **Continuar:** Reanuda desde la pausa
   - **Finalizar:** Completa ese tablero y guarda el tiempo
4. Una vez todos los tableros estén finalizados, haz clic en **"Finalizar Corte Completo"**

### Proceso de Enchape (Enchapadora Fravol)

- Se habilita automáticamente después del corte (si la NP tiene enchapes programados)
- O puedes acceder directamente si el corte ya fue completado

#### Enchape Rígido
1. Haz clic en **"Iniciar"** en la sección de Enchape Rígido
2. El cronómetro comenzará
3. Puedes **Pausar/Reanudar** según necesites
4. Haz clic en **"Finalizar"** cuando termines

#### Enchape Flexible
1. Haz clic en **"Iniciar"** en la sección de Enchape Flexible
2. El cronómetro comenzará
3. Puedes **Pausar/Reanudar** según necesites
4. Haz clic en **"Finalizar"** cuando termines

5. Una vez finalizados todos los enchapes, haz clic en **"Finalizar Enchape Completo"**

---

## Módulo Jefe de Ventas

### Dashboard Principal

Visualiza métricas clave:
- Notas totales del mes
- Notas completadas
- Tiempo promedio de procesamiento
- Eficiencia general

### Pestaña Rendimiento

- **Gráfica de Notas por Día:** Producción diaria
- **Notas por Cortador:** Comparación de rendimiento del equipo
- **Distribución de Materiales:** Tipos de material más trabajados
- **Tendencias Semanales:** Evolución del rendimiento

### Pestaña Usuarios

#### Crear Nuevo Usuario
1. Ingresa el nombre completo
2. Ingresa el correo electrónico corporativo
3. Asigna una contraseña segura
4. Selecciona el rol: Cortador, Asesor o Jefe
5. Haz clic en **"Crear Usuario"**

#### Gestionar Usuarios
- Visualiza todos los usuarios registrados
- Puedes eliminar usuarios (excepto jefes de ventas)
- Los cambios se aplican inmediatamente

---

## Preguntas Frecuentes

**P: ¿Por qué no veo mis cambios después de actualizar?**  
R: Presiona Ctrl + F5 (Windows) o Cmd + Shift + R (Mac) para forzar la recarga. El sistema tiene cache busting automático, pero a veces necesitas limpiar el cache manualmente.

**P: ¿Puedo pausar un corte y continuar después?**  
R: Sí, el botón "Pausar" detiene el cronómetro. Al presionar "Continuar" se reanuda desde donde lo dejaste.

**P: ¿Qué pasa si no requiero enchape?**  
R: El sistema detecta automáticamente si la NP no tiene enchapes programados y finaliza el proceso después del corte.

**P: ¿Los metros de canto deben ser exactos?**  
R: El sistema solo acepta números enteros en metros lineales para facilitar el registro.

**P: ¿Puedo ver las notas de otros asesores?**  
R: No, cada asesor solo ve sus propias notas. El jefe de ventas puede ver todas.

**P: ¿Qué pasa si me equivoco al crear una NP?**  
R: Actualmente no se puede editar una NP creada. Contacta al jefe de ventas para que la elimine si es necesario.

---

**Desarrollado por Miguel Angel Pardo**  
**© 2025 Centro de Corte Mosquera - Homecenter**
