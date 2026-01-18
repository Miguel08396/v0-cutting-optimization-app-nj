-- Habilitar Realtime para tablas específicas
-- Esto permite suscripciones en tiempo real desde el cliente

-- Habilitar replicación para las tablas principales
ALTER PUBLICATION supabase_realtime ADD TABLE notas_pedido;
ALTER PUBLICATION supabase_realtime ADD TABLE turnos;
ALTER PUBLICATION supabase_realtime ADD TABLE registros_corte;
ALTER PUBLICATION supabase_realtime ADD TABLE registros_enchape;
ALTER PUBLICATION supabase_realtime ADD TABLE pausas;
