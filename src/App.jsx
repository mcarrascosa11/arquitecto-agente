import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, MapPin, Building2, ExternalLink, SlidersHorizontal, AlertTriangle,
  CheckCircle2, Clock3, History, Radar, Layers3, Euro, Home, ChevronRight,
  Database, RefreshCw, Trees, CarFront, Ruler, BadgeCheck
} from 'lucide-react'
import './index.css'

const fallbackOpportunities = [
  {
    id:'zgz-santa-isabel-rc1', municipality:'Zaragoza', zone:'Santa Isabel — Área F-71-7, parcela RC1',
    status:'ABIERTA', regime:'PROTEGIDA', priority:'C', fit:'NO ENCAJA',
    typology:'Colectiva / VPA', groundFloor:'No aplica', privateOutdoor:'No verificado', parking:'No verificado',
    urbanismVerified:'PARCIAL', surface:null, buildable:null, homes:57, price:null,
    plotPerHome:null, landPerHome:null, deadline:'28/09/2026 13:00', sourceDate:'20/07/2026',
    procedure:'Licitación pública', planning:'VPA', urbanized:'No verificado',
    risks:['Vivienda protegida y colectiva: fuera del producto objetivo tipo MP Mallén.','Parámetros urbanísticos detallados pendientes de extracción completa.'],
    note:'Operación vigente verificada, pero no encaja con vivienda unifamiliar de baja densidad.',
    lat:41.675, lng:-0.835, locationAccuracy:'Ámbito aproximado',
    source:'https://www.zaragoza.es/sede/servicio/contratacion-publica/8072'
  },
  {
    id:'zgz-arcosur-c67', municipality:'Zaragoza', zone:'Arcosur — SUZ 89/3, parcela C-67',
    status:'ABIERTA', regime:'PROTEGIDA', priority:'C', fit:'NO ENCAJA',
    typology:'Colectiva / VPA-B', groundFloor:'No aplica', privateOutdoor:'No verificado', parking:'No verificado',
    urbanismVerified:'PARCIAL', surface:null, buildable:null, homes:96, price:null,
    plotPerHome:null, landPerHome:null, deadline:'28/09/2026 13:00', sourceDate:'20/07/2026',
    procedure:'Licitación pública', planning:'VPA-B', urbanized:'No verificado',
    risks:['Vivienda protegida y colectiva: fuera del producto objetivo tipo MP Mallén.','Escala y tipología incompatibles con el radar principal.'],
    note:'Debe adquirirse de forma independiente de la C-68.',
    lat:41.611, lng:-0.929, locationAccuracy:'Ámbito aproximado',
    source:'https://www.zaragoza.es/sede/servicio/contratacion-publica/8071'
  },
  {
    id:'zgz-arcosur-c68', municipality:'Zaragoza', zone:'Arcosur — SUZ 89/3, parcela C-68',
    status:'ABIERTA', regime:'PROTEGIDA', priority:'C', fit:'NO ENCAJA',
    typology:'Colectiva / VPA-B', groundFloor:'No aplica', privateOutdoor:'No verificado', parking:'No verificado',
    urbanismVerified:'PARCIAL', surface:null, buildable:null, homes:96, price:null,
    plotPerHome:null, landPerHome:null, deadline:'28/09/2026 13:00', sourceDate:'20/07/2026',
    procedure:'Licitación pública', planning:'VPA-B', urbanized:'No verificado',
    risks:['Vivienda protegida y colectiva: fuera del producto objetivo tipo MP Mallén.','Escala y tipología incompatibles con el radar principal.'],
    note:'Debe adquirirse de forma independiente de la C-67.',
    lat:41.607, lng:-0.934, locationAccuracy:'Ámbito aproximado',
    source:'https://www.zaragoza.es/sede/servicio/contratacion-publica/8071'
  }
]

const historyItems = [
  {
    municipality:'Zaragoza',
    zone:'San José — participación municipal del 44,70% en parcela resultante 5, Área U-36-8',
    status:'ADJUDICADA', regime:'LIBRE',
    note:'Adjudicada en 2026. Se mantiene en histórico para comparar futuras operaciones.'
  }
]

const earlySignals = []

