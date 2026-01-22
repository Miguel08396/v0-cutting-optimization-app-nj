-- Agregar madera_seca como tipo de material válido
ALTER TABLE notas_pedido DROP CONSTRAINT IF EXISTS notas_pedido_tipo_material_check;
ALTER TABLE notas_pedido ADD CONSTRAINT notas_pedido_tipo_material_check 
  CHECK (tipo_material IN ('aglomerado', 'crudo', 'mdf', 'madera_seca'));

-- Actualizar también la tabla laminas_detalle si existe
ALTER TABLE laminas_detalle DROP CONSTRAINT IF EXISTS laminas_detalle_tipo_material_check;
ALTER TABLE laminas_detalle ADD CONSTRAINT laminas_detalle_tipo_material_check 
  CHECK (tipo_material IN ('aglomerado', 'crudo', 'mdf', 'madera_seca'));
