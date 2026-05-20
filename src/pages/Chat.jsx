import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AGENTS } from '../lib/agents'
import { callClaude } from '../lib/claude'
import { ArrowLeft, Send, Trash2, RotateCcw } from 'lucide-react'

function formatProjectContext(p) {
  if (!p) return ''
  const lines = []
  lines.push(`PROYECTO: ${p.nombre}`)
  if (p.cliente) lines.push(`Cliente: ${p.cliente}`)
  if (p.municipio) lines.push(`Municipio: ${p.municipio}${p.provincia ? `, ${p.provincia}` : ''}`)
  if (p.uso) lines.push(`Uso: ${p.uso}`)
  if (p.superficie_parcela) lines.push(`Superficie parcela: ${p.superficie_parcela} m²`)
  if (p.superficie_construida) lines.push(`Superficie construida: ${p.superficie_construida} m²`)
  if (p.zona_climatica) lines.push(`Zona climática CTE: ${p.zona_climatica}`)
  if (p.referencia_catastral) lines.push(`Referencia catastral: ${p.referencia_catastral}`)
  if (p.descripcion) lines.push(`\nDescripción: ${p.descripcion}`)
  if (p.normativa_aplicable) lines.push(`Normativa urbanística: ${p.normativa_aplicable}`)
  if (p.notas) lines.push(`Notas: ${p.notas}`)
  return lines.join('\n')
}

function renderMarkdown(text) {
  // Simple markdown renderer
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hublip])/gm, '')
}

