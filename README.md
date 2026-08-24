# Acquisitie-Radar — MVP (echte kaart)

De radar met een **echte kaart van Nederland**: PDOK BRT-Achtergrondkaart (de officiële basiskaart) + kadastrale percelen als laag, via Leaflet. Eén bestand, geen build-stap.

## Wat erin zit
- **Echte basiskaart** — PDOK BRT-Achtergrondkaart (WMTS, open, geen key/kosten).
- **Kadastrale percelen** — PDOK Kadastrale kaart (WMS) als toggle → knop **Percelen** (zoom in om de perceelgrenzen te zien).
- **Score-markers** rood→groen op echte coördinaten, klikbaar → intelligence-drawer.
- **Heatmap**, **zoom**, prijs/filters/quickscan — zoals de demo.
- Opportunity-data is voorlopig nog **synthetisch** (36 kansen); de kaart en percelen zijn echt.

## Lokaal bekijken
Open `index.html` niet direct via `file://` (sommige browsers blokkeren dan de kaartdienst). Serveer 'm even:

```bash
npx serve .        # of: python3 -m http.server 8000
```
Open dan http://localhost:3000 (of :8000).

## Publiceren (kies er één)
- **Netlify Drop** — sleep `index.html` naar https://app.netlify.com/drop → meteen een publieke link.
- **Vercel** — `npx vercel` in deze map.
- **GitHub Pages** — zet `index.html` in een repo, Settings → Pages → deploy from branch.

Zodra het gehost is, laadt de PDOK-kaart gewoon (de sandbox-beperking van de demo geldt daar niet).

## Volgende stappen (in Claude Code)
1. **Echte data koppelen** — BAG (bebouwing/oppervlak), WOZ-waardeloket (richtprijs), Bodemloket & AERIUS (quickscan-checks). Deze zijn open; sommige hebben een kleine proxy nodig i.v.m. CORS.
2. **Perceel-selectie** — klik op de kaart → haal het perceel op via de PDOK Kadastrale-kaart WFS en toon kadaster-info live.
3. **Signalen** (eigendomsdynamiek, financiële druk) — via BRK/KvK zodra Today toegang regelt (Fase 3).
4. **Scoring-/prijs-/quickscan-engine** losmaken in modules zodat echte bronnen de synthetische laag vervangen.

Kaart & data: © PDOK / Kadaster.
