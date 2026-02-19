import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'
import TarifChart from './TarifChart'

function formatNumber(num) {
  return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatInteger(num) {
  return num.toLocaleString('de-DE')
}

function Slider({ value, onChange, min, max, step }) {
  const trackRef = useRef(null)
  const dragging = useRef(false)

  const percent = ((value - min) / (max - min)) * 100

  const updateValue = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw = min + ratio * (max - min)
    const stepped = Math.round(raw / step) * step
    onChange(Math.max(min, Math.min(max, stepped)))
  }, [min, max, step, onChange])

  const handlePointerDown = (e) => {
    dragging.current = true
    updateValue(e.clientX)
    e.target.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (dragging.current) updateValue(e.clientX)
  }

  const handlePointerUp = () => {
    dragging.current = false
  }

  return (
    <div className="slider-container">
      <div className="slider-header">
        <span className="slider-label">Jahresverbrauch</span>
        <span className="slider-value">{formatInteger(value)} kWh</span>
      </div>
      <div
        className="slider-track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="slider-fill" style={{ width: `${percent}%` }} />
        <div className="slider-thumb" style={{ left: `${percent}%` }} />
      </div>
      <div className="slider-marks">
        <span>{formatInteger(min)}</span>
        <span>{formatInteger(max)}</span>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, unit, placeholder }) {
  const handleChange = (e) => {
    const raw = e.target.value
    // Allow empty, digits, comma, and dot
    if (raw === '' || /^[0-9]*[.,]?[0-9]*$/.test(raw)) {
      onChange(raw)
    }
  }

  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div className="input-wrapper">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
        />
        <span className="input-unit">{unit}</span>
      </div>
    </div>
  )
}

