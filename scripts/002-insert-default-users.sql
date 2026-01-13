-- Insertar usuarios por defecto
INSERT INTO usuarios (id, nombre, email, password, role, activo, es_baseline)
VALUES 
  (gen_random_uuid(), 'Cortador 1', 'cortador1@mosquera.com', 'cortador123', 'cortador', true, false),
  (gen_random_uuid(), 'Cortador 2', 'cortador2@mosquera.com', 'cortador123', 'cortador', true, false),
  (gen_random_uuid(), 'Jefe de Ventas', 'jardilar@homecenter.com', 'jefe123', 'jefe_ventas', true, false),
  (gen_random_uuid(), 'Asesor de Ventas', 'asesor@mosquera.com', 'asesor123', 'asesor_ventas', true, false),
  -- Usuario baseline para métricas de referencia (tu usuario)
  (gen_random_uuid(), 'Usuario Baseline', 'baseline@mosquera.com', 'baseline123', 'cortador', true, true)
ON CONFLICT (email) DO NOTHING;
