# 34 — ESLint: 6 erros e 3 warnings pendentes

**Severidade:** Baixa
**Categoria:** Qualidade de código
**Arquivos:** `tests/components/MaxUserSection.test.ts:62,71,77,81,93,124`, `src/components/MaxTabItem.vue:16`, `src/components/MaxTabPanel.vue:31`

## Problema

`npx eslint .` (sem fix): 6 erros `@stylistic/arrow-parens` em `MaxUserSection.test.ts`; 3 warnings `no-unused-vars`: imports mortos `Random` e `watchOnce` em `MaxTabItem.vue`, e `should_render` em `MaxTabPanel.vue` — este último é suspeito de bug (computed de lazy-render calculado e nunca ligado ao template; ver achado 02).

Stylelint: sem erros. Warning benigno recorrente do npm: `invalid config allow-git=false` em `~/.npmrc`.

## Correção sugerida

`npm run lint` (auto-fix) resolve os arrow-parens; remover imports mortos; decidir o destino de `should_render` junto com o conserto do MaxTabs.
