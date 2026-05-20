# Arquitecto — Asistentes de Proyecto

Herramienta de gestión de proyectos de arquitectura con 5 asistentes especializados impulsados por Claude.

## Asistentes incluidos

- **Urbanismo** — Planeamiento, usos, edificabilidad, retranqueos
- **CTE / Normativa Técnica** — Código Técnico, DB, requisitos del edificio
- **Instalaciones** — Climatización, ventilación, saneamiento, electricidad
- **CYPE** — Estructura, cálculo, modelado en CYPE 3D y CYPECAD
- **Presupuesto y Memorias** — Mediciones, presupuesto, memoria constructiva

## Configuración inicial

### 1. Supabase (nuevo proyecto)

1. Crea un proyecto nuevo en https://supabase.com
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase-schema.sql`
3. Copia la URL del proyecto y la `anon key` desde **Settings > API**

### 2. Variables de entorno

Crea un archivo `.env` en la raíz:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Instalación local

```bash
npm install
npm run dev
```

### 4. Deploy en Netlify

1. Sube el repositorio a GitHub
2. Conecta el repo en Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Añade las 3 variables de entorno en **Site settings > Environment variables**

## Flujo de uso

1. Crea un proyecto con la ficha completa (municipio, superficies, normativa, etc.)
2. Accede a cualquier asistente — todos conocen el proyecto automáticamente
3. Las conversaciones se guardan por proyecto y agente
4. Puedes editar la ficha del proyecto en cualquier momento

## Notas

- La API key de Anthropic está expuesta en el cliente. Para uso personal está bien; si lo abres a otros usuarios, mueve las llamadas a una función serverless.
- Las conversaciones se guardan en Supabase. RLS está desactivado (uso personal).
