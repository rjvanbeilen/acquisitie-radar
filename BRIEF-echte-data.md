# Claude Code brief — Echte data koppelen aan de Acquisitie-Radar (BAG · WOZ · Bodemloket)

> Plak deze hele tekst in Claude Code (in de map van je `acquisitie-radar` repo). Werk het **stap voor stap** af en test na elke stap lokaal via `python -m http.server 8000` → `http://localhost:8000`. Commit per werkende stap.

## Doel

De radar toont nu 36 synthetische kansen op een echte PDOK-kaart. We voegen een **"Live quickscan"** toe: klik ergens op de kaart (of op een perceel) en de drawer vult zich met **échte data voor die locatie**:

- **Adres + BAG** — dichtstbijzijnde adres, bouwjaar, oppervlakte (m²), gebruiksdoel, pand-status, en de pand-contour op de kaart.
- **WOZ-waarde** — meest recente WOZ-waarde + historie voor dat object.
- **Bodem** — of er op die plek historische bodemverontreiniging, bodemonderzoek of een sanering bekend is (Bodemloket).

Dit is de echte-data-versie van de "kavel-quickscan" uit Fase 1. De synthetische feed blijft bestaan als "radar"; de live quickscan komt er als tweede modus bij (klik op kaart).

**Twee extra eisen (belangrijk — dit is voor een echte pitch aan de eigenaren van Today):**
1. **Golden example** — één *echt, verifieerbaar* bedrijventerrein wordt volledig met échte data ingericht (deel E). Dit is hét voorbeeld dat we in de pitch tonen: "de rest is illustratief, dit is 100% echt, controleer maar."
2. **Eerlijke labeling** — alle overige (synthetische) kansen worden duidelijk gemarkeerd als **"Voorbeelddata"** (deel F). De huidige kansen (naam, score, prijs, signalen) zijn verzonnen; dat mag een demo zijn, maar het moet zichtbaar zijn dat het voorbeelddata is. Vastgoedmensen prikken anders door onterecht-echt-ogende data heen.

---

## Belangrijk vooraf — CORS (dit bepaalt de architectuur)

De site draait op **GitHub Pages = statische hosting, geen eigen server**. Dat betekent dat de browser de API's rechtstreeks aanroept. Niet elke dienst staat dat toe:

| Bron | Aanroep vanuit browser | Actie |
|---|---|---|
| **PDOK Locatieserver** (geocoding) | ✅ CORS oké | direct fetchen |
| **BAG OGC API Features** | ✅ CORS oké | direct fetchen |
| **Bodemloket WMS/WFS** (PDOK) | ✅ CORS oké | direct fetchen |
| **WOZ-waardeloket** | ❌ **geen CORS** | via kleine proxy (zie deel D) |

Bouw daarom eerst A–C (werken meteen), dan D (WOZ met proxy). Bouw incrementeel — één bron werkend + getest voordat je de volgende begint.

---

## A. Locatie bepalen (adres + id's ophalen bij een klik)

Bij een klik op de kaart krijg je lat/lon. Zet dat om naar het dichtstbijzijnde adres én de id's die de andere diensten nodig hebben, via de **PDOK Locatieserver** (v3_1).

**Reverse geocode (coördinaat → dichtstbijzijnd adres):**
```
https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse?lat={lat}&lon={lon}&rows=1&type=adres
```
Uit het antwoord (`response.docs[0]`) haal je het `id` (een locatieserver-id, type `adres`).

**Lookup (volledige velden ophalen o.b.v. dat id):**
```
https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?id={id}&fl=*
```
Hieruit haal je o.a.:
- `weergavenaam` (net adres om te tonen)
- `nummeraanduiding_id` → **nodig voor WOZ**
- `adresseerbaarobject_id` (verblijfsobject) → **nodig voor BAG-detail**
- `pandid` (of `pand_id`) → **nodig voor de BAG pand-contour**
- `centroide_ll` (lon/lat) en `centroide_rd` (RD/EPSG:28992 X Y)

> ⚠️ Veldnamen kunnen iets afwijken. **Verifieer de exacte veldnamen** door één keer een echte respons te bekijken (`curl` of in de browser-console) en pas de code daarop aan. Vertrouw niet blind op bovenstaande namen.

## B. BAG — pand & object (direct, CORS oké)

