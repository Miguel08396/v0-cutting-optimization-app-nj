-- Vistas SQL para métricas avanzadas
-- Estas vistas no afectan las tablas existentes

-- Vista: Rendimiento por cortador
CREATE OR REPLACE VIEW v_rendimiento_cortadores AS
SELECT 
  u.id as cortador_id,
  u.nombre as cortador_nombre,
  COUNT(np.id) as total_trabajos,
  COUNT(CASE WHEN np.estado IN ('completado', 'cerrado') THEN 1 END) as trabajos_completados,
  COALESCE(AVG(np.tiempo_corte), 0) as tiempo_promedio_corte,
  COALESCE(AVG(np.tiempo_enchape_rigido + np.tiempo_enchape_flexible), 0) as tiempo_promedio_enchape,
  COALESCE(AVG(np.tiempo_pausado_corte + np.tiempo_pausado_enchape), 0) as tiempo_promedio_pausado,
  COALESCE(SUM(np.cantidad_laminas), 0) as total_laminas_cortadas,
  CASE 
    WHEN SUM(np.cantidad_laminas) > 0 
    THEN COALESCE(SUM(np.tiempo_corte), 0) / NULLIF(SUM(np.cantidad_laminas), 0)
    ELSE 0 
  END as segundos_por_lamina
FROM usuarios u
LEFT JOIN notas_pedido np ON u.id = np.cortador_asignado
WHERE u.role = 'cortador' AND u.activo = true
GROUP BY u.id, u.nombre;

-- Vista: Métricas por turno
CREATE OR REPLACE VIEW v_metricas_turnos AS
SELECT 
  t.id as turno_id,
  t.cortador_id,
  u.nombre as cortador_nombre,
  t.fecha,
  t.hora_inicio,
  t.hora_fin,
  t.duracion_turno,
  t.tiempo_activo,
  t.tiempo_pausado,
  t.tiempo_muerto,
  CASE 
    WHEN t.duracion_turno > 0 
    THEN ROUND((t.tiempo_activo::numeric / t.duracion_turno) * 100, 2)
    ELSE 0 
  END as porcentaje_productividad,
  CASE 
    WHEN t.duracion_turno > 0 
    THEN ROUND((t.tiempo_muerto::numeric / t.duracion_turno) * 100, 2)
    ELSE 0 
  END as porcentaje_tiempo_muerto
FROM turnos t
JOIN usuarios u ON t.cortador_id = u.id
ORDER BY t.fecha DESC, t.hora_inicio DESC;

-- Vista: Rendimiento semanal
CREATE OR REPLACE VIEW v_rendimiento_semanal AS
SELECT 
  DATE_TRUNC('week', np.fecha_creacion) as semana,
  COUNT(np.id) as notas_creadas,
  COUNT(CASE WHEN np.estado IN ('completado', 'cerrado') THEN 1 END) as notas_completadas,
  COALESCE(AVG(np.tiempo_corte), 0) as tiempo_promedio_corte,
  COALESCE(SUM(np.cantidad_laminas), 0) as laminas_totales,
  COUNT(DISTINCT np.cortador_asignado) as cortadores_activos
FROM notas_pedido np
WHERE np.fecha_creacion >= NOW() - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', np.fecha_creacion)
ORDER BY semana DESC;

-- Vista: Tiempo promedio por material
CREATE OR REPLACE VIEW v_tiempo_por_material AS
SELECT 
  tipo_material,
  COUNT(*) as cantidad_trabajos,
  COALESCE(AVG(tiempo_corte), 0) as tiempo_promedio_corte,
  COALESCE(AVG(tiempo_enchape_rigido), 0) as tiempo_promedio_enchape_rigido,
  COALESCE(AVG(tiempo_enchape_flexible), 0) as tiempo_promedio_enchape_flexible,
  COALESCE(AVG(cantidad_laminas), 0) as laminas_promedio,
  CASE 
    WHEN SUM(cantidad_laminas) > 0 
    THEN SUM(tiempo_corte) / NULLIF(SUM(cantidad_laminas), 0)
    ELSE 0 
  END as segundos_por_lamina
FROM notas_pedido
WHERE estado IN ('completado', 'cerrado')
GROUP BY tipo_material
ORDER BY cantidad_trabajos DESC;

-- Vista: Comparación con baseline
CREATE OR REPLACE VIEW v_comparacion_baseline AS
SELECT 
  u.id as cortador_id,
  u.nombre as cortador_nombre,
  mb.tipo_operacion,
  mb.tiempo_promedio as baseline_tiempo,
  COALESCE(AVG(
    CASE 
      WHEN mb.tipo_operacion = 'corte' THEN np.tiempo_corte
      WHEN mb.tipo_operacion = 'enchape_rigido' THEN np.tiempo_enchape_rigido
      WHEN mb.tipo_operacion = 'enchape_flexible' THEN np.tiempo_enchape_flexible
    END
  ), 0) as tiempo_real,
  CASE 
    WHEN mb.tiempo_promedio > 0 
    THEN ROUND((
      COALESCE(AVG(
        CASE 
          WHEN mb.tipo_operacion = 'corte' THEN np.tiempo_corte
          WHEN mb.tipo_operacion = 'enchape_rigido' THEN np.tiempo_enchape_rigido
          WHEN mb.tipo_operacion = 'enchape_flexible' THEN np.tiempo_enchape_flexible
        END
      ), 0) / mb.tiempo_promedio - 1
    ) * 100, 2)
    ELSE 0 
  END as porcentaje_diferencia
FROM usuarios u
CROSS JOIN metricas_baseline mb
LEFT JOIN notas_pedido np ON u.id = np.cortador_asignado 
  AND np.estado IN ('completado', 'cerrado')
WHERE u.role = 'cortador' AND u.activo = true AND u.es_baseline = false
GROUP BY u.id, u.nombre, mb.tipo_operacion, mb.tiempo_promedio;

-- Vista: Resumen diario
CREATE OR REPLACE VIEW v_resumen_diario AS
SELECT 
  DATE(fecha_creacion) as fecha,
  COUNT(*) as notas_totales,
  COUNT(CASE WHEN estado IN ('completado', 'cerrado') THEN 1 END) as completadas,
  COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
  COUNT(CASE WHEN estado IN ('en_corte', 'en_enchape') THEN 1 END) as en_proceso,
  SUM(cantidad_laminas) as laminas_totales,
  COALESCE(AVG(tiempo_corte), 0) as tiempo_promedio_corte,
  COALESCE(AVG(tiempo_pausado_corte + tiempo_pausado_enchape), 0) as tiempo_promedio_pausado
FROM notas_pedido
WHERE fecha_creacion >= NOW() - INTERVAL '30 days'
GROUP BY DATE(fecha_creacion)
ORDER BY fecha DESC;
