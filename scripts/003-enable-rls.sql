-- Habilitar Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_corte ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_enchape ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pausas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_baseline ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para que funcione sin auth (desarrollo)
CREATE POLICY "Allow all on usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notas_pedido" ON notas_pedido FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on registros_corte" ON registros_corte FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on registros_enchape" ON registros_enchape FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on turnos" ON turnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pausas" ON pausas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on metricas_baseline" ON metricas_baseline FOR ALL USING (true) WITH CHECK (true);