**BAG OGC API Features**, base:
```
https://api.pdok.nl/lv/bag/ogc/v1
```
Ontdek eerst de exacte collectie-namen (doe dit één keer en gebruik ze daarna hard):
```
https://api.pdok.nl/lv/bag/ogc/v1/collections?f=json
```
Verwachte collecties o.a.: `pand`, `verblijfsobject`, `nummeraanduiding`, `ligplaats`, `standplaats`, `woonplaats`, `openbareruimte`. **Gebruik de echte id's die `/collections` teruggeeft.**

**Pand ophalen (bouwjaar + geometrie/contour):** twee routes, kies wat werkt:
1. Direct op id (als je `pandid` uit stap A hebt):
   ```
   https://api.pdok.nl/lv/bag/ogc/v1/collections/pand/items/{pandid}?f=json
   ```
2. Op locatie via bbox (klein vierkantje rond de klik, in CRS84 = lon/lat):
   ```
   https://api.pdok.nl/lv/bag/ogc/v1/collections/pand/items?bbox={minLon},{minLat},{maxLon},{maxLat}&f=json&limit=10
   ```
Uit de pand-feature: `bouwjaar`, `status`, en `geometry` (Polygon) → teken die als contour op de Leaflet-kaart (`L.geoJSON`).

**Verblijfsobject (oppervlakte + gebruiksdoel):** query de `verblijfsobject`-collectie op dezelfde bbox of op `adresseerbaarobject_id`. Velden: `oppervlakte` (m²), `gebruiksdoel` (bv. "woonfunctie", "kantoorfunctie"), `status`.

> Coördinaten: de OGC API gebruikt standaard **CRS84 (lon, lat)** — let op de volgorde in `bbox` (lon eerst!). Wil je in RD werken, gebruik dan `crs`/`bbox-crs` params met `http://www.opengis.net/def/crs/EPSG/0/28992`.

## C. Bodemloket — bodemstatus (direct, CORS oké)

**PDOK Bodemloket**, WMS base:
```
https://service.pdok.nl/rivm/bodemloket/wms/v1_0
```
Ontdek de laagnamen één keer via GetCapabilities:
```
https://service.pdok.nl/rivm/bodemloket/wms/v1_0?request=GetCapabilities&service=WMS
```
Er zijn lagen voor o.a. *historisch bodembestand / verontreinigende (bedrijfs)activiteiten*, *uitgevoerde bodemonderzoeken*, en *saneringen/nazorg*. **Gebruik de exacte `<Name>`-waarden uit GetCapabilities.**

**Punt-query bij een klik — GetFeatureInfo:** vraag info op precies op de klik-pixel. Makkelijkst: bouw een kleine bbox rond de klik en vraag JSON:
```
https://service.pdok.nl/rivm/bodemloket/wms/v1_0?service=WMS&version=1.3.0&request=GetFeatureInfo
  &layers={laagnamen}&query_layers={laagnamen}
  &crs=EPSG:4326&bbox={minLat},{minLon},{maxLat},{maxLon}
  &width=101&height=101&i=50&j=50
  &info_format=application/json
  &feature_count=10
```
> Let op WMS 1.3.0: bij EPSG:4326 is de as-volgorde **lat,lon** in de bbox. Alternatief dat vaak makkelijker is: gebruik de **WFS** (`.../rivm/bodemloket/wfs/v1_0`) met een bbox-filter en `outputFormat=application/json`. Kies wat betrouwbaar werkt en test het.

Toon in de drawer een simpele conclusie: *"Bodem: onderzoek/verontreiniging bekend op deze locatie"* (met aantal treffers + type) óf *"Bodem: geen registraties gevonden op deze locatie"*. Dat is precies de quickscan-signaalwaarde die Fase 1 nodig heeft — niet het volledige dossier, wél de vlag.

## D. WOZ — via een kleine proxy (want geen CORS)

**Endpoint (officieel WOZ-waardeloket):**
```
https://www.wozwaardeloket.nl/wozwaardeloket-api/v1/wozwaarde/nummeraanduiding/{nummeraanduiding_id}
```
`{nummeraanduiding_id}` komt uit stap A (lookup). De respons bevat de WOZ-waarde(n) per peildatum (historie).

Dit werkt **niet** rechtstreeks vanuit de browser (geen CORS-header). Zet er een flinterdunne proxy voor. Twee opties:

