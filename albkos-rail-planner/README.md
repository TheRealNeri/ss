# AlbKos Rail Planner

A real Next.js + TypeScript + MapLibre trip-planning app for a conceptual integrated Albania–Kosovo rail system.

## What this build includes

- App Router structure with clean modular components
- Tailwind CSS v4 setup
- MapLibre GL JS map with GeoJSON sources/layers
- Search for stations and places
- Place aliases and nearest-station lookup
- Graph-based routing with fastest and fewer-changes modes
- Route instructions and highlighted path
- Line filters, focus mode, fit-to-route, fit-to-network
- Bilingual Albanian / English UI
- Station detail drawer and simulated departures
- 2D / 3D presentation toggle

## Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Optional route QA

```bash
npm run qa:routes
```

This checks these seed journeys:

- Sheshi Skënderbej → Rinas Airport
- Durrës Qendër → Kamëz
- Vorë → Porti i Durrësit
- Blloku → Rinas Airport
- Prishtina → Prishtina Airport
- Sarandë → Ksamil

## Notes

- The rail system is conceptual.
- Coordinates are corridor-oriented and intended for scalable product architecture, not civil-engineering precision.
- The routing is graph-based and does not hardcode journey answers.
- The map uses legal standalone web mapping technology with MapLibre and GeoJSON sources/layers, which aligns with the MapLibre source/layer model and Next.js App Router structure. citeturn865959search0turn865959search2turn865959search5
- Tailwind is configured via the official PostCSS-based Next.js approach. citeturn865959search1turn865959search16
