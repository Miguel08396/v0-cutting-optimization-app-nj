-- Script 012: Agregar campo de perforaciones a notas_pedido
-- Este campo permite registrar si la nota lleva perforaciones y cuántas

-- Agregar columna lleva_perforaciones
ALTER TABLE notas_pedido 
ADD COLUMN IF NOT EXISTS lleva_perforaciones BOOLEAN DEFAULT FALSE;

-- Agregar columna cantidad_perforaciones
ALTER TABLE notas_pedido 
ADD COLUMN IF NOT EXISTS cantidad_perforaciones INTEGER DEFAULT 0;

-- Comentarios
COMMENT ON COLUMN notas_pedido.lleva_perforaciones IS 'Indica si la nota de pedido requiere perforaciones';
COMMENT ON COLUMN notas_pedido.cantidad_perforaciones IS 'Número de perforaciones requeridas';
