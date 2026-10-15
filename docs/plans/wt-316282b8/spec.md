# Especificação técnica — Encerramento de linha mobile no MaxGrid

## 1. Contexto & Objetivo

- Data: 15/10/2026.
- Projeto: `@maxvue/max-components-ui`, versão declarada `1.1.2`.
- Worktree exclusiva: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-316282b8`, branch `wt-316282b8`.
- Pedido: fazer `s4-max-end-mobile` e `s4-max-mobile-end`, aplicados aos itens internos do `MaxGrid`, encerrarem a linha depois do item no mobile.
- Valor entregue: o item seguinte começa na próxima linha, mesmo quando ainda caberia ao lado. O item marcado não precisa ocupar toda a largura.

### Evidência atual

`src/presetMaxUno.ts:84-117` aceita as duas ordens e emite dimensões e `break-after: always` dentro de `(max-width: 767.98px)`. Entretanto, `src/components/base/gridSlotRows.ts:17,69-108` reconhece somente marcadores sem dispositivo. `break-after` não determina quebra de linha em flexbox comum; a quebra real depende dos segmentos `.max-grid-row` criados pelo organizador. A limitação está documentada em `docs/THEME.md:226-245` e `COMPONENTS.md:1217`.

O diagnóstico é por leitura. Não foram executados testes, builds ou reprodução no navegador nesta sessão.

## 2. Escopo

### Incluído

1. Reconhecer os dois sufixos equivalentes `end-mobile` e `mobile-end` na família de tokens `s`, em classes e atributos já admitidos pelo organizador.
2. Aplicar o encerramento somente quando a viewport satisfizer exatamente `(max-width: 767.98px)`; atualizar ao cruzar esse limite.
3. Preservar o prefixo opcional `s-`, extensões ausentes, numéricas, `max` e `full`, seguindo o contrato existente de dimensionamento.
4. Cobrir regressões unitárias, CSS gerado, navegador real e documentação vigente.

### Fora de escopo

- Não habilitar quebras responsivas `start-mobile`, `tablet` ou `desktop`: continuam com a limitação atual. O pedido é de encerramento mobile, não uma expansão geral da API.
- Não alterar dimensões, media queries, cascata ou declarações `break-*` do preset.
- Não alterar `MaxGridCols`, flexbox externo, inputs, stores, cache, rede, persistência ou API pública do componente.
- Não introduzir PrimeVue, novas dependências ou helpers paralelos ao MaxUse.
- Não instalar, publicar, versionar, integrar Git nem editar artefatos `dist` nesta tarefa.

## 3. Arquitetura & Mudanças Técnicas

### Contrato esperado

| Situação | Resultado |
|---|---|
| `s4-max-end-mobile` ou `s4-max-mobile-end`, viewport mobile | Fecha o segmento depois do item; próximo item em outra linha |
| Mesmo token, viewport maior que `767.98px` | Não impõe quebra nem cria wrappers por si só |
| Token sem dispositivo, como `s7-end` | Mantém a quebra em qualquer viewport |
| Token responsivo sem direção, como `s20-full-mobile` | Continua apenas dimensionando pelo CSS |
| Atributo `''`, `true` ou `'true'` | Ativo, condicionado ao mobile |
| Atributo `false`, `null`, `undefined` ou outro valor | Não ativa o marcador, como hoje |
| `end` seguido de `start` ativo | Uma fronteira, sem linha vazia |

`s4-max-*` mantém mínimo de `80px` e teto de `100%` somente na media query já existente; `max` não significa forçar largura integral. Fora dela, não adicionar dimensões como efeito colateral.

### Integração proposta

1. Em `src/components/MaxGrid.vue`, usar `useMediaQuery` importado de `@maxvue/max-use`, dentro do `<script setup>`, com a query literal `(max-width: 767.98px)`.
2. Encaminhar o booleano reativo ao `GridSlotRows` como prop interna explicitamente declarada. Não criar prop pública, listener global manual ou dependência de `useSystemStore`, cujos breakpoints são diferentes.
3. Em `src/components/base/gridSlotRows.ts`, manter o processamento puro de VNodes e acrescentar contexto opcional de mobile a `renderGridSlotRows`; o valor padrão deve manter a semântica antiga. Tipar e declarar a prop do componente funcional para não tratá-la como atributo DOM.
4. Preservar o reconhecimento legado. Acrescentar reconhecimento estrito dos tokens com `end-mobile`/`mobile-end`, sem capturar sufixos repetidos, conflitantes ou dispositivos não incluídos. Ativar `hasEnd` apenas quando o contexto mobile for verdadeiro.
5. Reutilizar segmentação, normalização de classes, ativação de atributos e expansão de Fragments existentes. Não percorrer os slots de componentes filhos nem alterar os VNodes originais.

Fluxo: viewport → `useMediaQuery` do MaxUse → prop interna → extração de marcadores ativos → segmentação existente → `.max-grid-row` existente.

MaxUse `1.1.47` instalado reexporta `useMediaQuery`; VueUse efetivo é `14.4.0`. O código instalado consulta `matchMedia`, acompanha eventos `change` e usa gerenciamento de listeners do VueUse. Não chamar composables dentro de funções puras de renderização. MaxPinia não é necessário para um estado local derivado da viewport: não haverá nova camada de dados/Get/salvamento/cache.

### Arquivos previstos

Todos existem; nenhum novo módulo de produção é necessário:

- `src/components/MaxGrid.vue`: query e passagem do contexto interno.
- `src/components/base/gridSlotRows.ts`: reconhecimento e ativação condicionada.
- `tests/components/MaxGrid.test.ts`: regressões e eventos de media query.
- `tests/preset/presetMaxUno.generate.test.ts`: contrato CSS das duas grafias, sem alterar a produção do preset.
- `tests/browser/maxGridLineBreaks.browser.ts`: geometria, resize e componentes reais.
- `vitest.browser.config.ts`: incluir tokens usados no CSS virtual do harness.
- `docs/THEME.md` e `COMPONENTS.md`: suporte pontual, limite e exemplos.
- `playground/src/scenarios/layout-grid.vue`: corrigir somente a nota que diz que todas as quebras com dispositivo são ignoradas; preservar exemplos e dados existentes.

### Compatibilidade e limites

- Manter labels, flags `no-message`/`no-messages`, gap padrão `13px × 8px`, gap customizado, atributos de raiz e filhos sem wrappers quando não houver marcadores ativos.
- Não criar regra que transforme um encerramento em início de linha: itens anteriores ainda podem compartilhar a linha com o item marcado.
- Redimensionamentos dentro da mesma faixa não devem provocar reorganização ou remontagem desnecessária.
- Cruzar o breakpoint pode mudar os pais DOM dos filhos. Keys não garantem preservação de instâncias entre pais diferentes. A implementação deve testar valores controlados, estado local e foco; perda de estado/foco é um gate de revisão, não uma garantia já resolvida. Não ampliar para um redesenho do grid sem decisão adicional se esse risco se confirmar.
- Sem `window`/`matchMedia`, não lançar erro; preservar marcadores legados. Não escolher uma largura SSR arbitrária. Testar a ausência da API e não afirmar cobertura de hidratação real sem teste específico.

## 4. Plano de Execução Faseado

1. Preflight por leitura: conferir worktree, alterações locais, instruções, scripts e dependências efetivas; resolver isolamento de saídas antes de validar.
2. Implementar em um lote o contexto mobile, parser e todos os testes previstos. Preservar as verificações legadas.
3. Atualizar documentação vigente e a nota do playground, deixando explícitos os dispositivos/direções ainda não suportados.
4. Executar validação consolidada, diagnosticar falhas por causa e corrigir em lote. Não validar a cada microedição.
5. Revisar diff, riscos de resize e matriz de aceite; registrar resultados reais e pendências, sem commit/merge/push.

## 5. Critérios de Aceite & Validação

- As duas grafias funcionam como classe e atributo em `375px` e `767px`, e não forçam quebra em `768px` e `1280px`.
- Em fixture com três caixas fixas que cabem juntas, A e B permanecem na mesma linha e C fica abaixo de B quando B tem o marcador ativo. Gap vertical de `13px`, tolerância de `1px`.
- Em sequência desktop → mobile → desktop, na mesma montagem, a quebra aparece e desaparece; não depende de recarregar a tela.
- Unitários verificam a query exata e eventos de `MediaQueryList`; navegador usa `page.viewport` de verdade, sem `if` que silencie a ausência da API.
- Classes normalizadas, atributos condicionais, tokens inválidos, Fragments, aninhamento, `v-model`, gaps e marcadores legados continuam cobertos.
- CSS gerado das duas grafias: `flex: 1 1 0%`, `min-width: 80px`, `max-width: 100%`, `break-after: always`, exclusivamente na media query mobile.
- A documentação não promete `start-mobile`, `tablet`/`desktop` ou flexbox externo.

Comandos existentes, para a sessão Execute após concluir o lote e o preflight:

```bash
npm run test
npm run test:browser
npm run type-check:test
npm run lint
npm run build
```

`build` já executa `vue-tsc`; não repetir `type-check` na mesma revisão sem motivo. `npm run verify` é gate de pré-release e só deve substituir o conjunto parcial quando o escopo de entrega exigir pré-release. Não executar `release` nem publicar.

O plano detalha a matriz de aceite, isolamento do harness, retomada e registro de execução. Esta especificação e o plano são documentos de proposta: nenhuma implementação ou validação runtime foi realizada.
