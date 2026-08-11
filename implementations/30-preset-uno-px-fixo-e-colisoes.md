# 30 — presetMaxUno: unidade px concatenada cegamente e colisões de regras

**Severidade:** Média
**Categoria:** Bug
**Arquivos:** `src/presetMaxUno.ts:35-43, 78`, `src/helpers/paddingMargin.ts`

## Problemas

1. `min-w-*`, `max-w-*`, `min-h-*`, `max-h-*`, `w-max-*`, `h-max-*` concatenam `'px'` cegamente: `min-w-50%` → `min-width: 50%px` (CSS inválido); `max-w-full` → `fullpx`.
2. `/^[sw]-?(\d+)$/` faz `w-100` virar `flex: 1 0 calc(100% - 8px)` — colide com o `w-100` (width) do presetWind3; como `presetMaxUno` vem primeiro em `uno.config.ts`, a regra flex vence (confirmado por `node -e`).
3. `/^[pm][tblrwhyx]?-?(\d+)$/` inclui as letras `w`/`h` (`pw-`, `mh-`) mapeadas para eixos horizontais/verticais — não documentado e mentalmente colide com width/height.

## Correção sugerida

Validar unidade em `getCssSize` (aceitar `%`, `rem`, `full` etc.), restringir a regra flex ao prefixo `s-` e documentar (ou remover) `pw-`/`mh-`.
