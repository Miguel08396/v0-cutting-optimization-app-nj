-- Agregar campo tipo_entrega a notas_pedido (domicilio, retiro, portable)
ALTER TABLE notas_pedido
ADD COLUMN IF NOT EXISTS tipo_entrega TEXT DEFAULT 'retiro' CHECK (tipo_entrega IN ('domicilio', 'retiro', 'portable'));

-- Agregar campo cantidad_desplazamientos a notas_pedido
ALTER TABLE notas_pedido
ADD COLUMN IF NOT EXISTS cantidad_desplazamientos INTEGER DEFAULT 0;

-- Comentarios para documentación
COMMENT ON COLUMN notas_pedido.tipo_entrega IS 'Tipo de entrega: domicilio (prioridad alta), retiro (prioridad media), portable (prioridad baja)';
COMMENT ON COLUMN notas_pedido.cantidad_desplazamientos IS 'Cantidad de desplazamientos de sierra por corte';
