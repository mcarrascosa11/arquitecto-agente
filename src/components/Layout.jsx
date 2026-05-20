import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AGENTS } from '../lib/agents'
import { Plus, ChevronRight, FolderOpen } from 'lucide-react'

export default function Layout() {
  const [proyectos, setProyectos] = useState([])
  const [expandido, setExpandido] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()

  useEffect(() => {
    cargarProyectos()
  }, [])

  useEffect(() => {
    // Auto-expand proyecto activo
    const match = location.pathname.match(/\/proyecto\/([^/]+)/)
    if (match) setExpandido(match[1])
  }, [location])

  async function cargarProyectos() {
    const { data } = await supabase
      .from('proyectos')
      .select('id, nombre, municipio, provincia')
      .eq('activo', true)
      .order('created_at', { ascending: false })
    if (data) setProyectos(data)
  }

  const proyectoActivo = location.pathname.match(/\/proyecto\/([^/]+)/)?.[1]
  const agenteActivo = location.pathname.match(/\/agente\/([^/]+)/)?.[1]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        minWidth: 240,
        background: 'var(--grafito)',
        borderRight: '1px solid var(--plomo)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--plomo)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3em',
            fontWeight: 500,
            color: 'var(--hueso)',
            letterSpacing: '0.02em',
          }}>
            Estudio
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--piedra)',
            fontFamily: 'var(--font-mono)',
            marginTop: 2,
            letterSpacing: '0.05em',
          }}>
            ASISTENTES DE PROYECTO
          </div>
        </div>

        {/* Proyectos */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 16px',
            marginBottom: 4,
          }}>
            <span style={{ fontSize: '11px', color: 'var(--piedra)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
              PROYECTOS
            </span>
            <button
              onClick={() => navigate('/')}
              style={{
                width: 20, height: 20,
                background: 'var(--plomo)',
                color: 'var(--arena)',
                borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
                transition: 'background 0.15s',
              }}
              title="Nuevo proyecto"
            >
              <Plus size={12} />
            </button>
          </div>

          {proyectos.length === 0 && (
            <div style={{ padding: '8px 16px', color: 'var(--piedra)', fontSize: '12px' }}>
              Sin proyectos. Crea uno.
            </div>
          )}

          {proyectos.map(p => (
            <div key={p.id}>
              {/* Proyecto item */}
              <div
                onClick={() => {
                  setExpandido(expandido === p.id ? null : p.id)
                  navigate(`/proyecto/${p.id}`)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 16px',
                  cursor: 'pointer',
                  background: proyectoActivo === p.id ? 'var(--plomo)' : 'transparent',
                  borderLeft: proyectoActivo === p.id ? '2px solid var(--acento)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <ChevronRight
                  size={12}
                  style={{
                    color: 'var(--piedra)',
                    transition: 'transform 0.2s',
                    transform: expandido === p.id ? 'rotate(90deg)' : 'none',
                    flexShrink: 0,
                  }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '13px',
                    color: proyectoActivo === p.id ? 'var(--hueso)' : 'var(--arena)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: proyectoActivo === p.id ? 500 : 400,
                  }}>
                    {p.nombre}
                  </div>
                  {p.municipio && (
                    <div style={{ fontSize: '11px', color: 'var(--piedra)', fontFamily: 'var(--font-mono)' }}>
                      {p.municipio}
                    </div>
                  )}
                </div>
              </div>

              {/* Agentes del proyecto */}
              {expandido === p.id && (
                <div style={{ paddingBottom: 4 }}>
                  {AGENTS.map(agente => (
                    <Link
                      key={agente.id}
                      to={`/proyecto/${p.id}/agente/${agente.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '5px 16px 5px 36px',
                        background: agenteActivo === agente.id && proyectoActivo === p.id
                          ? `${agente.color}22`
                          : 'transparent',
                        borderLeft: agenteActivo === agente.id && proyectoActivo === p.id
                          ? `2px solid ${agente.color}`
                          : '2px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '10px', color: agente.color }}>
                        {agente.icono}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: agenteActivo === agente.id && proyectoActivo === p.id
                          ? 'var(--hueso)'
                          : 'var(--piedra)',
                      }}>
                        {agente.nombre}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--plomo)',
          fontSize: '11px',
          color: 'var(--piedra-oscura)',
          fontFamily: 'var(--font-mono)',
        }}>
          v0.1 · Marcos
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet context={{ recargarProyectos: cargarProyectos }} />
      </main>
    </div>
  )
}
