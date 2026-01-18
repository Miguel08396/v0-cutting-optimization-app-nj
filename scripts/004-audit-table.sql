-- Tabla de auditoría para trazabilidad completa
-- Esta tabla registra automáticamente todas las acciones en el sistema

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla TEXT NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id UUID,
  usuario_id UUID REFERENCES usuarios(id),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address TEXT,
  user_agent TEXT,
  fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_tabla ON audit_log(tabla);
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON audit_log(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_registro ON audit_log(registro_id);

-- Función para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
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

-- Triggers para cada tabla principal
DROP TRIGGER IF EXISTS audit_notas_pedido ON notas_pedido;
CREATE TRIGGER audit_notas_pedido
  AFTER INSERT OR UPDATE OR DELETE ON notas_pedido
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_turnos ON turnos;
CREATE TRIGGER audit_turnos
  AFTER INSERT OR UPDATE OR DELETE ON turnos
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_registros_corte ON registros_corte;
CREATE TRIGGER audit_registros_corte
  AFTER INSERT OR UPDATE OR DELETE ON registros_corte
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_registros_enchape ON registros_enchape;
CREATE TRIGGER audit_registros_enchape
  AFTER INSERT OR UPDATE OR DELETE ON registros_enchape
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_pausas ON pausas;
CREATE TRIGGER audit_pausas
  AFTER INSERT OR UPDATE OR DELETE ON pausas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Habilitar RLS en audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Solo jefes pueden ver el log de auditoría
CREATE POLICY "Jefes pueden ver audit" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND role = 'jefe_ventas'
    )
  );
