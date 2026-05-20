import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AGENTS } from '../lib/agents'
import { ArrowLeft, Edit2, MapPin, Ruler, Zap, Trash2, Check, X } from 'lucide-react'

export default function ProyectoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { recargarProyectos } = useOutletContext()
  const [proyecto, setProyecto] = useState(null)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [id])

  async function cargar() {
    const { data } = await supabase.from('proyectos').select('*').eq('id', id).single()
    if (data) { setProyecto(data); setForm(data) }
  }

  async function guardar() {
    setGuardando(true)
    const { error } = await supabase.from('proyectos').update(form).eq('id', id)
    setGuardando(false)
    if (!error) { setProyecto(form); setEditando(false); recargarProyectos() }
  }

  async function archivar() {
    if (!confirm('¿Archivar este proyecto?')) return
    await supabase.from('proyectos').update({ activo: false }).eq('id', id)
    recargarProyectos()
    navigate('/')
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  if (!proyecto) return (
    <div style={{ padding: 40, color: 'var(--piedra)' }}>Cargando...</div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 48px' }}>
      <div style={{ maxWidth: 800 }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            {editando ? (
              <input
                value={form.nombre}
                onChange={set('nombre')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--acento)',
                  color: 'var(--hueso)',
                  fontSize: '1.8em',
                  fontFamily: 'var(--font-display)',
                  outline: 'none',
                  width: '100%',
                  marginBottom: 8,
                }}
              />
            ) : (
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8em',
                fontWeight: 400,
                color: 'var(--hueso)',
                marginBottom: 6,
              }}>
                {proyecto.nombre}
              </h1>
            )}
            <div style={{ display: 'flex', gap: 12, fontSize: '12px', color: 'var(--piedra)' }}>
              {proyecto.municipio && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {proyecto.municipio}{proyecto.provincia ? `, ${proyecto.provincia}` : ''}
                </span>
              )}
              {proyecto.uso && <span>{proyecto.uso}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {editando ? (
              <>
                <IconBtn onClick={guardar} title="Guardar" color="var(--acento)">
                  {guardando ? '...' : <Check size={14} />}
                </IconBtn>
                <IconBtn onClick={() => { setEditando(false); setForm(proyecto) }} title="Cancelar">
                  <X size={14} />
                </IconBtn>
              </>
            ) : (
              <>
                <IconBtn onClick={() => setEditando(true)} title="Editar ficha">
                  <Edit2 size={14} />
                </IconBtn>
                <IconBtn onClick={archivar} title="Archivar proyecto" color="var(--piedra)">
                  <Trash2 size={14} />
                </IconBtn>
              </>
            )}
          </div>
        </div>

        {/* Ficha del proyecto */}
        <div style={{
          background: 'var(--grafito)',
          border: '1px solid var(--plomo)',
          borderRadius: 4,
          padding: '20px 24px',
          marginBottom: 32,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          <Dato label="Cliente" value={proyecto.cliente} editando={editando} onChange={set('cliente')} formVal={form.cliente} />
          <Dato label="Sup. parcela" value={proyecto.superficie_parcela ? `${proyecto.superficie_parcela} m²` : null} editando={editando} onChange={set('superficie_parcela')} formVal={form.superficie_parcela} type="number" />
          <Dato label="Sup. construida" value={proyecto.superficie_construida ? `${proyecto.superficie_construida} m²` : null} editando={editando} onChange={set('superficie_construida')} formVal={form.superficie_construida} type="number" />
          <Dato label="Zona climática" value={proyecto.zona_climatica} editando={editando} onChange={set('zona_climatica')} formVal={form.zona_climatica} />
          <Dato label="Ref. catastral" value={proyecto.referencia_catastral} editando={editando} onChange={set('referencia_catastral')} formVal={form.referencia_catastral} span={2} />
          {(proyecto.descripcion || editando) && (
            <Dato label="Descripción" value={proyecto.descripcion} editando={editando} onChange={set('descripcion')} formVal={form.descripcion} span={3} area />
          )}
          {(proyecto.normativa_aplicable || editando) && (
            <Dato label="Normativa urbanística" value={proyecto.normativa_aplicable} editando={editando} onChange={set('normativa_aplicable')} formVal={form.normativa_aplicable} span={3} area />
          )}
          {(proyecto.notas || editando) && (
            <Dato label="Notas" value={proyecto.notas} editando={editando} onChange={set('notas')} formVal={form.notas} span={3} area />
          )}
        </div>

        {/* Agentes */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--piedra)',
            letterSpacing: '0.1em',
            marginBottom: 16,
          }}>
            ASISTENTES DISPONIBLES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {AGENTS.map(agente => (
              <div
                key={agente.id}
                onClick={() => navigate(`/proyecto/${id}/agente/${agente.id}`)}
                style={{
                  background: 'var(--grafito)',
                  border: `1px solid var(--plomo)`,
                  borderRadius: 4,
                  padding: '16px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  animation: 'fadeIn 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = agente.color
                  e.currentTarget.style.background = `${agente.color}11`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--plomo)'
                  e.currentTarget.style.background = 'var(--grafito)'
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  background: `${agente.color}22`,
                  border: `1px solid ${agente.color}44`,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: agente.color,
                  flexShrink: 0,
                }}>
                  {agente.icono}
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--hueso)', fontWeight: 500, marginBottom: 2 }}>
                    {agente.nombre}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--piedra)' }}>
                    {agente.descripcion}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Dato({ label, value, editando, onChange, formVal, span, area, type }) {
  return (
    <div style={{ gridColumn: span === 3 ? '1 / -1' : span === 2 ? 'span 2' : 'span 1' }}>
      <div style={{ fontSize: '11px', color: 'var(--piedra)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
        {label}
      </div>
      {editando ? (
        area ? (
          <textarea
            value={formVal || ''}
            onChange={onChange}
            rows={2}
            style={{
              width: '100%',
              background: 'var(--plomo)',
              border: '1px solid var(--piedra-oscura)',
              borderRadius: 'var(--radio)',
              color: 'var(--hueso)',
              padding: '6px 8px',
              outline: 'none',
              resize: 'vertical',
              fontSize: '13px',
            }}
          />
        ) : (
          <input
            type={type || 'text'}
            value={formVal || ''}
            onChange={onChange}
            style={{
              width: '100%',
              background: 'var(--plomo)',
              border: '1px solid var(--piedra-oscura)',
              borderRadius: 'var(--radio)',
              color: 'var(--hueso)',
              padding: '6px 8px',
              outline: 'none',
              fontSize: '13px',
            }}
          />
        )
      ) : (
        <div style={{ fontSize: '13px', color: value ? 'var(--hueso)' : 'var(--piedra-oscura)' }}>
          {value || '—'}
        </div>
      )}
    </div>
  )
}

function IconBtn({ onClick, title, children, color }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 32,
        height: 32,
        background: 'var(--plomo)',
        border: '1px solid var(--piedra-oscura)',
        borderRadius: 'var(--radio)',
        color: color || 'var(--arena)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}
