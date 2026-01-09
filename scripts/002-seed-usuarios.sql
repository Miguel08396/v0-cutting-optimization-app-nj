-- Insertar usuarios de prueba incluyendo usuario baseline (tú)
INSERT INTO usuarios (nombre, email, password, role, activo, es_baseline) VALUES
  ('Usuario Baseline', 'baseline@homecenter.com', 'baseline123', 'cortador', true, true),
  ('Cortador 1', 'cortador1@homecenter.com', 'cortador123', 'cortador', true, false),
  ('Cortador 2', 'cortador2@homecenter.com', 'cortador123', 'cortador', true, false),
  ('Jefe de Ventas', 'jefe@homecenter.com', 'jefe123', 'jefe_ventas', true, false),
  ('Asesor Ventas 1', 'asesor1@homecenter.com', 'asesor123', 'asesor_ventas', true, false),
  ('Asesor Ventas 2', 'asesor2@homecenter.com', 'asesor123', 'asesor_ventas', true, false)
ON CONFLICT (email) DO NOTHING;
