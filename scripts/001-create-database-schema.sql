-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('cortador', 'jefe_ventas', 'asesor_ventas')),
  activo BOOLEAN DEFAULT true,
  es_baseline BOOLEAN DEFAULT false, -- Para marcar si es usuario de referencia (baseline)
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notas de pedido
CREATE TABLE IF NOT EXISTS notas_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  asesor_id UUID REFERENCES usuarios(id),
  asesor_nombre TEXT NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_corte TIMESTAMP WITH TIME ZONE NOT NULL,
  cantidad_laminas INTEGER NOT NULL,
  tipo_material TEXT NOT NULL CHECK (tipo_material IN ('aglomerado', 'crudo', 'mdf')),
  lleva_canto BOOLEAN DEFAULT false,
  canto_flexible NUMERIC DEFAULT 0,
  canto_rigido NUMERIC DEFAULT 0,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_corte', 'cortado', 'en_enchape', 'completado', 'cerrado')),
  cortador_asignado UUID REFERENCES usuarios(id),
  cortador_nombre TEXT,
  tiempo_corte INTEGER, -- en segundos
  tiempo_enchape_rigido INTEGER,
  tiempo_enchape_flexible INTEGER,
  -- Nuevos campos para tiempo pausado
  tiempo_pausado_corte INTEGER DEFAULT 0, -- tiempo total pausado en corte (segundos)
  tiempo_pausado_enchape INTEGER DEFAULT 0, -- tiempo total pausado en enchape (segundos)
  fecha_inicio_proceso TIMESTAMP WITH TIME ZONE,
  fecha_fin_corte TIMESTAMP WITH TIME ZONE,
  fecha_inicio_enchape TIMESTAMP WITH TIME ZONE,
  fecha_fin_enchape TIMESTAMP WITH TIME ZONE,
  corte_completado BOOLEAN DEFAULT false,
  enchape_completado BOOLEAN DEFAULT false,
  archivos_ped JSONB DEFAULT '[]'::jsonb,
  imagenes_plano JSONB DEFAULT '[]'::jsonb
);

-- Tabla para registros de corte por lámina (con tiempo pausado)
CREATE TABLE IF NOT EXISTS registros_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id UUID REFERENCES notas_pedido(id) ON DELETE CASCADE,
  numero_lamina INTEGER NOT NULL,
  hora_inicio TIMESTAMP WITH TIME ZONE,
  hora_fin TIMESTAMP WITH TIME ZONE,
  tiempo_total INTEGER, -- en segundos (tiempo activo)
  tiempo_pausado INTEGER DEFAULT 0, -- tiempo total pausado en segundos
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'pausado', 'completado')),
  cortador_id UUID REFERENCES usuarios(id),
  UNIQUE(nota_id, numero_lamina)
);

-- Tabla para registros de enchape (con tiempo pausado)
CREATE TABLE IF NOT EXISTS registros_enchape (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id UUID REFERENCES notas_pedido(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('rigido', 'flexible')),
  hora_inicio TIMESTAMP WITH TIME ZONE,
  hora_fin TIMESTAMP WITH TIME ZONE,
  tiempo_total INTEGER, -- en segundos (tiempo activo)
  tiempo_pausado INTEGER DEFAULT 0, -- tiempo total pausado en segundos
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'pausado', 'completado')),
  cortador_id UUID REFERENCES usuarios(id),
  UNIQUE(nota_id, tipo)
);

-- Tabla para turnos de trabajo (medir tiempos muertos)
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cortador_id UUID REFERENCES usuarios(id),
  fecha DATE NOT NULL,
  hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  hora_fin TIMESTAMP WITH TIME ZONE,
  duracion_turno INTEGER DEFAULT 28800, -- 8 horas en segundos por defecto
  tiempo_activo INTEGER DEFAULT 0, -- tiempo trabajando activamente
  tiempo_pausado INTEGER DEFAULT 0, -- tiempo en pausas durante trabajo
  tiempo_muerto INTEGER DEFAULT 0, -- tiempo sin hacer nada (diferencia)
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'finalizado')),
  UNIQUE(cortador_id, fecha)
);

-- Tabla para métricas baseline (referencia de rendimiento)
CREATE TABLE IF NOT EXISTS metricas_baseline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_operacion TEXT NOT NULL CHECK (tipo_operacion IN ('corte', 'enchape_rigido', 'enchape_flexible')),
  tipo_material TEXT,
  cantidad_laminas INTEGER,
  tiempo_promedio INTEGER NOT NULL, -- en segundos
  tiempo_minimo INTEGER,
  tiempo_maximo INTEGER,
  muestras INTEGER DEFAULT 1, -- cantidad de registros usados para calcular
  usuario_baseline_id UUID REFERENCES usuarios(id), -- usuario de referencia
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para pausas individuales (historial detallado)
CREATE TABLE IF NOT EXISTS pausas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_corte_id UUID REFERENCES registros_corte(id) ON DELETE CASCADE,
  registro_enchape_id UUID REFERENCES registros_enchape(id) ON DELETE CASCADE,
  turno_id UUID REFERENCES turnos(id) ON DELETE CASCADE,
  hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  hora_fin TIMESTAMP WITH TIME ZONE,
  duracion INTEGER, -- en segundos
  motivo TEXT,
  CHECK (
    (registro_corte_id IS NOT NULL AND registro_enchape_id IS NULL) OR
    (registro_corte_id IS NULL AND registro_enchape_id IS NOT NULL) OR
    (registro_corte_id IS NULL AND registro_enchape_id IS NULL AND turno_id IS NOT NULL)
  )
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_notas_estado ON notas_pedido(estado);
CREATE INDEX IF NOT EXISTS idx_notas_fecha_corte ON notas_pedido(fecha_corte);
CREATE INDEX IF NOT EXISTS idx_notas_asesor ON notas_pedido(asesor_id);
CREATE INDEX IF NOT EXISTS idx_registros_corte_nota ON registros_corte(nota_id);
CREATE INDEX IF NOT EXISTS idx_registros_enchape_nota ON registros_enchape(nota_id);
CREATE INDEX IF NOT EXISTS idx_turnos_cortador ON turnos(cortador_id, fecha);
CREATE INDEX IF NOT EXISTS idx_pausas_turno ON pausas(turno_id);

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_corte ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_enchape ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_baseline ENABLE ROW LEVEL SECURITY;
ALTER TABLE pausas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir acceso para la app - sin autenticación Supabase Auth)
-- Para este caso usamos políticas permisivas ya que la autenticación es interna
CREATE POLICY "Allow all for usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for notas_pedido" ON notas_pedido FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for registros_corte" ON registros_corte FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for registros_enchape" ON registros_enchape FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for turnos" ON turnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for metricas_baseline" ON metricas_baseline FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for pausas" ON pausas FOR ALL USING (true) WITH CHECK (true);