function parseInput(val) {
  if (!val || val === '') return 0
  return parseFloat(val.replace(',', '.')) || 0
}

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return hash === 'tarifvergleich' ? 'chart' : 'calculator'
  })

  useEffect(() => {
    window.location.hash = activeTab === 'chart' ? 'tarifvergleich' : 'kalkulator'
  }, [activeTab])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      setActiveTab(hash === 'tarifvergleich' ? 'chart' : 'calculator')
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  const [verbrauch, setVerbrauch] = useState(4000)
  const [grundpreis, setGrundpreis] = useState('12,50')
  const [grundpreisMonatlich, setGrundpreisMonatlich] = useState(true)
  const [kwhPreis, setKwhPreis] = useState('32,5')
  const [isMonthly, setIsMonthly] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [grundpreis2, setGrundpreis2] = useState('')
  const [grundpreis2Monatlich, setGrundpreis2Monatlich] = useState(true)
  const [kwhPreis2, setKwhPreis2] = useState('')

  const grundpreisNum = parseInput(grundpreis)
  const kwhPreisNum = parseInput(kwhPreis)

  const jahresGrundpreis = grundpreisMonatlich ? grundpreisNum * 12 : grundpreisNum
  const jahresVerbrauch = verbrauch * (kwhPreisNum / 100)
  const gesamtJahr = jahresGrundpreis + jahresVerbrauch
  const monatlich = gesamtJahr / 12

  // Compare
  const grundpreis2Num = parseInput(grundpreis2)
  const kwhPreis2Num = parseInput(kwhPreis2)
  const jahresGrundpreis2 = grundpreis2Monatlich ? grundpreis2Num * 12 : grundpreis2Num
  const jahresVerbrauch2 = verbrauch * (kwhPreis2Num / 100)
  const gesamtJahr2 = jahresGrundpreis2 + jahresVerbrauch2
  const diff = gesamtJahr2 - gesamtJahr
  const hasCompareInput = grundpreis2 !== '' || kwhPreis2 !== ''

  return (
    <div className="calculator">
      <header className="header">
        <div className="header-badge">
          <span className="bolt">⚡</span>
          Strompreiskalkulator
        </div>
        <h1>Was kostet dein Strom?</h1>
        <p>Berechne und vergleiche deine Stromtarife auf einen Blick.</p>
      </header>

      <div className="tab-switcher">
        <button
          className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          Kalkulator
        </button>
        <button
          className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
          onClick={() => setActiveTab('chart')}
        >
          Tarifvergleich
        </button>
      </div>

      {activeTab === 'chart' && <TarifChart />}

      {activeTab === 'calculator' && <><div className="card">
        <Slider
          value={verbrauch}
          onChange={setVerbrauch}
          min={1000}
          max={10000}
          step={100}
        />
      </div>

      <div className="card">
        <div className="input-row">
          <div className="input-group">
            <div className="input-label-row">
              <label className="input-label">Grundpreis</label>
              <button
                className="unit-toggle"
                onClick={() => setGrundpreisMonatlich(!grundpreisMonatlich)}
              >
                <span className={`unit-option ${grundpreisMonatlich ? 'active' : ''}`}>Mon.</span>
                <span className={`unit-option ${!grundpreisMonatlich ? 'active' : ''}`}>Jahr</span>
              </button>
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                inputMode="decimal"
                value={grundpreis}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === '' || /^[0-9]*[.,]?[0-9]*$/.test(raw)) setGrundpreis(raw)
                }}
                placeholder="0,00"
              />
              <span className="input-unit">{grundpreisMonatlich ? '€/Mon.' : '€/Jahr'}</span>
            </div>
          </div>
          <InputField
            label="Arbeitspreis"
            value={kwhPreis}
            onChange={setKwhPreis}
            unit="ct/kWh"
            placeholder="0,0"
          />
        </div>
      </div>

      <div className="result-card">
        <div className="result-top">
          <div className="result-header">{isMonthly ? 'Monatliche Kosten' : 'Jährliche Gesamtkosten'}</div>
          <button
            className="period-toggle"
            onClick={() => setIsMonthly(!isMonthly)}
          >
            <span className={`period-option ${!isMonthly ? 'active' : ''}`}>Jahr</span>
            <span className={`period-option ${isMonthly ? 'active' : ''}`}>Monat</span>
          </button>
        </div>
        <div className="result-total">
          <span className="amount">{formatNumber(isMonthly ? monatlich : gesamtJahr)}</span>
          <span className="currency">€</span>
          <span className="period">/ {isMonthly ? 'Monat' : 'Jahr'}</span>
        </div>
        <div className="result-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-label">Grundpreis</span>
            <span className="breakdown-value">{formatNumber(isMonthly ? grundpreisNum : jahresGrundpreis)} €</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Verbrauch</span>
            <span className="breakdown-value">{formatNumber(isMonthly ? jahresVerbrauch / 12 : jahresVerbrauch)} €</span>
          </div>
        </div>
      </div>

      <div className="compare-section">
        <button
          className={`compare-toggle ${showCompare ? 'active' : ''}`}
          onClick={() => setShowCompare(!showCompare)}
        >
          <span className="icon">⇄</span>
          Tarif vergleichen
        </button>

        {showCompare && (
          <div className="compare-card">
            <div className="card">
              <div className="input-row">
                <div className="input-group">
                  <div className="input-label-row">
                    <label className="input-label">Grundpreis</label>
                    <button
                      className="unit-toggle"
                      onClick={() => setGrundpreis2Monatlich(!grundpreis2Monatlich)}
                    >
                      <span className={`unit-option ${grundpreis2Monatlich ? 'active' : ''}`}>Mon.</span>
                      <span className={`unit-option ${!grundpreis2Monatlich ? 'active' : ''}`}>Jahr</span>
                    </button>
                  </div>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={grundpreis2}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '' || /^[0-9]*[.,]?[0-9]*$/.test(raw)) setGrundpreis2(raw)
                      }}
                      placeholder="0,00"
                    />
                    <span className="input-unit">{grundpreis2Monatlich ? '€/Mon.' : '€/Jahr'}</span>
                  </div>
                </div>
                <InputField
                  label="Arbeitspreis"
                  value={kwhPreis2}
                  onChange={setKwhPreis2}
                  unit="ct/kWh"
                  placeholder="0,0"
                />
              </div>
              {hasCompareInput && (
                <div className="compare-result">
                  <div className="breakdown-item" style={{ marginBottom: '0.75rem' }}>
                    <span className="breakdown-label">Tarif 2 — Jahreskosten</span>
                    <span className="breakdown-value">{formatNumber(gesamtJahr2)} €</span>
                  </div>
                  <div className="compare-diff">
                    <span className="diff-label">Differenz</span>
                    <span className={`diff-value ${diff < 0 ? 'savings' : diff > 0 ? 'more' : ''}`}>
                      {diff > 0 ? '+' : ''}{formatNumber(diff)} € / Jahr
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div></>}

      <footer className="footer">
        Alle Preise inkl. MwSt. · Keine Gewähr für die Richtigkeit.
      </footer>
    </div>
  )
}

export default App