**Optie 1 — Cloudflare Worker (aanbevolen, gratis, ~5 min, geen creditcard):**
Deploy `worker.js` (los meegeleverd bestand `woz-proxy-worker.js`). Je krijgt dan een URL als `https://woz-proxy.<jouw-subdomein>.workers.dev`. In de frontend roep je aan:
```
https://woz-proxy.<jouw-subdomein>.workers.dev/{nummeraanduiding_id}
```
De worker haalt het WOZ-endpoint op server-side en zet de CORS-header erop.

**Optie 2 — later naar Vercel/Netlify verhuizen** en een `/api/woz` serverless function toevoegen. Alleen doen als je toch al wilt verhuizen; voor nu is de Worker het minste werk en blijft je site op GitHub Pages staan.

> Bouw A–C eerst helemaal af en getest. Voeg WOZ pas toe als de rest staat, zodat één hobbel (de proxy) niet de rest blokkeert. Als de WOZ-call faalt, toon dan netjes "WOZ: niet beschikbaar" en laat de rest gewoon werken (graceful degradation).

---

## E. Golden examples — twee echte terreinen, volledig met echte data ⭐

Dit is het belangrijkste onderdeel voor de pitch. We maken **twee opportunities die geen synthetische data hebben, maar een echt adres met echte, live opgehaalde data**. In de pitch is dit het bewijs: "de rest is illustratief, déze twee voorbeelden zijn 100% echt — check het maar in het Kadaster/WOZ-loket."

**De twee golden examples (door Robert gekozen):**
- **Apeldoorn — Bedrijventerrein De Ecofactorij.** Duurzaam bedrijventerrein langs de A1 (de straat heet letterlijk "Ecofactorij"). Zoek een concreet bestaand adres op dit terrein via de Locatieserver (bv. `q=Ecofactorij Apeldoorn`) en gebruik dat als anker.
- **Amersfoort — Bedrijvenpark De Wieken-Vinkenhoef.** Modern light-industrial/logistiek park bij de A1/A28 (straten o.a. "De Wieken", "Vinkenhoefstraat", "Nijverheidsweg-Noord"). Zoek een concreet bestaand adres op dit terrein via de Locatieserver en gebruik dat als anker.

**Werkwijze (voor elk van de twee terreinen):**
1. **Resolve een concreet, bestaand adres** op het terrein via de PDOK Locatieserver, zodat BAG/WOZ echte panddata teruggeven. Kies bij voorkeur een adres met een bestaand bedrijfspand (geen leeg perceel), zodat bouwjaar/oppervlakte/WOZ gevuld zijn.
   ```
   https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q={zoekterm}&rows=5
   ```
2. **Maak van dit terrein een aparte opportunity** bovenaan de feed, met een duidelijk onderscheidend label: **badge "✓ Echte data"** (groen) in plaats van "NIEUW/Voorbeelddata". Zet naam, plaats en postcode op de échte waarden.
3. **Vul de hele drawer met live data** voor dit adres — dezelfde fetches als de klik-quickscan (A→B→C→D), maar automatisch geladen zodra deze kaart geopend wordt:
   - Adres, bouwjaar, oppervlakte, gebruiksdoel, pand-status (BAG) — echt.
   - WOZ-waarde + peildatum (via proxy) — echt.
   - Bodemstatus-vlag (Bodemloket) — echt.
   - Pand-contour op de kaart (BAG-geometrie) — echt.
4. **Scheid "feiten" van "inschatting".** De opgehaalde data (BAG/WOZ/bodem) is echt en labelt als *"Bron: BAG/WOZ/Bodemloket — live"*. De *score, de "waarom nu"-signalen en de richtprijs-inschatting* zijn een model/aanname — label die expliciet als **"indicatief · modelinschatting"** zodat glashelder is wat feit is en wat interpretatie. (De WOZ-waarde is dus feit; jouw off-market richtprijs blijft een inschatting.)
5. **Cache het even** (bv. in een JS-object) zodat de demo niet stukloopt als een dienst even traag is tijdens de pitch; ververs on-demand met een knopje "🔄 Live verversen".

> Doel: als Rick of Max op dit ene terrein klikt, zien ze data die ze zelf kunnen natrekken. Dat is oneindig veel overtuigender dan 347 mooie maar lege kaartjes.

## F. Labeling — markeer al het overige als voorbeelddata

Alle *andere* kansen (de ~347 synthetische) moeten eerlijk als voorbeeld herkenbaar zijn:

