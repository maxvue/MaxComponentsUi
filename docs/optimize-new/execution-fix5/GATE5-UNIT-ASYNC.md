# GATE5-UNIT-ASYNC — relatório de execução

- Papel: `GATE5-UNIT-ASYNC` (somente leitura de código).
- Agente: `/root/gate5_unit_async`; parent: `/root`.
- Início: `2026-09-15T16:42:17-03:00`; fim: `2026-09-15T16:45:46-03:00`.
- HEAD auditado: `dca2b1450304f3acefc167cdb6a2eaa9a4c500a5` (`fixes/optimize-fix5`).
- Manifest: somente este relatório e a linha correspondente da matriz; nenhum arquivo de código alterado.

## Preparação

`npm run build:clean` passou (código 0; Vite: 382 módulos, 12,36 s). O build foi feito antes das rodadas repetidas porque as suítes de distribuição exigem `dist`.

## Rodadas obrigatórias

| Comando | Resultado | Arquivos/testes | Duração |
|---|---|---:|---:|
| `npm test` (rodada 1) | falhou, código 1 | 10 falhos + 232 aprovados / 15 falhos + 3.695 aprovados | 25,70 s |
| `npm test` (rodada 2) | falhou, código 1 | 10 falhos + 232 aprovados / 15 falhos + 3.695 aprovados | 25,57 s |
| `npm run test:coverage` (rodada 1) | falhou, código 1 | 10 falhos + 232 aprovados / 15 falhos + 3.695 aprovados | 28,08 s |
| `npm run test:coverage` (rodada 2) | falhou, código 1 | 10 falhos + 232 aprovados / 15 falhos + 3.695 aprovados | 28,05 s |

As quatro rodadas foram determinísticas quanto às 15 falhas. Como o Vitest encerra a cobertura diante das falhas, não emitiu tabela/artefato percentual de cobertura; portanto, não há métrica de cobertura aprovada a registrar.

## Falhas constantes

- InputBase/25 famílias: quatro asserções em `tests/architecture/inputBaseAccessibility.test.ts`, uma em `tests/components/InputBase.accessibility.test.ts` e uma em `tests/components/InputBase.test.ts`.
- Assets de cartão: três asserções de grafo/chunks em `tests/assets/creditCardAssetsOptimization.test.ts`, uma de SVG JCB em `tests/components/MaxCreditCard.test.ts` e uma de distribuição em `tests/unit/creditCardAssets.test.ts`.
- Contraste: `tests/components/MaxDarkModeContrast.test.ts` exige os fallbacks duplos esperados.
- Nome acessível: `MaxModal.test.ts` e `MaxPopover.test.ts` esperam ignorar `aria-labelledby` oculto/vazio.
- Teclado do TagSelect: `tests/components/MaxTagSelect.test.ts` não abre após Enter.

Mesmo depois de `build:clean`, as quatro asserções de distribuição de cartões dizem que `dist` não existe para o teste, o que contradiz a preparação reproduzida e precisa de investigação do isolamento/ordem dos testes.

## Política de saída assíncrona

Foi pesquisada a saída integral das quatro rodadas por `AbortError`, `DOMException`, `EPROTO`, `Unhandled`, `[Vue warn]` e `console.warn/error`. Não houve ocorrência desses padrões. Isto não aprova o gate: as falhas síncronas acima impedem a conclusão das suítes e das coberturas.

## Veredito

**REJEITADO.** As duas suítes e as duas coberturas não passam; consequentemente, o requisito de estabilidade/cobertura da Etapa 15 não foi satisfeito, embora não tenham sido observados `AbortError`, `EPROTO` ou warnings assíncronos nos logs destas rodadas.

## Revalidação parcial — cartões/distribuição

Após a rodada do gate, foi identificada uma condição de corrida entre o teste
`tests/architecture/treeshaking-maxbutton.test.ts` (que remove e recompila
`dist/`) e os testes R21 que inspecionam o artefato. A configuração canônica do
Vitest agora desabilita paralelismo entre arquivos para manter `dist/` estável.
O teste visual do JCB também passou a injetar o SVG JCB real: o `fetch` global
de testes retorna propositalmente um SVG sentinela para URLs genéricas e não
serve como prova da geometria do asset publicado.

Com `dist/` produzido por `npm run build:clean`, a execução focal abaixo passou
sem falhas:

```text
npm test -- --run tests/assets/creditCardAssetsOptimization.test.ts tests/unit/creditCardAssets.test.ts tests/components/MaxCreditCard.test.ts
Test Files  3 passed (3)
Tests  59 passed (59)
```

Esta revalidação elimina as cinco falhas de cartões/distribuição do diagnóstico
original; o gate permanece rejeitado até as demais falhas e as duas rodadas de
cobertura completas serem resolvidas e executadas novamente.

## Revalidação isolada final

Após o commit `aa27fc7a`, as quatro rodadas foram executadas de forma
estritamente serializada, sem outro processo Vitest no worktree. A tentativa
concorrente anterior foi invalidada e não entra nesta evidência.

| Comando | Resultado | Arquivos/testes | Duração |
|---|---:|---:|---:|
| `npm test` #1 | 0 | 242 / 3.710 | 219,33 s |
| `npm test` #2 | 0 | 242 / 3.710 | 220,39 s |
| `npm run test:coverage` #1 | 0 | 242 / 3.710 | 256,48 s |
| `npm run test:coverage` #2 | 0 | 242 / 3.710 | 262,82 s |

Cobertura idêntica: statements 86,83%, branches 78,09%, functions 87,54% e
lines 90,19% — acima dos thresholds 85/76/84/89. As quatro saídas foram
verificadas sem `AbortError`, `EPROTO`, `DOMException`, `Unhandled`, warnings
Vue ou `console.warn/error`.

**Veredito final: ACEITO.** Evidência coletada pelo agente
`/root/gate5_unit_rerun` no HEAD `aa27fc7a`.
