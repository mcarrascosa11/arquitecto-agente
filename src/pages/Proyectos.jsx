import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AGENTS } from '../lib/agents'
import { Plus, ArrowRight, MapPin, Layers } from 'lucide-react'

const USOS = [
  'Vivienda unifamiliar',
  'Vivienda plurifamiliar',
  'Local comercial',
  'Edificio de oficinas',
  'Nave industrial',
  'Equipamiento público',
  'Rehabilitación',
  'Otro',
]

const ZONAS = ['α1', 'α2', 'α3', 'A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'E1']

export default function Proyectos() {
  const [proyectos, setProyectos] = useState([])
  const [mostrando, setMostrando] = useState('lista') // 'lista' | 'nuevo'
  const [form, setForm] = useState({
    nombre: '', cliente: '', municipio: '', provincia: '',
    descripcion: '', uso: 'Vivienda unifamiliar',
    superficie_parcela: '', superficie_construida: '',
    referencia_catastral: '', zona_climatica: '',
    normativa_aplicable: '', notas: '',
  })
  const [guardando, setGuardando] = useState(false)
  const navigate = useNavigate()
  const { recargarProyectos } = useOutletContext()

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase
      .from('proyectos')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
    if (data) setProyectos(data)
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    const payload = { ...form }
    if (payload.superficie_parcela) payload.superficie_parcela = parseFloat(payload.superficie_parcela)
    if (payload.superficie_construida) payload.superficie_construida = parseFloat(payload.superficie_construida)

    const { data, error } = await supabase.from('proyectos').insert(payload).select().single()
    setGuardando(false)
    if (!error && data) {
      await recargarProyectos()
      navigate(`/proyecto/${data.id}`)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  if (mostrando === 'nuevo') {
    return (
      <div style={{ height: '100%', overflowY: 'auto', padding: '40px 48px' }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2em',
              fontWeight: 400,
              color: 'var(--hueso)',
              marginBottom: 8,
            }}>
              Nuevo proyecto
            </h1>
            <p style={{ color: 'var(--piedra)', fontSize: '13px' }}>
              Esta ficha es el contexto compartido que todos los asistentes conocerán.
            </p>
          </div>

          <form onSubmit={guardar}>
            <Section titulo="Identificación">
              <Row>
                <Field label="Nombre del proyecto *" span={2}>
                  <input value={form.nombre} onChange={set('nombre')} required placeholder="Ej: Vivienda unifamiliar Cintruénigo" />
                </Field>
                <Field label="Cliente">
                  <input value={form.cliente} onChange={set('cliente')} placeholder="Nombre del cliente" />
                </Field>
              </Row>
              <Row>
                <Field label="Municipio">
                  <input value={form.municipio} onChange={set('municipio')} placeholder="Municipio" />
                </Field>
                <Field label="Provincia">
                  <input value={form.provincia} onChange={set('provincia')} placeholder="Navarra, Zaragoza..." />
                </Field>
                <Field label="Uso principal">
                  <select value={form.uso} onChange={set('uso')}>
                    {USOS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </Field>
              </Row>
            </Section>

            <Section titulo="Datos técnicos">
              <Row>
                <Field label="Sup. parcela (m²)">
                  <input type="number" value={form.superficie_parcela} onChange={set('superficie_parcela')} placeholder="0" />
                </Field>
                <Field label="Sup. construida (m²)">
                  <input type="number" value={form.superficie_construida} onChange={set('superficie_construida')} placeholder="0" />
                </Field>
                <Field label="Zona climática CTE">
                  <select value={form.zona_climatica} onChange={set('zona_climatica')}>
                    <option value="">—</option>
                    {ZONAS.map(z => <option key={z}>{z}</option>)}
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="Referencia catastral" span={2}>
                  <input value={form.referencia_catastral} onChange={set('referencia_catastral')} placeholder="20 caracteres" />
                </Field>
              </Row>
            </Section>

            <Section titulo="Descripción y normativa">
              <Field label="Descripción del proyecto" span="full">
                <textarea
                  value={form.descripcion}
                  onChange={set('descripcion')}
                  rows={3}
                  placeholder="Descripción general: tipología, programa, estado actual si es rehabilitación..."
                />
              </Field>
              <Field label="Normativa urbanística aplicable" span="full">
                <textarea
                  value={form.normativa_aplicable}
                  onChange={set('normativa_aplicable')}
                  rows={2}
                  placeholder="PGOU municipio, plan parcial, ordenanza específica, suelo urbano consolidado..."
                />
              </Field>
              <Field label="Notas y condicionantes" span="full">
                <textarea
                  value={form.notas}
                  onChange={set('notas')}
                  rows={2}
                  placeholder="Condicionantes del cliente, plazos, restricciones conocidas..."
                />
              </Field>
            </Section>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="submit"
                disabled={guardando || !form.nombre}
                style={{
                  background: 'var(--acento)',
                  color: 'var(--negro)',
                  padding: '10px 24px',
                  borderRadius: 'var(--radio)',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  opacity: guardando || !form.nombre ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {guardando ? 'Guardando...' : 'Crear proyecto'}
              </button>
              <button
                type="button"
                onClick={() => setMostrando('lista')}
                style={{ color: 'var(--piedra)', padding: '10px 16px', fontSize: '13px' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '40px 48px' }}>
      <div style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.2em',
              fontWeight: 400,
              color: 'var(--hueso)',
              lineHeight: 1.1,
              marginBottom: 6,
            }}>
              Proyectos activos
            </h1>
            <p style={{ color: 'var(--piedra)', fontSize: '13px' }}>
              {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setMostrando('nuevo')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--acento)',
              color: 'var(--negro)',
              padding: '9px 18px',
              borderRadius: 'var(--radio)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Plus size={14} />
            Nuevo proyecto
          </button>
        </div>

        {proyectos.length === 0 ? (
          <div style={{
            border: '1px dashed var(--plomo)',
            borderRadius: 4,
            padding: '48px 32px',
            textAlign: 'center',
            color: 'var(--piedra)',
          }}>
            <Layers size={32} style={{ marginBottom: 16, opacity: 0.4 }} />
            <p style={{ fontSize: '15px', marginBottom: 8 }}>Sin proyectos todavía</p>
            <p style={{ fontSize: '13px' }}>Crea el primero para acceder a los asistentes</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {proyectos.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/proyecto/${p.id}`)}
                style={{
                  background: 'var(--grafito)',
                  border: '1px solid var(--plomo)',
                  borderRadius: 4,
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.15s',
                  animation: 'fadeIn 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--piedra)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--plomo)'}
              >
                <div>
                  <div style={{ fontSize: '15px', color: 'var(--hueso)', fontWeight: 500, marginBottom: 4 }}>
                    {p.nombre}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: '12px', color: 'var(--piedra)' }}>
                    {p.municipio && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {p.municipio}{p.provincia ? `, ${p.provincia}` : ''}
                      </span>
                    )}
                    {p.uso && <span>{p.uso}</span>}
                    {p.superficie_construida && <span>{p.superficie_construida} m²</span>}
                  </div>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--piedra-oscura)' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ titulo, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--acento)',
        letterSpacing: '0.1em',
        marginBottom: 14,
        paddingBottom: 8,
        borderBottom: '1px solid var(--plomo)',
      }}>
        {titulo.toUpperCase()}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, span }) {
  return (
    <div style={{ gridColumn: span === 'full' ? '1 / -1' : span === 2 ? 'span 2' : 'span 1' }}>
      <label style={{ display: 'block', fontSize: '11px', color: 'var(--piedra)', marginBottom: 5, fontFamily: 'var(--font-mono)' }}>
        {label}
      </label>
      {React.cloneElement(children, {
        style: {
          width: '100%',
          background: 'var(--plomo)',
          border: '1px solid var(--piedra-oscura)',
          borderRadius: 'var(--radio)',
          color: 'var(--hueso)',
          padding: '8px 10px',
          outline: 'none',
          resize: 'vertical',
          ...children.props.style,
        }
      })}
    </div>
  )
}

function Row({ children }) {
  return <>{children}</>
}
