-- Script para agregar soporte de múltiples materiales por nota de pedido
-- Este script agrega una nueva tabla para detallar las láminas por material

-- Nueva tabla para detallar láminas por material en cada nota
CREATE TABLE IF NOT EXISTS laminas_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id UUID NOT NULL REFERENCES notas_pedido(id) ON DELETE CASCADE,
  tipo_material TEXT NOT NULL CHECK (tipo_material IN ('aglomerado', 'crudo', 'mdf')),
  cantidad INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE laminas_detalle ENABLE ROW LEVEL SECURITY;

-- Política permisiva para la tabla
CREATE POLICY "Allow all on laminas_detalle" ON laminas_detalle FOR ALL USING (true) WITH CHECK (true);

-- Índice para búsquedas rápidas
CREATE INDEX idx_laminas_detalle_nota ON laminas_detalle(nota_id);

-- Agregar columna es_baseline a usuarios si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'es_baseline') THEN
    ALTER TABLE usuarios ADD COLUMN es_baseline BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