const coverage = {
  'Zaragoza y entorno':['Zaragoza','Utebo','La Puebla de Alfindén','Villamayor de Gállego','Pastriz','Alfajarín','Nuez de Ebro','El Burgo de Ebro','Villafranca de Ebro','Osera de Ebro','Fuentes de Ebro','Mediana de Aragón'],
  'Ribera Alta del Ebro':['Alagón','Alcalá de Ebro','Bárboles','Boquiñeni','Cabañas de Ebro','Figueruelas','Gallur','Grisén','La Joyosa','Luceni','Pedrola','Pinseque','Pleitas','Pradilla de Ebro','Remolinos','Sobradiel','Torres de Berrellén'],
  'Ribera Baja del Ebro':['Alborge','Alforque','Cinco Olivas','Escatrón','Gelsa','Monegrillo','Pina de Ebro','Quinto','Sástago','Velilla de Ebro','La Zaida'],
  'Campo de Borja':['Agón','Ainzón','Alberite de San Juan','Albeta','Ambel','Bisimbre','Borja','Bulbuente','Bureta','Fréscano','Fuendejalón','Magallón','Maleján','Mallén','Novillas','Pozuelo de Aragón','Tabuenca','Talamantes'],
  'Tarazona y entorno':['Tarazona','Novallas','Malón','Vierlas','Grisel','Santa Cruz de Moncayo'],
  'Ribera de Navarra':['Tudela','Fontellas','Cabanillas','Fustiñana','Ribaforada','Buñuel','Cortes','Ablitas','Barillas','Cascante','Murchante','Monteagudo','Tulebras','Cintruénigo','Fitero','Corella','Castejón','Arguedas','Valtierra','Cadreita','Milagro','Villafranca'],
  'Borde occidental':['Alfaro','Rincón de Soto','Aldeanueva de Ebro','Cervera del Río Alhama']
}

function formatValue(value, suffix='') {
  if (value === null || value === undefined) return 'No verificado'
  if (typeof value === 'number') return new Intl.NumberFormat('es-ES').format(value) + suffix
  return value
}

function StatusBadge({status}) {
  const cls = status.toLowerCase().replaceAll(' ','-')
  return <span className={'badge status ' + cls}>{status}</span>
}

function PriorityBadge({priority}) {
  return <span className={'priority p' + priority}>{priority}</span>
}

function FitBadge({fit}) {
  const cls = fit === 'ALTO' ? 'fit-high' : fit === 'MEDIO' ? 'fit-mid' : fit === 'NO ENCAJA' ? 'fit-no' : 'fit-unknown'
  return <span className={'fit-badge ' + cls}>{fit || 'NO VERIFICADO'}</span>
}

