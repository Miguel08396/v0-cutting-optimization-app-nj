# Manual de Usuario - Centro de Corte Mosquera

## Indice
1. [Inicio de Sesion](#inicio-de-sesion)
2. [Modulo Asesor de Ventas](#modulo-asesor-de-ventas)
3. [Modulo Cortador](#modulo-cortador)
4. [Modulo Jefe de Ventas](#modulo-jefe-de-ventas)
5. [Sistema Baseline](#sistema-baseline)
6. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Inicio de Sesion

1. Ingresa tu correo electronico corporativo
2. Ingresa tu contrasena
3. Haz clic en "Iniciar Sesion"

**Importante:** Tienes 3 intentos para ingresar las credenciales correctas. Despues del tercer intento fallido, deberas recargar la pagina.

---

## Modulo Asesor de Ventas

### Crear Nueva Nota de Pedido

1. **Consecutivo NP:** Ingresa el numero de nota pedido (ej: NP-2025-001)
2. **Fecha de Corte:** Selecciona la fecha programada usando el calendario
3. **Laminas por Material:** 
   - Selecciona el tipo de material (Aglomerado, Crudo o MDF)
   - Indica la cantidad de laminas para ese material
   - Haz clic en **"Agregar Material"** para agregar mas tipos
   - Puedes tener multiples materiales en una sola nota (ej: 3 crudo + 2 aglomerado + 1 MDF)
4. **Lleva Canto:** Marca la casilla si requiere enchape
   - **Canto Flexible:** Metros lineales (solo numeros enteros)
   - **Canto Rigido:** Metros lineales (solo numeros enteros)
5. **Planos de Corte:** Carga los archivos .ped de Lepton
6. Haz clic en **"Guardar Nota Pedido"**

### Gestionar Notas Existentes

- Visualiza todas tus notas en el panel derecho
- Filtra por dia de la semana
- Estados: Pendiente, En Corte, Cortado, En Enchape, Completado, Cerrado
- **Cerrar Nota:** Cuando el estado sea "Completado", puedes cerrarla como terminada
- Puedes ver los tiempos registrados incluyendo tiempo pausado

---

## Modulo Cortador

### Iniciar/Finalizar Turno

1. Al ingresar, haz clic en **"Iniciar Turno"** para comenzar a registrar tu jornada
2. El sistema registra automaticamente:
   - **Tiempo activo:** Mientras trabajas en cortes/enchapes
   - **Tiempo pausado:** Cuando pausas un trabajo
   - **Tiempo muerto:** Tiempo sin actividad durante el turno
3. Al terminar, haz clic en **"Finalizar Turno"** para cerrar tu jornada

### Seleccionar Nota de Pedido

1. Visualiza todas las notas programadas (ambos cortadores ven las mismas)
2. Revisa los detalles: laminas, material, cantos
3. Haz clic en **"Seleccionar"** en la nota que vas a procesar

### Proceso de Corte (Sierra Striebig)

1. Haz clic en la tarjeta **"Sierra Striebig"**
2. Veras la lista de todos los tableros a cortar
3. Para cada tablero:
   - **Iniciar Corte:** Comienza el cronometro
   - **Pausar:** Detiene temporalmente el tiempo (se registra como tiempo pausado)
   - **Continuar:** Reanuda desde la pausa
   - **Finalizar:** Completa ese tablero y guarda el tiempo
4. Una vez todos los tableros esten finalizados, haz clic en **"Finalizar Corte Completo"**

### Proceso de Enchape (Enchapadora Fravol)

- Se habilita automaticamente despues del corte (si la NP tiene enchapes programados)
- O puedes acceder directamente si el corte ya fue completado

#### Enchape Rigido
1. Haz clic en **"Iniciar"** en la seccion de Enchape Rigido
2. El cronometro comenzara
3. Puedes **Pausar/Reanudar** segun necesites
4. Haz clic en **"Finalizar"** cuando termines

#### Enchape Flexible
1. Haz clic en **"Iniciar"** en la seccion de Enchape Flexible
2. El cronometro comenzara
3. Puedes **Pausar/Reanudar** segun necesites
4. Haz clic en **"Finalizar"** cuando termines

5. Una vez finalizados todos los enchapes, haz clic en **"Finalizar Enchape Completo"**

---

## Modulo Jefe de Ventas

### Dashboard Principal

Visualiza metricas clave en tiempo real:
- Cortes del dia y totales
- Tiempo promedio por trabajo
- **Tiempo pausado promedio** (nuevo)
- NPs pendientes vs completadas
- Cortadores activos

### Pestana Rendimiento

- **Grafica de Cortes por Cortador:** Comparacion de productividad
- **Tiempo Pausado por Cortador:** Visualiza tiempos muertos
- Los datos se actualizan en tiempo real (indicador "En vivo")

### Pestana Maquinas

- Distribucion de uso entre Sierra y Enchapadora
- Grafica de pastel con porcentajes

### Pestana Tendencias

- Tendencia de productividad de los ultimos 7 dias
- Comparacion de cortes iniciados vs completados

### Pestana Notas Terminadas

- Detalles de tiempos por nota
- Tiempo de corte, enchape rigido, enchape flexible
- Tiempo pausado por cada proceso

### Pestana Planos

- Busca notas por numero
- Descarga archivos .ped de Lepton

### Pestana Usuarios

#### Crear Nuevo Usuario
1. Ingresa el nombre completo
2. Ingresa el correo electronico corporativo
3. Asigna una contrasena segura
4. Selecciona el rol: Cortador, Asesor o Jefe
5. Haz clic en **"Crear Usuario"**

#### Gestionar Usuarios
- Visualiza todos los usuarios registrados
- Puedes eliminar usuarios (excepto jefes de ventas)
- Los cambios se aplican inmediatamente

---

## Sistema Baseline

### Que es el Sistema Baseline?

El sistema baseline permite establecer tiempos de referencia para medir el rendimiento de los cortadores. Tu (el administrador) puedes registrar tiempos de corte y enchape que serviran como "tiempo ideal" o "meta".

### Como Establecer el Baseline

1. **Inicia sesion** con el usuario especial: baseline@mosquera.com / baseline123
2. **Selecciona** una nota de pedido normalmente
3. **Ejecuta** el proceso de corte y/o enchape a tu ritmo optimo
4. **Los tiempos** se guardan automaticamente como referencia
5. **Repite** para diferentes tipos de material y cantidades de laminas

### Como ver la Comparacion

1. Inicia sesion como Jefe de Ventas
2. Ve a la pestana de Rendimiento
3. Veras una comparacion del tiempo de cada cortador vs el baseline
4. Los cortadores que excedan el baseline se muestran en amarillo/rojo

---

## Preguntas Frecuentes

**P: Por que no veo mis cambios despues de actualizar?**  
R: Presiona Ctrl + F5 (Windows) o Cmd + Shift + R (Mac) para forzar la recarga.

**P: Puedo pausar un corte y continuar despues?**  
R: Si, el boton "Pausar" detiene el cronometro. Al presionar "Continuar" se reanuda desde donde lo dejaste. El tiempo pausado se registra por separado.

**P: Que pasa si no requiero enchape?**  
R: El sistema detecta automaticamente si la NP no tiene enchapes programados y finaliza el proceso despues del corte.

**P: Puedo agregar multiples materiales a una nota?**  
R: Si! Ahora puedes agregar diferentes tipos de material en una sola nota usando el boton "Agregar Material".

**P: Puedo ver las notas de otros asesores?**  
R: No, cada asesor solo ve sus propias notas. El jefe de ventas puede ver todas.

**P: Que pasa si abro la app en otro PC?**  
R: Los datos estan guardados en la nube (Supabase), asi que podras ver todo tu historial desde cualquier dispositivo.

**P: Cortador 1 y Cortador 2 ven las mismas notas?**  
R: Si, ambos cortadores ven el mismo panel con las mismas notas pendientes. Pueden trabajar en el mismo turno.

**P: Como se calcula el tiempo muerto del turno?**  
R: Tiempo muerto = Duracion total del turno - Tiempo activo - Tiempo pausado

**P: Para que sirve el usuario baseline?**  
R: Sirve para establecer tiempos de referencia. Cuando trabajas como baseline, tus tiempos se usan para comparar el rendimiento de los demas cortadores.

---

**Desarrollado por Miguel Angel Pardo**  
**© 2025-2026 Centro de Corte Mosquera - Homecenter**