export default function Chat() {
  const { id, agenteId } = useParams()
  const navigate = useNavigate()
  const [proyecto, setProyecto] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [convId, setConvId] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const agente = AGENTS.find(a => a.id === agenteId)

  useEffect(() => {
    cargar()
  }, [id, agenteId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  async function cargar() {
    const [{ data: p }, { data: conv }] = await Promise.all([
      supabase.from('proyectos').select('*').eq('id', id).single(),
      supabase.from('conversaciones')
        .select('*')
        .eq('proyecto_id', id)
        .eq('agente_id', agenteId)
        .maybeSingle(),
    ])
    if (p) setProyecto(p)
    if (conv) {
      setConvId(conv.id)
      setMessages(conv.messages || [])
    } else {
      setConvId(null)
      setMessages([])
    }
  }

  async function enviar() {
    if (!input.trim() || cargando) return

    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setCargando(true)
    setStreaming('')

    let streamedText = ''

    try {
      const context = formatProjectContext(proyecto)
      const fullText = await callClaude({
        systemPrompt: agente.prompt,
        projectContext: context,
        messages: newMessages,
        onChunk: (chunk, full) => {
          streamedText = full
          setStreaming(full)
        },
      })

      const assistantMsg = { role: 'assistant', content: fullText }
      const finalMessages = [...newMessages, assistantMsg]
      setMessages(finalMessages)
      setStreaming('')

      // Guardar en Supabase
      if (convId) {
        await supabase.from('conversaciones')
          .update({ messages: finalMessages })
          .eq('id', convId)
      } else {
        const { data } = await supabase.from('conversaciones')
          .insert({ proyecto_id: id, agente_id: agenteId, messages: finalMessages })
          .select().single()
        if (data) setConvId(data.id)
      }
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: `Error: ${err.message}` }])
      setStreaming('')
    }

    setCargando(false)
    inputRef.current?.focus()
  }

  async function limpiar() {
    if (!confirm('¿Borrar esta conversación?')) return
    if (convId) {
      await supabase.from('conversaciones').delete().eq('id', convId)
    }
    setMessages([])
    setConvId(null)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  if (!agente) return <div style={{ padding: 40, color: 'var(--piedra)' }}>Agente no encontrado</div>

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--plomo)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: 'var(--grafito)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate(`/proyecto/${id}`)}
            style={{ color: 'var(--piedra)', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{
            width: 32, height: 32,
            background: `${agente.color}22`,
            border: `1px solid ${agente.color}55`,
            borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', color: agente.color,
          }}>
            {agente.icono}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--hueso)' }}>
              {agente.nombre}
            </div>
            {proyecto && (
              <div style={{ fontSize: '11px', color: 'var(--piedra)', fontFamily: 'var(--font-mono)' }}>
                {proyecto.nombre}
              </div>
            )}
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={limpiar}
            title="Limpiar conversación"
            style={{ color: 'var(--piedra-oscura)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px' }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Contexto del proyecto (colapsado) */}
      {proyecto && (
        <div style={{
          padding: '6px 20px',
          background: `${agente.color}0A`,
          borderBottom: `1px solid ${agente.color}22`,
          fontSize: '11px',
          color: agente.color,
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}>
          Contexto: {proyecto.municipio || proyecto.nombre} · {proyecto.uso || '—'} · {proyecto.superficie_construida ? `${proyecto.superficie_construida}m²` : '—'} · Zona {proyecto.zona_climatica || '—'}
        </div>
      )}

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {messages.length === 0 && !streaming && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--piedra)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: 16, opacity: 0.5 }}>{agente.icono}</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3em',
              color: 'var(--arena)',
              marginBottom: 8,
            }}>
              {agente.nombre}
            </div>
            <div style={{ fontSize: '12px', maxWidth: 300, margin: '0 auto', lineHeight: 1.7 }}>
              {agente.descripcion}. Haz tu primera consulta.
            </div>
            {/* Sugerencias */}
            <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {getSugerencias(agenteId).map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  style={{
                    background: 'var(--grafito)',
                    border: `1px solid ${agente.color}33`,
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: '12px',
                    color: 'var(--arena)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = agente.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = `${agente.color}33`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <Mensaje key={i} msg={msg} agente={agente} />
        ))}

        {streaming && (
          <Mensaje
            msg={{ role: 'assistant', content: streaming }}
            agente={agente}
            streaming
          />
        )}

        {cargando && !streaming && (
          <div style={{ display: 'flex', gap: 6, padding: '12px 0', alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, background: `${agente.color}22`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: agente.color }}>
              {agente.icono}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: agente.color,
                  animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 20px 16px',
        borderTop: '1px solid var(--plomo)',
        flexShrink: 0,
        background: 'var(--grafito)',
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
          background: 'var(--plomo)',
          border: `1px solid var(--piedra-oscura)`,
          borderRadius: 4,
          padding: '8px 12px',
          alignItems: 'flex-end',
          transition: 'border-color 0.15s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = agente.color}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--piedra-oscura)'}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Consulta a ${agente.nombre.toLowerCase()}...`}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--hueso)',
              resize: 'none',
              fontSize: '14px',
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: 'auto',
            }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={enviar}
            disabled={!input.trim() || cargando}
            style={{
              width: 30, height: 30,
              background: input.trim() && !cargando ? agente.color : 'var(--piedra-oscura)',
              borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: input.trim() && !cargando ? 'var(--negro)' : 'var(--piedra)',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <Send size={13} />
          </button>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--piedra-oscura)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
          Enter para enviar · Shift+Enter nueva línea
        </div>
      </div>
    </div>
  )
}

function Mensaje({ msg, agente, streaming }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      gap: 10,
      marginBottom: 20,
      flexDirection: isUser ? 'row-reverse' : 'row',
      animation: 'fadeIn 0.2s ease',
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28,
          background: `${agente.color}22`,
          border: `1px solid ${agente.color}44`,
          borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', color: agente.color,
          flexShrink: 0, marginTop: 2,
        }}>
          {agente.icono}
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        background: isUser ? 'var(--plomo)' : `${agente.color}0D`,
        border: `1px solid ${isUser ? 'var(--piedra-oscura)' : `${agente.color}22`}`,
        borderRadius: 4,
        padding: '10px 14px',
        fontSize: '13.5px',
        lineHeight: 1.65,
        color: 'var(--hueso)',
      }}>
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
        ) : (
          <div
            className="mensaje-content"
            dangerouslySetInnerHTML={{ __html: formatMd(msg.content) }}
          />
        )}
        {streaming && (
          <span style={{
            display: 'inline-block',
            width: 6, height: 14,
            background: agente.color,
            marginLeft: 2,
            animation: 'pulse 1s infinite',
            verticalAlign: 'text-bottom',
          }} />
        )}
      </div>
    </div>
  )
}

function formatMd(text) {
  if (!text) return ''
  let html = text
  // Code blocks
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
  // Lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  // Paragraphs
  html = html.split('\n\n').map(block => {
    if (block.match(/^<[hpublockquorepre]/)) return block
    if (block.includes('<li>')) return `<ul>${block}</ul>`
    return `<p>${block.replace(/\n/g, '<br>')}</p>`
  }).join('')
  return html
}

function getSugerencias(agenteId) {
  const map = {
    urbanismo: [
      '¿Cuáles son los parámetros urbanísticos aplicables?',
      '¿Qué documentación pide el ayuntamiento para la licencia?',
      '¿Cuál es la altura máxima permitida?',
    ],
    cte: [
      '¿Qué exige el DB-SI para esta tipología?',
      'Justificación de accesibilidad DB-SUA',
      'Requisitos mínimos de envolvente DB-HE',
    ],
    instalaciones: [
      'Hipótesis de climatización para la vivienda',
      'Caudales mínimos de ventilación según DB-HS3',
      '¿Aerotermia o caldera de condensación?',
    ],
    cype: [
      'Predimensionado de viga de madera para cubierta',
      'Combinaciones de carga que usa CYPE 3D',
      'Error en comprobación de flecha, ¿cómo resolverlo?',
    ],
    presupuesto: [
      'Estructura del presupuesto por capítulos',
      'Redactar partida de cubierta inclinada de teja',
      'Memoria de calidades para cliente final',
    ],
  }
  return map[agenteId] || []
}
