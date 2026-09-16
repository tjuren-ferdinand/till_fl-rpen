# WiseOS Design-pool

Isolerad miljö för att designa och testa frontend-ändringar — utan att röra
den skarpa versionen, utan inloggning och utan kontakt med riktig
backend/databas/credentials.

## Struktur

```
design-pool/
  original-live-kopia/       Exakt kopia av apps/web från main (det som är
                             driftsatt). ÄNDRAS ALDRIG — referens för
                             jämförelse. Körs inte standalone (kräver
                             riktig backend/auth).
  _template/                 Bas-kopia med mock-lager. Utgångspunkt för
                             nya design-mappar — kopiera denna.
  design-fix-01-kursprov/    Design-mapp. Varje fix/idé får egen mapp.
```

## Mock-lagret (i `_template` och alla design-mappar)

- `lib/supabase/client.ts` + `server.ts` — fejkad session, ingen Supabase.
- `lib/supabase/middleware.ts` — passthrough, ingen login-redirect.
- `lib/api.ts` — samma metodsignaturer som produktionen men all data kommer
  från `lib/mock-data.ts` (minne, muterbart tills sidan laddas om).
- `lib/api.types.ts` — produktionens typer, oförändrade.
- `app/api/chat/route.ts` — statiskt svar, ingen AI.
- Ingen `.env` behövs. Ingen del av poolen når `wiseos.noblearc.se`,
  Railway-API:t eller Supabase.

## Köra en design-mapp

```bash
pnpm install                                  # en gång (rot)
pnpm --filter @pool/design-fix-01-kursprov dev -- --port 3101
```

Öppna http://localhost:3101 — allt renderar direkt utan login.

## Ny design-mapp

```bash
cp -r design-pool/_template design-pool/design-fix-02-<namn>
# byt "name" i dess package.json till @pool/design-fix-02-<namn>
pnpm install
pnpm --filter @pool/design-fix-02-<namn> dev -- --port 3102
```

## Regler

- Poolen rör ALDRIG produktionskod, produktionsdatabas eller credentials.
- Inget i poolen deployas eller pushas automatiskt.
- En godkänd design appliceras på produktionskoden först efter uttrycklig
  instruktion (t.ex. "applicera den här ändringen till live-versionen") —
  då på en riktig branch med normal testkörning och granskning.
