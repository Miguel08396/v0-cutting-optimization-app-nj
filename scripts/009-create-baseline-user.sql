-- Script para crear el usuario baseline
-- Este usuario se usa para establecer métricas de referencia

-- Insertar usuario baseline si no existe
INSERT INTO usuarios (id, nombre, email, password, role, activo, es_baseline)
SELECT 
  gen_random_uuid(),
  'Usuario Baseline',
  'baseline@mosquera.com',
  'baseline123',
  'cortador',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'baseline@mosquera.com'
);

-- Actualizar usuario existente si ya existe pero no tiene es_baseline
UPDATE usuarios 
SET es_baseline = true 
WHERE email = 'baseline@mosquera.com' AND es_baseline = false;
