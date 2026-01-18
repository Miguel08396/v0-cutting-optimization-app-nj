-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('cortador', 'jefe_ventas', 'asesor_ventas')),
  activo BOOLEAN DEFAULT true,
  es_baseline BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notas de pedido
CREATE TABLE IF NOT EXISTS notas_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) NOT NULL,
  asesor_id UUID REFERENCES usuarios(id),
  asesor_nombre VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_corte DATE NOT NULL,
  cantidad_laminas INTEGER NOT NULL DEFAULT 1,
  tipo_material VARCHAR(50) NOT NULL CHECK (tipo_material IN ('aglomerado', 'crudo', 'mdf')),
  lleva_canto BOOLEAN DEFAULT false,
  canto_flexible DECIMAL(10,2) DEFAULT 0,
  canto_rigido DECIMAL(10,2) DEFAULT 0,
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_corte', 'cortado', 'en_enchape', 'completado', 'cerrado')),
  cortador_asignado UUID REFERENCES usuarios(id),
  cortador_nombre VARCHAR(255),
  tiempo_corte INTEGER,
  tiempo_enchape_rigido INTEGER,
  tiempo_enchape_flexible INTEGER,
  tiempo_pausado_corte INTEGER DEFAULT 0,
  tiempo_pausado_enchape INTEGER DEFAULT 0,
  fecha_inicio_proceso TIMESTAMP WITH TIME ZONE,
  fecha_fin_corte TIMESTAMP WITH TIME ZONE,
  fecha_inicio_enchape TIMESTAMP WITH TIME ZONE,
  fecha_fin_enchape TIMESTAMP WITH TIME ZONE,
  corte_completado BOOLEAN DEFAULT false,
  enchape_completado BOOLEAN DEFAULT false,
  archivos_ped JSONB DEFAULT '[]'::jsonb,
  imagenes_plano JSONB DEFAULT '[]'::jsonb
);

-- Tabla de registros de corte
CREATE TABLE IF NOT EXISTS registros_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id UUID NOT NULL REFERENCES notas_pedido(id) ON DELETE CASCADE,
  numero_lamina INTEGER NOT NULL,
  hora_inicio TIMESTAMP WITH TIME ZONE,
  hora_fin TIMESTAMP WITH TIME ZONE,
  tiempo_total INTEGER,
  tiempo_pausado INTEGER DEFAULT 0,
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'pausado', 'completado')),
  cortador_id UUID REFERENCES usuarios(id)
);

-- Tabla de registros de enchape
CREATE TABLE IF NOT EXISTS registros_enchape (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id UUID NOT NULL REFERENCES notas_pedido(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('rigido', 'flexible')),
  hora_inicio TIMESTAMP WITH TIME ZONE,
  hora_fin TIMESTAMP WITH TIME ZONE,
  tiempo_total INTEGER,
  tiempo_pausado INTEGER DEFAULT 0,
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'pausado', 'completado')),
  cortador_id UUID REFERENCES usuarios(id)
);

-- Tabla de turnos
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cortador_id UUID NOT NULL REFERENCES usuarios(id),
  fecha DATE NOT NULL,
  hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  hora_fin TIMESTAMP WITH TIME ZONE,
  duracion_turno INTEGER DEFAULT 28800, -- 8 horas en segundos
  tiempo_activo INTEGER DEFAULT 0,
  tiempo_pausado INTEGER DEFAULT 0,
  tiempo_muerto INTEGER DEFAULT 0,
  estado VARCHAR(50) DEFAULT 'activo' CHECK (estado IN ('activo', 'finalizado'))
);

-- Tabla de pausas
CREATE TABLE IF NOT EXISTS pausas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_corte_id UUID REFERENCES registros_corte(id) ON DELETE CASCADE,
  registro_enchape_id UUID REFERENCES registros_enchape(id) ON DELETE CASCADE,
  turno_id UUID REFERENCES turnos(id) ON DELETE CASCADE,
  hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  hora_fin TIMESTAMP WITH TIME ZONE,
  duracion INTEGER,
  motivo VARCHAR(255)
);

-- Tabla de métricas baseline
CREATE TABLE IF NOT EXISTS metricas_baseline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_operacion VARCHAR(50) NOT NULL CHECK (tipo_operacion IN ('corte', 'enchape_rigido', 'enchape_flexible')),
  tipo_material VARCHAR(50),
  cantidad_laminas INTEGER,
  tiempo_promedio INTEGER NOT NULL,
  tiempo_minimo INTEGER,
  tiempo_maximo INTEGER,
  muestras INTEGER DEFAULT 1,
  usuario_baseline_id UUID REFERENCES usuarios(id),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_notas_estado ON notas_pedido(estado);
CREATE INDEX IF NOT EXISTS idx_notas_fecha_corte ON notas_pedido(fecha_corte);
CREATE INDEX IF NOT EXISTS idx_turnos_cortador_fecha ON turnos(cortador_id, fecha);
CREATE INDEX IF NOT EXISTS idx_registros_corte_nota ON registros_corte(nota_id);
CREATE INDEX IF NOT EXISTS idx_registros_enchape_nota ON registros_enchape(nota_id);
CREATE INDEX IF NOT EXISTS idx_pausas_corte ON pausas(registro_corte_id);
CREATE INDEX IF NOT EXISTS idx_pausas_enchape ON pausas(registro_enchape_id);
