# Claude Code — opdracht: Hoofddorp II als echte case + "Doorzetten → development-plan (Excel)"

**Repo:** `rjvanbeilen/acquisitie-radar` (de live radar op https://rjvanbeilen.github.io/acquisitie-radar/)
**Doel:** de acquisitieradar sluit de keten met Fase 2. Voeg **Layers Hoofddorp II** toe als echt data-voorbeeld, en laat "Doorzetten naar massastudie" een **vooringevuld development-plan (Excel)** downloaden dat de development director in de Development Engine kan uploaden.

> **Belangrijk:** de bestaande golden examples (Apeldoorn Ecofactorij, Amersfoort De Zonnecel, Amersfoort Wiekenweg) en alle live-data-functionaliteit (BAG/PDOK/WOZ/Bodemloket, bron-labels, Voorbeelddata-labels) **moeten intact blijven**. Voeg Hoofddorp II toe als vierde echt voorbeeld volgens hetzelfde patroon als de bestaande golden examples.

---

## Taak 1 — Voeg Hoofddorp II toe als echt voorbeeld

Voeg een nieuw kans-item toe (zelfde structuur/mechanisme als de bestaande golden examples, mét echte BAG/PDOK-lookup bij klik). Echte, geverifieerde data:

| Veld | Waarde | Bron |
|---|---|---|
| Naam | **Layers Hoofddorp II** | layers-development.nl |
| Adres | Rijnlanderweg / Kruisweg, **2132 NM Hoofddorp** | funda in business / Vastgoed Nederland |
| Bedrijventerrein | Hoofddorp Noord (nabij A4/A5/N201 + NS Hoofddorp) | layers-development.nl |
| Concept | **Layers** (light industrial / bedrijfsverzamel) | — |
| Programma (as-built) | **15 units, 66–213 m²**, **enkellaags** (casco, vrije hoogte 3,4 m), ~**1.532 m² BVO** | funda/VGN |
| Milieucategorie | **t/m 3.1** | VGN |
| Parkeren | ~1–3 pp/unit (≈ 2,0 / 100 m² BVO) | VGN |
| Prijzen | **€2.000–€2.273/m²** (units €150k–€270k) | VGN |
| Bouwjaar | 2026 (in aanbouw), casco | VGN |
| Extra | apart product "Hoofddorp II XL": 6 units 722–960 m² | layers-development.nl |
| Kavel (perceel) | **indicatief ~3.500 m²** — reconstrueer/liefst verifiëren via de kadastrale kaart | schatting |
| Richtprijs grond | **indicatief ~€600.000** (Today's echte inkoop is niet publiek — label als indicatief) | schatting |

**Coördinaten:** geocodeer het adres via de PDOK Locatieserver (die gebruik je al) — zoek `Rijnlanderweg Hoofddorp 2132` (of `Kruisweg Hoofddorp 2132 NM`) en gebruik de gevonden centroïde. Als benadering vooraf: ~lat **52.303**, lon **4.692** (verifiëren via PDOK).

**Labeling (belangrijk, consistent met de radar-eerlijkheid):** BAG-feiten die je live ophaalt = ● Live; programma/prijzen uit de advertentie = ○ Indicatief (marktbron); kavel + richtprijs grond = ○ Indicatief/reconstructie. Zet in de kaart-/drawer-tekst dat dit een **echte, gerealiseerde Layers-locatie** is (referentie voor de doorloop naar Fase 2).

---

## Taak 2 — "Doorzetten → development-plan (Excel)"

Bij het kwalificeren/doorzetten van **Hoofddorp II** moet de gebruiker een **vooringevuld development-plan (Excel)** krijgen — de brug naar Fase 2.

**Aanpak voor de demo (eenvoudig & robuust — aanbevolen):**
1. Voeg het bestand **`Layers-Development-Model-Hoofddorp-II.xlsx`** (meegeleverd) toe aan de repo-root (naast `index.html`).
2. In de kans-drawer van Hoofddorp II: verander/gebruik de bestaande knop **"Kwalificeer voor massastudie →"** (of voeg een tweede knop toe) zodat die het Excel-bestand downloadt:
   ```html
   <a class="cta" href="Layers-Development-Model-Hoofddorp-II.xlsx" download>
     Doorzetten → development-plan (Excel) ↓
   </a>
   ```
   (of via JS: een `<a download>` programmatriggeren). Toon daarbij de bestaande overdracht-toast ("Doorgezet naar Fase 2").
3. Voor de overige (synthetische) kansen blijft de knop zoals-ie is (of toon "development-plan volgt in Fase 2") — de echte export hangt alleen aan Hoofddorp II.

**Wat er in dat Excel-bestand zit (blok 1 · Locatie is al ingevuld met Hoofddorp II):** perceel 3.500 m², max bebouwing 60%, max hoogte 10 m, parkeernorm 2,0/100, milieucat 3.1, richtprijs grond €600k. De development director speelt daarna verder in de Excel (zet de lat/band) en uploadt 'm in de Development Engine via de "Importeer uit Excel"-knop. **Zo is de keten rond: Radar → Excel → Engine.**

**MVP-optie (later, niet nu nodig):** dynamisch genereren met SheetJS — bundel de template en schrijf de locatie-cellen (blok 1 = cellen **C6** perceel, **C8** bebouwing%, **C9** max hoogte, **C12** parkeernorm, **C13** milieucat, **C14** richtprijs) op het tabblad "Development Model", dan `XLSX.writeFile`. Voor nu is het statische bestand voldoende en risicoloos.

---

## Klaar? Push naar GitHub
Na implementatie: commit + push naar `main`; GitHub Pages publiceert automatisch. Controleer op de live URL dat (a) de bestaande golden examples nog werken, (b) Hoofddorp II als echt voorbeeld verschijnt, (c) "Doorzetten" het Excel-bestand downloadt.
