# WiseOS Design Pool — Handoff

Hej! Det här repot innehåller **design-poolen** för WiseOS — en isolerad sandlåda där vi itererar på frontend-designen utan att röra produktionsversionen. Allt körs mot mockdata, ingen inloggning eller backend krävs.

## Vad är det här?

WiseOS är ett AI-verktyg som rättar handskrivna elevlösningar (matte/fysik/kemi) — läraren laddar upp prov, AI:n föreslår bedömning, läraren granskar och godkänner. Design-målet: *"När en lärare öppnar WiseOS ska känslan vara 'Jag förstår direkt vad jag ska göra.'"* — minimalistiskt, lugnt, professionellt, extremt modernt.

## Struktur

```
design-pool/
  original-live-kopia/     ← EXAKT kopia av produktions-frontenden. RÖR ALDRIG — referens.
  _template/               ← mall för nya pools
  design-fix-01-kursprov/  ← varje mapp = en fristående Next.js-app
  design-fix-02-loginhero/
  ...
  design-fix-30-loginhero/
  design-fix-05-helhetsredesign/  ← PÅGÅENDE: stor omdesign, se nedan
```

Varje pool är en komplett kopia av frontenden med:
- Lokal mock-API (`lib/api.ts`) och fejkad auth — funkar utan backend
- Inga riktiga nätverksanrop, inga secrets

## Köra en pool

```bash
cd design-pool/design-fix-30-loginhero   # valfri pool
pnpm install                             # eller: npm install
pnpm dev -p 3130                         # eller: npm run dev -- -p 3130
# → http://localhost:3130/login
```

Konvention: pool N körs på port `3100+N` (pool 20 → 3120, pool 30 → 3130). Kräver Node 18+ och pnpm.

## Var vi är just nu

### Slutfört
- **Pool 1–22**: iterationer av login-sidans hero — olika bakgrundsbilder (laptop/prov/pappersarkitektur), typografisk tuning, transparent header som blir glas vid scroll. Vinnarbild ännu inte vald.
- **Pool 20–22, 30**: hero-tekniken "text i glappet" — bilden renderas i naturligt format (inte `object-cover`) och texten absolutpositioneras i bildkoordinater så den sitter exakt i bildens tomma yta på alla skärmbredder. Se `app/login/page.tsx` i t.ex. pool 30.
- **Pool 30**: dark-temat ommappat till varm ramp — `#181717` bas, `#f2efea` ink (se `app/globals.css` → `html.dark`).

### Pågående — `design-fix-05-helhetsredesign` (påbörjad, inte klar)
Tre designriktningar för HELA UI:t som ska gå att växla mellan:

| Riktning | Känsla | Palette | Nav |
|---|---|---|---|
| **A — Arkivet** (`data-dir="arkiv"`) | Editorial lugn | `#faf9f7` + skogsgrön `#2f5d43` | Sidebar med textetiketter |
| **B — Bänken** (`data-dir="bank"`) | Tätt arbetsflöde | `#f4f4f3` + rödpenna `#b3261e` | Top bar-tabs |
| **C — Söndagskväll** (`data-dir="kvall"`) | Mörk-först, lugn | `#181717` + amber `#d6b96a` | Minimal top bar, centrerad kolumn |

**Färdigt:** `lib/direction.tsx` (provider, `?dir=`-param, localStorage), `components/DirectionSwitcher.tsx` (flytande A/B/C-väljare).

**Kvar att bygga:**
1. Tre token-packs i `app/globals.css` (`html[data-dir="..."]` — lägg sist i filen så de vinner)
2. `DirectionProvider` i `app/layout.tsx` + fonter (Fraunces, IBM Plex Mono)
3. `/d/[dir]`-route som sätter riktning + redirectar
4. `components/shell/Shell.tsx` — tre nav-varianter
5. Dir-aware `app/page.tsx` (dashboard), `app/review/page.tsx` + `ReviewWorkbench.tsx`, `app/login/page.tsx`

## Regler

- **`original-live-kopia/` rörs aldrig** — det är referensen
- Varje pool är fristående — ändra bara i den pool du jobbar i
- Inget appliceras mot produktion förrän Simon säger det uttryckligen
- Mockdata only — inga riktiga API-anrop, inga secrets, ingen riktig auth

## Att hjälpa till med

- Fortsätta helhetsredesignen (se listan ovan)
- Iterera login-heros i nya pools (kopiera en pool, byt `public/hero/*.jpg`, tweaka)
- Mobilvyn, kontrast, detaljpolish
- Funka utan att veta backend — allt är mockat
