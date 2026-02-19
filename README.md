# Strompreiskalkulator

Berechne und vergleiche deine Stromtarife auf einen Blick.

**[Live Demo](https://strompreis.vercel.app)**

## Features

### Kalkulator
- Jahresverbrauch per Slider einstellen (1.000 - 10.000 kWh)
- Grundpreis (monatlich oder jährlich) und Arbeitspreis eingeben
- Jährliche und monatliche Gesamtkosten mit Aufschlüsselung
- Optionaler Tarifvergleich mit Differenzanzeige

### Tarifvergleich
- Beliebig viele Tarife in einer Tabelle anlegen (Name, Grundpreis, Arbeitspreis, Bonus)
- Tarife per Checkbox im Chart ein-/ausblenden
- Interaktives Liniendiagramm: effektiver ct/kWh-Preis inkl. Grundpreis und Bonus
- Einen Tarif als Basis markieren, um Ersparnisse im Tooltip zu sehen
- Alle Tarifdaten werden im Browser (localStorage) gespeichert

### Allgemein
- Dark Mode und Light Mode (folgt der Systemeinstellung)
- Tabs per URL navigierbar (`#kalkulator`, `#tarifvergleich`)
- Responsive Design

## Tech Stack

- React 19 + Vite
- Recharts
- CSS Custom Properties (keine UI-Bibliothek)

## Entwicklung

```bash
pnpm install
pnpm run dev
```

## Deployment

```bash
vercel --prod
```
