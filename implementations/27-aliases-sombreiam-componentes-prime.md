# 27 — Aliases sem prefixo Max sombreiam componentes do PrimeVue

**Severidade:** Média
**Categoria:** Divergência de comportamento / Resolver
**Arquivos:** `src/components-manifest.json`, `src/scripts/generateResolver.ts:41-47`

## Problema

O gerador cria alias sem prefixo `Max` para todo componente, e esses aliases têm precedência sobre o fallback PrimeVue no resolver. Colisões confirmadas: `ColorPicker → MaxColorPicker` e `Popover → MaxPopover` — ambos também são exports reais de `src/prime/index.ts`. Um app que quer o `ColorPicker` do PrimeVue recebe silenciosamente o `MaxColorPicker`.

Também vale para `Tab/Tabs/TabList/TabPanel/Drawer/Accordion*` (não estão no prime/index.ts, mas existem no PrimeVue).

## Correção sugerida

Adicionar uma denylist de colisões no gerador (ou documentar explicitamente a precedência Max-first no README/CLAUDE.md).
