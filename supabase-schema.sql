-- EJECUTAR EN SUPABASE SQL EDITOR
-- Proyecto nuevo, base de datos limpia

-- Tabla de proyectos
CREATE TABLE proyectos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cliente TEXT,
  municipio TEXT,
  provincia TEXT,
  descripcion TEXT,
  uso TEXT, -- vivienda unifamiliar, plurifamiliar, comercial, etc.
  superficie_parcela NUMERIC,
  superficie_construida NUMERIC,
  referencia_catastral TEXT,
  zona_climatica TEXT,
  normativa_aplicable TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de conversaciones por agente y proyecto
CREATE TABLE conversaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  agente_id TEXT NOT NULL, -- 'urbanismo', 'cte', 'instalaciones', 'cype', 'presupuesto'
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proyecto_id, agente_id)
);

-- Índices
CREATE INDEX idx_conversaciones_proyecto ON conversaciones(proyecto_id);
CREATE INDEX idx_conversaciones_agente ON conversaciones(agente_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proyectos_updated_at
  BEFORE UPDATE ON proyectos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversaciones_updated_at
  BEFORE UPDATE ON conversaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS desactivado para uso personal (activar si hay múltiples usuarios)
ALTER TABLE proyectos DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversaciones DISABLE ROW LEVEL SECURITY;
