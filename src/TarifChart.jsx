import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function useThemeColors() {
  const subscribe = (cb) => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }
  const getSnapshot = () => {
    const s = getComputedStyle(document.documentElement)
    return JSON.stringify({
      chartGrid: s.getPropertyValue('--chart-grid').trim(),
      chartTick: s.getPropertyValue('--chart-tick').trim(),
      chartStroke: s.getPropertyValue('--chart-stroke').trim(),
    })
  }
  return JSON.parse(useSyncExternalStore(subscribe, getSnapshot))
}

const COLORS = ['#f5a623', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#38bdf8', '#e879f9']

const STORAGE_KEY = 'strompreis-tarife'

let nextId = 1

function createTarif(name = '', grundpreis = '', arbeitspreis = '', bonus = '') {
  return { id: nextId++, name, grundpreis, arbeitspreis, bonus, active: true }
}

function loadTarife() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data) || data.length === 0) return null
    // restore nextId to be above the highest saved id
    nextId = Math.max(...data.map(t => t.id)) + 1
    return data
  } catch {
    return null
  }
}

function parseNum(val) {
  if (!val || val === '') return 0
  return parseFloat(val.replace(',', '.')) || 0
}

function formatDe(num) {
  return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function CustomTooltip({ active, payload, label, baselineKey }) {
  if (!active || !payload?.length) return null
  const kwh = label
  const baselineEntry = baselineKey ? payload.find(e => e.dataKey === baselineKey) : null
  const baselineJahr = baselineEntry ? baselineEntry.value * kwh / 100 : null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{kwh.toLocaleString('de-DE')} kWh</div>
      {payload.map((entry) => {
        const jahreskosten = entry.value * kwh / 100
        const isBaseline = entry.dataKey === baselineKey
        const diff = baselineJahr !== null && !isBaseline ? jahreskosten - baselineJahr : null
        return (
          <div key={entry.dataKey} className={`chart-tooltip-item ${isBaseline ? 'is-baseline' : ''}`}>
            <span className="chart-tooltip-dot" style={{ background: entry.color }} />
            <span className="chart-tooltip-name">
              {entry.name}
              {isBaseline && <span className="chart-tooltip-baseline-tag">Basis</span>}
            </span>
            <span className="chart-tooltip-values">
              <span>{formatDe(entry.value)} ct/kWh</span>
              <span className="chart-tooltip-yearly">{formatDe(jahreskosten)} €/Jahr</span>
              {diff !== null && (
                <span className={`chart-tooltip-diff ${diff < 0 ? 'savings' : diff > 0 ? 'more' : ''}`}>
                  {diff > 0 ? '+' : ''}{formatDe(diff)} €
                </span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function TarifChart() {
  const [tarife, setTarife] = useState(() => {
    return loadTarife() || [
      createTarif('Naturwerke (aktuell)', '12,26', '26,06', ''),
      createTarif('Grünwelt Strom Classic', '7,86', '26,49', ''),
      createTarif('Octopus Optimus+ Secure 18', '12,35', '26,50', ''),
    ]
  })
  const [baselineId, setBaselineId] = useState(() => {
    try { return JSON.parse(localStorage.getItem('strompreis-baseline')) } catch { return null }
  })
  const isInitial = useRef(true)

  useEffect(() => {
    if (isInitial.current) { isInitial.current = false; return }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tarife))
  }, [tarife])

  useEffect(() => {
    localStorage.setItem('strompreis-baseline', JSON.stringify(baselineId))
  }, [baselineId])

  const updateTarif = (id, field, value) => {
    setTarife(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const toggleTarif = (id) => {
    setTarife(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t))
  }

  const removeTarif = (id) => {
    setTarife(prev => prev.filter(t => t.id !== id))
    if (baselineId === id) setBaselineId(null)
  }

  const addTarif = () => {
    setTarife(prev => [...prev, createTarif(`Tarif ${prev.length + 1}`)])
  }

  const activeTarife = tarife.filter(t => t.active && (t.grundpreis !== '' || t.arbeitspreis !== ''))

  // Generate chart data: x = kWh, y = effective ct/kWh per tariff
  // effective ct/kWh = ((grundpreis_annual - bonus) * 100 / kwh) + arbeitspreis
  const chartData = []
  for (let kwh = 2000; kwh <= 8000; kwh += 100) {
    const point = { kwh }
    activeTarife.forEach(t => {
      const gp = parseNum(t.grundpreis) * 12 // monthly -> annual in €
      const bonus = parseNum(t.bonus) // one-time € credit
      const ap = parseNum(t.arbeitspreis) // ct/kWh
      point[`tarif_${t.id}`] = ((gp - bonus) * 100 / kwh) + ap
    })
    chartData.push(point)
  }

  const theme = useThemeColors()

  const handleInput = (e, id, field) => {
    const raw = e.target.value
    if (field === 'name') {
      updateTarif(id, field, raw)
    } else if (raw === '' || /^[0-9]*[.,]?[0-9]*$/.test(raw)) {
      updateTarif(id, field, raw)
    }
  }

  return (
    <div className="tarif-chart-view">
      <div className="card tarif-table-card">
        <div className="tarif-table-header">
          <span className="tarif-table-title">Tarife</span>
          <button className="tarif-add-btn" onClick={addTarif}>+ Hinzufügen</button>
        </div>
        <div className="tarif-table">
          <div className="tarif-table-head">
            <span className="tarif-col-check"></span>
            <span className="tarif-col-name">Name</span>
            <span className="tarif-col-gp">Grundpreis</span>
            <span className="tarif-col-ap">Arbeitspreis</span>
            <span className="tarif-col-bonus">Bonus</span>
            <span className="tarif-col-del"></span>
          </div>
          {tarife.map((t, i) => (
            <div key={t.id} className={`tarif-row ${!t.active ? 'inactive' : ''}`}>
              <span className="tarif-col-check">
                <button
                  className={`tarif-checkbox ${t.active ? 'checked' : ''}`}
                  onClick={() => toggleTarif(t.id)}
                  style={t.active ? { background: COLORS[i % COLORS.length], borderColor: COLORS[i % COLORS.length] } : {}}
                >
                  {t.active && <span className="check-mark">✓</span>}
                </button>
              </span>
              <span className="tarif-col-name">
                <div className="tarif-name-row">
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => handleInput(e, t.id, 'name')}
                    placeholder="Name"
                    className="tarif-input tarif-input-name"
                  />
                  <button
                    className={`tarif-baseline-btn ${baselineId === t.id ? 'active' : ''}`}
                    onClick={() => setBaselineId(baselineId === t.id ? null : t.id)}
                    title="Als Basis setzen"
                  >
                    Basis
                  </button>
                </div>
              </span>
              <span className="tarif-col-gp">
                <div className="tarif-input-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={t.grundpreis}
                    onChange={(e) => handleInput(e, t.id, 'grundpreis')}
                    placeholder="0,00"
                    className="tarif-input"
                  />
                  <span className="tarif-input-unit">€/Mon.</span>
                </div>
              </span>
              <span className="tarif-col-ap">
                <div className="tarif-input-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={t.arbeitspreis}
                    onChange={(e) => handleInput(e, t.id, 'arbeitspreis')}
                    placeholder="0,0"
                    className="tarif-input"
                  />
                  <span className="tarif-input-unit">ct/kWh</span>
                </div>
              </span>
              <span className="tarif-col-bonus">
                <div className="tarif-input-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={t.bonus}
                    onChange={(e) => handleInput(e, t.id, 'bonus')}
                    placeholder="0"
                    className="tarif-input"
                  />
                  <span className="tarif-input-unit">€</span>
                </div>
              </span>
              <span className="tarif-col-del">
                <button className="tarif-del-btn" onClick={() => removeTarif(t.id)}>×</button>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card chart-card">
        <div className="chart-header">
          <span className="chart-title">Effektiver Strompreis</span>
          <span className="chart-subtitle">inkl. Grundpreis und Bonus auf Verbrauch umgelegt</span>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
              <XAxis
                dataKey="kwh"
                tick={{ fill: theme.chartTick, fontFamily: 'DM Mono, monospace', fontSize: 11 }}
                tickFormatter={(v) => v.toLocaleString('de-DE')}
                stroke={theme.chartStroke}
                label={{ value: 'kWh / Jahr', position: 'insideBottomRight', offset: -4, fill: theme.chartTick, fontFamily: 'DM Mono, monospace', fontSize: 10 }}
              />
              <YAxis
                tick={{ fill: theme.chartTick, fontFamily: 'DM Mono, monospace', fontSize: 11 }}
                tickFormatter={(v) => formatDe(v)}
                stroke={theme.chartStroke}
                label={{ value: 'ct/kWh', angle: -90, position: 'insideLeft', offset: 10, fill: theme.chartTick, fontFamily: 'DM Mono, monospace', fontSize: 10 }}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip baselineKey={baselineId ? `tarif_${baselineId}` : null} />} />
              {activeTarife.map((t) => {
                const colorIdx = tarife.findIndex(tt => tt.id === t.id)
                return (
                  <Line
                    key={t.id}
                    type="monotone"
                    dataKey={`tarif_${t.id}`}
                    name={t.name || `Tarif ${colorIdx + 1}`}
                    stroke={COLORS[colorIdx % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default TarifChart
