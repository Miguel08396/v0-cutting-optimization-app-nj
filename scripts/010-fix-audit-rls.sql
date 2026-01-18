-- Fix: El trigger de auditoría necesita poder insertar sin restricciones RLS
-- La función debe ejecutarse con privilegios de definer (superuser)

-- Primero, recrear la función con SECURITY DEFINER para que bypassee RLS
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER 
SECURITY DEFINER  -- Esto permite que el trigger inserte sin restricciones RLS
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tabla, accion, registro_id, datos_nuevos)
    VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tabla, accion, registro_id, datos_anteriores, datos_nuevos)
    VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tabla, accion, registro_id, datos_anteriores)
    VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Alternativa: Si SECURITY DEFINER no funciona, deshabilitar RLS para audit_log
-- ya que es una tabla interna del sistema
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Re-habilitar con política más permisiva para INSERT (triggers del sistema)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Permitir que cualquier usuario autenticado pueda insertar (via triggers)
DROP POLICY IF EXISTS "Triggers pueden insertar audit" ON audit_log;
CREATE POLICY "Triggers pueden insertar audit" ON audit_log
  FOR INSERT WITH CHECK (true);

-- Solo jefes pueden ver el log de auditoría  
DROP POLICY IF EXISTS "Jefes pueden ver audit" ON audit_log;
CREATE POLICY "Jefes pueden ver audit" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND role = 'jefe_ventas'
    )
  );