export default function App() {
  const [opportunities,setOpportunities] = useState(fallbackOpportunities)
  const [lastUpdated,setLastUpdated] = useState('20/09/2026')
  const [query,setQuery] = useState('')
  const [status,setStatus] = useState('TODAS')
  const [regime,setRegime] = useState('LIBRE')
  const [fit,setFit] = useState('OBJETIVO')
  const [selected,setSelected] = useState(fallbackOpportunities[0])
  const [view,setView] = useState('opportunities')
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerLayer = useRef(null)

  useEffect(() => {
    let active = true
    fetch('/data/radar.json',{cache:'no-store'})
      .then(r => { if(!r.ok) throw new Error('Radar feed unavailable'); return r.json() })
      .then(data => {
        if(!active || !Array.isArray(data.opportunities)) return
        setOpportunities(data.opportunities)
        setSelected(current => data.opportunities.find(x => x.id === current?.id) || data.opportunities[0] || null)
        if(data.metadata?.lastUpdated) setLastUpdated(data.metadata.lastUpdated)
      }).catch(() => {})
    return () => { active = false }
  },[])

  const filtered = useMemo(() => opportunities.filter(o => {
    const text = (o.municipality + ' ' + o.zone + ' ' + (o.typology || '')).toLowerCase()
    const matchesQuery = text.includes(query.toLowerCase())
    const matchesStatus = status === 'TODAS' || o.status === status
    const matchesRegime = regime === 'TODAS' || o.regime === regime
    const matchesFit = fit === 'TODAS' || (fit === 'OBJETIVO' ? ['ALTO','MEDIO'].includes(o.fit) : o.fit === fit)
    return matchesQuery && matchesStatus && matchesRegime && matchesFit
  }),[query,status,regime,fit,opportunities])

  useEffect(() => {
    if(!mapRef.current || !window.L || mapInstance.current) return
    const map = window.L.map(mapRef.current,{zoomControl:true,attributionControl:true}).setView([41.73,-1.02],8)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(map)
    mapInstance.current = map
    markerLayer.current = window.L.layerGroup().addTo(map)
  },[])

  useEffect(() => {
    if(!mapInstance.current || !markerLayer.current || !window.L) return
    markerLayer.current.clearLayers()
    const bounds = []
    filtered.forEach(o => {
      if(!o.lat || !o.lng) return
      const color = o.fit === 'ALTO' ? '#16803d' : o.fit === 'MEDIO' ? '#ba7a16' : '#7b817c'
      const icon = window.L.divIcon({
        className:'custom-pin-wrapper',
        html:'<span class="custom-pin" style="background:'+color+'"></span>',
        iconSize:[18,18],iconAnchor:[9,9]
      })
      const marker = window.L.marker([o.lat,o.lng],{icon}).addTo(markerLayer.current)
      marker.bindPopup('<strong>'+o.municipality+'</strong><br>'+o.zone+'<br><small>'+(o.fit || 'NO VERIFICADO')+' · '+o.status+'</small>')
      marker.on('click',()=>setSelected(o))
      bounds.push([o.lat,o.lng])
    })
    if(bounds.length > 1) mapInstance.current.fitBounds(bounds,{padding:[36,36],maxZoom:12})
    else if(bounds.length === 1) mapInstance.current.setView(bounds[0],12)
  },[filtered])

  const targetOpen = opportunities.filter(o => o.status === 'ABIERTA' && ['ALTO','MEDIO'].includes(o.fit)).length
  const pbOpen = opportunities.filter(o => o.status === 'ABIERTA' && o.groundFloor === 'SÍ').length

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><Radar size={20}/></div>
        <div><h1>Radar Promociones Unifamiliares Ebro</h1><p>Zaragoza · Ribera del Ebro · Borja · Tudela · borde riojano</p></div>
      </div>
      <div className="top-actions">
        <div className="last-check"><RefreshCw size={14}/> Última revisión de datos: {lastUpdated}</div>
        <span className="live-dot"><i></i> radar diario activo</span>
      </div>
    </header>

    <main>
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">PRODUCTO DE REFERENCIA · MP MALLÉN</span>
          <h2>Suelo para unifamiliares, no para bloques.</h2>
          <p>Buscamos aisladas, pareadas y adosadas con espacio exterior privado. Sin límite rígido de unidades: importa que la ordenación permita repetir un producto tipo MP Mallén y, preferiblemente, resolverlo en planta baja.</p>
          <div className="reference-strip"><span>≈ 90–140 m²/viv.</span><span>Jardín/patio</span><span>Aparcamiento</span><span>PB preferente</span><span>Faseable</span></div>
        </div>
        <div className="metric-grid">
          <Metric label="Encaje objetivo abierto" value={targetOpen} icon={<BadgeCheck size={18}/>} accent={targetOpen>0}/>
          <Metric label="PB viable abierta" value={pbOpen} icon={<Home size={18}/>}/>
          <Metric label="Señales tempranas" value={earlySignals.length} icon={<Clock3 size={18}/>}/>
          <Metric label="Municipios vigilados" value={Object.values(coverage).flat().length} icon={<MapPin size={18}/>}/>
        </div>
      </section>

      <nav className="tabs">
        <button className={view==='opportunities'?'active':''} onClick={()=>setView('opportunities')}>Oportunidades</button>
        <button className={view==='signals'?'active':''} onClick={()=>setView('signals')}>Señales tempranas</button>
        <button className={view==='history'?'active':''} onClick={()=>setView('history')}>Histórico</button>
        <button className={view==='coverage'?'active':''} onClick={()=>setView('coverage')}>Cobertura</button>
      </nav>

      {view==='opportunities' && <>
        <section className="filters">
          <div className="searchbox"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Municipio, parcela o tipología..."/></div>
          <FilterSelect label="Estado" value={status} onChange={setStatus} options={['TODAS','ABIERTA','DIRECTA','FUTURA','PRELIMINAR']}/>
          <FilterSelect label="Régimen" value={regime} onChange={setRegime} options={['LIBRE','TODAS','PROTEGIDA']}/>
          <FilterSelect label="Encaje MP Mallén" value={fit} onChange={setFit} options={['OBJETIVO','ALTO','MEDIO','TODAS','NO ENCAJA']}/>
        </section>

        {filtered.length===0 && <div className="empty-state target-empty">
          <CheckCircle2 size={22}/>
          <div><strong>No hay operaciones abiertas verificadas que encajen ahora mismo con el producto objetivo.</strong><span>El filtro principal exige vivienda libre unifamiliar con encaje ALTO o MEDIO. Usa “TODAS” en Encaje MP Mallén para ver operaciones descartadas.</span></div>
        </div>}

        <section className="workspace">
          <div className="map-card">
            <div className="section-head"><div><span className="section-kicker">MAPA</span><h3>Oportunidades filtradas</h3></div><span className="map-note">Verde = encaje alto · ámbar = medio</span></div>
            <div ref={mapRef} className="map"></div>
          </div>
          <div className="detail-card">{selected?<OpportunityDetail opportunity={selected}/>:<div className="empty-detail">Selecciona una oportunidad.</div>}</div>
        </section>

        <section className="table-card">
          <div className="section-head"><div><span className="section-kicker">LISTADO</span><h3>{filtered.length} resultados</h3></div><SlidersHorizontal size={18}/></div>
          <div className="table-wrap"><table>
            <thead><tr><th>Encaje</th><th>Municipio / ámbito</th><th>Tipología</th><th>PB</th><th>Viv.</th><th>m² parcela/viv.</th><th>Suelo/viv.</th><th>Plazo</th><th></th></tr></thead>
            <tbody>
              {filtered.map(o=><tr key={o.id} onClick={()=>setSelected(o)} className={selected?.id===o.id?'selected-row':''}>
                <td><FitBadge fit={o.fit}/></td>
                <td><strong>{o.municipality}</strong><span>{o.zone}</span></td>
                <td>{o.typology || 'No verificado'}</td>
                <td>{o.groundFloor || 'No verificado'}</td>
                <td>{o.homes ?? '—'}</td>
                <td>{formatValue(o.plotPerHome,' m²')}</td>
                <td>{o.landPerHome ? formatValue(o.landPerHome,' €') : 'No verificado'}</td>
                <td>{o.deadline || '—'}</td>
                <td><ChevronRight size={16}/></td>
              </tr>)}
              {filtered.length===0 && <tr><td colSpan="9" className="table-empty">Sin resultados con estos filtros.</td></tr>}
            </tbody>
          </table></div>
        </section>
      </>}

      {view==='signals' && <section className="panel-page">
        <div className="section-head"><div><span className="section-kicker">ANTES DE LA LICITACIÓN</span><h3>Señales tempranas</h3></div></div>
        <div className="empty-state"><Clock3 size={22}/><div><strong>No hay señales tempranas activas verificadas cargadas.</strong><span>Se incorporarán acuerdos de Pleno/Junta, valoraciones e inicios de expediente cuando afecten a suelo unifamiliar.</span></div></div>
      </section>}

      {view==='history' && <section className="panel-page">
        <div className="section-head"><div><span className="section-kicker">TRAZABILIDAD</span><h3>Histórico</h3></div></div>
        <div className="history-list">{historyItems.map((h,i)=><div className="history-item" key={i}>
          <History size={18}/><div><strong>{h.municipality} · {h.zone}</strong><p>{h.note}</p></div>
          <span className={'regime '+h.regime.toLowerCase()}>{h.regime}</span><StatusBadge status={h.status}/>
        </div>)}</div>
      </section>}

      {view==='coverage' && <section className="panel-page">
        <div className="section-head"><div><span className="section-kicker">PERÍMETRO OPERATIVO</span><h3>{Object.values(coverage).flat().length} municipios</h3></div></div>
        <div className="coverage-grid">{Object.entries(coverage).map(([group,towns])=><div className="coverage-card" key={group}><h4>{group}</h4><p>{towns.join(' · ')}</p></div>)}</div>
      </section>}

      <section className="method-card">
        <Database size={20}/><div><strong>Cruce urbanístico obligatorio</strong><p>Cada oportunidad debe contrastarse con planeamiento vigente: tipología, parcela mínima, ocupación, edificabilidad, alturas, retranqueos, densidad y viabilidad real de unifamiliar.</p></div><span>PGOU / NNSS verificado</span>
      </section>
    </main>
  </div>
}

