# GATE5-SVG-BUNDLE — relatório de execução

- Papel: `GATE5-SVG-BUNDLE` (somente leitura de código).
- Agente: `/root/gate5_svg_bundle`; parent: `/root`.
- Início: `2026-09-15T17:16:00-03:00`; fim: `2026-09-15T17:18:50-03:00`.
- HEAD auditado: `cabb5d710f452a8a27e34d92210a28261491f8ac` (`fixes/optimize-fix5`).
- Manifest: somente este relatório e a linha correspondente da matriz; nenhum arquivo-fonte, manifesto, lockfile ou script foi alterado. O `dist/` foi reconstruído pelo comando canônico e é artefato ignorado.

## Evidências e métricas

1. `npm run check:svgo` — **PASSOU** (código 0). A verificação executou `scripts/optimize-svgs.mjs --check` e confirmou que os **11 SVGs** de cartão estão otimizados e idempotentes.
2. `npm run build:clean` — **PASSOU** (código 0). O build apagou/recriou `dist/`, executou `vue-tsc` e Vite, transformou **382 módulos** e gerou declarações sem diagnósticos. Não houve aviso de chunk acima do limite do Vite.
3. `npm run check:distribution-budgets` — **PASSOU** (código 0): **4 arquivos / 65 testes** aprovados em 21,26 s. A bateria constrói `dist/` limpo e verifica orçamento de tree-shaking, mapa explícito de exports, isolamento dos SVGs de cartão e pipeline SVGO.
4. Métricas do `dist/` reconstruído: **792 arquivos**, **253 JS** (699.286 B), **1 CSS** (336.135 B; `style.css` 336.094 B, gzip 39.433 B, Brotli 31.735 B), **332 sourcemaps** (3.583.965 B) e **5.114.625 B** totais. As referências `sourceMappingURL` emitidas foram verificadas sem destino ausente.
5. Exports e CSS: `package.json` declara **122 subpaths**; todos os destinos estáticos de export existem no `dist/`. `sideEffects` contém somente `**/*.css` e `**/*.scss`. Não há injeção de CSS por `document.createElement('style')` no grafo granular do MaxButton.
6. Tree-shaking: o grafo transitivo reconstruído de `dist/components/MaxButton.es.js` contém 7 módulos, **22.240 B**, abaixo do teto obrigatório de **238.886 B**. O entry granular tem 61 B e não importa CSS global. `dist/index.es.js` mede 15.439 B (gzip 5.416 B; Brotli 4.807 B) e não contém SVG de cartão inline.

## Veredito

**ACEITO.** SVGO é idempotente, o build limpo é reproduzível, os 65 testes de bundle/SVG aprovam, budgets/exports/CSS passam e os sourcemaps emitidos são resolvíveis.