1. **Badge op elke synthetische kaart:** vervang/combineer de bestaande "NIEUW"-badge met een subtiel maar duidelijk label **"Voorbeelddata"** (neutrale grijze pill). De golden example krijgt juist "✓ Echte data".
2. **Globale banner/notitie:** ergens rustig in beeld (bv. onder de "347 kansen in Nederland"-titel of in de kaart-footer): *"Kansenlijst is illustratief (voorbeelddata). Kaart is echt (PDOK). Het gemarkeerde voorbeeld en elke locatie waarop je klikt tonen echte data."*
3. **In de drawer van een synthetische kaart:** een klein regeltje bovenin *"⚠ Voorbeelddata — klik op de kaart of open het golden example voor echte data"*.
4. Houd het **professioneel en subtiel**, geen knalrode "FAKE"-stickers — het moet eerlijk zijn zonder de demo goedkoop te maken. Een nette grijze "Voorbeelddata"-pill is genoeg.

> Dit maakt de demo juist sterker: je laat zien dat je het verschil tussen echt en gesimuleerd serieus neemt — precies de betrouwbaarheid die je als CDO wilt uitstralen.

---

## Integratie in `index.html` (UX)

1. **Modus-schakelaar / trigger.** Voeg een klik-handler op de Leaflet-kaart toe (`LMAP.on('click', ...)`). Bij een klik: zet een tijdelijke marker, open de drawer in "Live quickscan"-stand, en toon per bron een **skeleton/loading**-status terwijl de fetches lopen.
2. **Parallelle fetches.** Draai A (locatie) eerst; gebruik de id's daaruit voor B/C/D **parallel** (`Promise.allSettled`) zodat één trage/falende bron de rest niet ophoudt.
3. **Drawer-secties.** Hergebruik de bestaande drawer-opmaak. Vul deze secties met echte waarden:
   - *Locatie & adres* (uit A)
   - *Gebouw (BAG)* — bouwjaar, oppervlakte m², gebruiksdoel, status
   - *Prijsindicatie* — vervang/vul de bestaande sectie met de **echte WOZ-waarde** (label duidelijk: "WOZ-waarde", peildatum erbij); laat de bestaande synthetische richtprijs-logica staan voor de 36 demo-kansen.
   - *Bodem-quickscan* — de vlag uit C
4. **Kaart-feedback.** Teken de BAG-pandcontour (uit B) als polygon op de kaart bij de klik, zodat je ziet dat het "raak" is.
5. **Foutafhandeling.** Elke bron faalt onafhankelijk en netjes ("niet beschikbaar"). Nooit de hele drawer laten crashen op één fout. Log fouten naar console voor debugging.
6. **Bronvermelding.** Breid de bestaande attributie uit: "Data: PDOK/Kadaster (BAG), RIVM/Bodemloket, WOZ-waardeloket".

## Aanpak & testen (belangrijk)

- **Ontdek eerst de echte veld-/laag-/collectie-namen** door één echte respons van elke dienst te bekijken (console of `curl`), en codeer daar tegen. De namen in dit brief zijn een startpunt, geen garantie.
- Bouw en test **per bron**: A → commit → B → commit → C → commit → D (proxy) → commit.
- Test steeds op een **echt adres in Deventer/Amsterdam** waarvan je het antwoord kunt controleren.
- Houd alle netwerk-URLs in één klein configblok bovenaan het script, zodat ze makkelijk aan te passen zijn.

## Definition of done
- Klik op de kaart in de gehoste site → drawer toont echt adres, echt bouwjaar + oppervlakte (BAG), echte WOZ-waarde, en een bodem-vlag — met de pandcontour op de kaart.
- **Golden examples**: twee echte terreinen (De Ecofactorij Apeldoorn + De Wieken-Vinkenhoef Amersfoort) bovenaan de feed met badge "✓ Echte data", die automatisch echte BAG/WOZ/bodem-data laden; feiten gelabeld als bron-live, score/richtprijs gelabeld als modelinschatting.
- **Labeling**: alle overige kansen dragen een nette "Voorbeelddata"-pill; er staat een globale notitie dat de kansenlijst illustratief is en de kaart + golden example echt zijn.
- Elke bron degradeert netjes bij een fout.
- Alles gecommit en live op `https://rjvanbeilen.github.io/acquisitie-radar/`.