function Metric({label,value,icon,accent}) {
  return <div className={'metric '+(accent?'metric-accent':'')}><div className="metric-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>
}

function FilterSelect({label,value,onChange,options}) {
  return <label className="select-wrap"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>
}

function OpportunityDetail({opportunity:o}) {
  const plotPerHome = o.plotPerHome ?? (o.surface && o.homes ? Math.round(o.surface/o.homes) : null)
  const landPerHome = o.landPerHome ?? (o.price && o.homes ? Math.round(o.price/o.homes) : null)

  return <>
    <div className="detail-top">
      <div>
        <div className="detail-badges"><FitBadge fit={o.fit}/><PriorityBadge priority={o.priority}/><StatusBadge status={o.status}/><span className={'regime '+o.regime.toLowerCase()}>{o.regime}</span></div>
        <h3>{o.zone}</h3>
        <p><MapPin size={14}/>{o.municipality} · {o.locationAccuracy}</p>
      </div>
      <a href={o.source} target="_blank" rel="noreferrer" className="source-btn">Fuente oficial <ExternalLink size={14}/></a>
    </div>

    <div className="product-grid">
      <ProductFlag icon={<Home size={16}/>} label="Tipología" value={o.typology || 'No verificado'}/>
      <ProductFlag icon={<Layers3 size={16}/>} label="Planta baja" value={o.groundFloor || 'No verificado'}/>
      <ProductFlag icon={<Trees size={16}/>} label="Jardín / patio" value={o.privateOutdoor || 'No verificado'}/>
      <ProductFlag icon={<CarFront size={16}/>} label="Aparcamiento" value={o.parking || 'No verificado'}/>
    </div>

    <div className="detail-stats">
      <MiniStat icon={<Ruler size={16}/>} label="Parcela / vivienda" value={formatValue(plotPerHome,' m²')}/>
      <MiniStat icon={<Euro size={16}/>} label="Suelo / vivienda" value={landPerHome ? formatValue(landPerHome,' €') : 'No verificado'}/>
      <MiniStat icon={<Home size={16}/>} label="Viviendas" value={formatValue(o.homes)}/>
      <MiniStat icon={<Building2 size={16}/>} label="Edificabilidad" value={formatValue(o.buildable,' m²t')}/>
    </div>

    <dl className="facts">
      <div><dt>Calificación</dt><dd>{o.planning}</dd></div>
      <div><dt>Urbanismo</dt><dd>{o.urbanismVerified || 'NO VERIFICADO'}</dd></div>
      <div><dt>Procedimiento</dt><dd>{o.procedure}</dd></div>
      <div><dt>Urbanización</dt><dd>{o.urbanized}</dd></div>
      <div><dt>Superficie total</dt><dd>{formatValue(o.surface,' m²')}</dd></div>
      <div><dt>Precio suelo</dt><dd>{o.price ? formatValue(o.price,' €') : 'No verificado'}</dd></div>
      <div className="wide"><dt>Plazo</dt><dd>{o.deadline}</dd></div>
    </dl>

    <div className="detail-note">{o.note}</div>
    <div className="risks"><h4><AlertTriangle size={15}/> Riesgos / incógnitas</h4>{(o.risks||[]).map((r,i)=><p key={i}>{r}</p>)}</div>
  </>
}

function ProductFlag({icon,label,value}) {
  return <div className="product-flag">{icon}<span>{label}</span><strong>{value}</strong></div>
}

function MiniStat({icon,label,value}) {
  return <div className="mini-stat">{icon}<span>{label}</span><strong>{value}</strong></div>
}
