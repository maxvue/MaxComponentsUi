# Plano de execução — Issue #95

## Correção localizada de sincronização externa do MaxInputDiscount

### Descrição e Causa Raiz

**Veracidade: bug confirmado em 19/10/2026.** Atribuir `null` externamente a `modelValue` ou `discount` não remove o desconto anterior nem recalcula o preço líquido. Não há correção pré-existente nos watchers examinados.

**Causa Raiz Comprovada:** `src/components/MaxInputDiscount.vue:L450-475`. Os dois watchers condicionam toda a sincronização a `val !== undefined && val !== null` (linhas 454 e 467). Quando a prop passa de `10` para `null`, o callback retorna sem atualizar `digitsBuffer` e sem emitir `update:price`. O estado calculado continua usando o buffer anterior, embora a prop externa já esteja nula.

Evidências e fluxo causal:

1. **Contrato público:** `src/components/MaxInputDiscount.vue:L83-96` declara `modelValue` e `discount` como `number | string | null`, além de opcionais. Os eventos públicos estão em `L157-163`.
2. **Inicialização:** `src/components/MaxInputDiscount.vue:L218-233` usa `discount ?? modelValue ?? default ?? 0`; `default` vale `'0'` em `L130-137`. `initBufferFromNumeric(0, tipo)` produz `''`. Essa cadeia só inicializa o estado: não deve ser reutilizada para uma limpeza explícita posterior, pois poderia reaplicar um `default` não zero ou outro alias antigo.
3. **Origem do valor preservado:** `src/components/MaxInputDiscount.vue:L235-243` deriva `currentDiscountValue` exclusivamente de `digitsBuffer`, não diretamente da prop. Buffer vazio equivale a desconto zero.
4. **Efeito visual e financeiro:** `src/components/MaxInputDiscount.vue:L256-272` deriva `displayValue` e `currentPrice` daquele desconto. O input usa `displayValue` em `L29-46`; por isso a UI e o cálculo permanecem desatualizados juntos.
5. **Retorno ao consumidor:** `src/components/MaxInputDiscount.vue:L450-475` emite apenas `update:price` quando uma atualização externa numérica efetivamente muda o desconto; a emissão inicial ocorre em `L499-502`. Com `null`, não há nova emissão e o consumidor também conserva o último preço informado.
6. **Validação visual afetada:** `src/components/MaxInputDiscount.vue:L274-308` deriva excesso, erro e conclusão do desconto interno. Uma limpeza ignorada pode conservar indicadores de desconto aplicado ou de limite excedido.

**Rastreamento reverso e limites de arquitetura:** input nativo/UI ⇄ `displayValue` ⇄ `currentDiscountValue` ⇄ `digitsBuffer` ⇄ watchers de `modelValue`/`discount` ⇄ props do componente pai. `currentPrice` deriva do desconto e de `effectiveGross` (`L187-192`) e retorna ao pai por `update:price`. Não há Store, API/Rotas, Controller/Service ou DB nesse caminho: o componente importa somente Vue e `InputBase` (`L69-70`). Não presumir camadas de aplicações consumidoras ausentes deste repositório.

**Reprodução executada sem alterar fontes ou criar testes:** script Node em memória, usando `@vue/compiler-sfc`, transpile de TypeScript, Vue Test Utils e happy-dom. Foi compilado o SFC real, substituindo apenas `InputBase` por um invólucro que renderiza o slot e preserva o input real. Cada montagem recebeu `gross=200`, desconto inicial `10` e, após a montagem, `await wrapper.setProps({ [prop]: null })`. Asserções confirmaram que a prop ficou nula e o estado incorreto persistiu:

| Prop alterada | Tipo | Campo após `null` | Desconto interno | Preço interno | Histórico de `update:price` |
| --- | --- | --- | --- | --- | --- |
| `modelValue` | `percent` | `10,0 %` | 10 | 180 | `[[180]]` |
| `modelValue` | `currency` | `R$ 10,00` | 10 | 190 | `[[190]]` |
| `discount` | `percent` | `10,0 %` | 10 | 180 | `[[180]]` |
| `discount` | `currency` | `R$ 10,00` | 10 | 190 | `[[190]]` |

O resultado esperado é desconto interno zero, buffer vazio, campo `0,0 %` ou `R$ 0,00`, preço interno `200` e uma nova emissão `update:price` com `200`. O script comprova a lógica e o input; não equivale à execução da suíte integral com `InputBase` real ou a testes em navegador.

### Arquivos afetados

Na implementação futura, somente:

- `src/components/MaxInputDiscount.vue`: corrigir os dois watchers de desconto externo, preservando a API e os demais caminhos de sincronização.
- `tests/components/MaxInputDiscount.test.ts`: adicionar os casos de limpeza externa e não-regressão ao arquivo existente.

Nesta etapa, o único arquivo preenchido é `docs/issues/95/plan.md`. Não alterar fontes, dependências, lockfile, exports, stores, estilos ou outros documentos para essa correção.

### Execuções propostas

1. Trabalhar na worktree dedicada já alocada pelo MaxCode, preservando a branch e alterações de terceiros. Não criar outra worktree, publicar, commitar ou integrar automaticamente.
2. Preparar em `tests/components/MaxInputDiscount.test.ts` os testes da matriz abaixo, usando o helper de montagem existente e `await wrapper.setProps(...)`. Capturar eventos antes/depois para não confundir a emissão inicial de preço com a emissão da limpeza. A suíte atual (`L19-257`) não possui caso de atualização externa de desconto para `null`.
3. Nos dois watchers de `src/components/MaxInputDiscount.vue:L450-475`, distinguir ausência de limpeza: continuar ignorando `undefined`; converter `null` explicitamente em zero; converter números e strings numéricas com `Number`, mantendo a proteção contra `NaN`.
4. Reaproveitar a comparação com `currentDiscountValue` e `initBufferFromNumeric` para aplicar o valor normalizado. Uma mudança efetiva de desconto para zero deve produzir buffer vazio, atualizar os computeds e só então emitir `update:price` com o preço recalculado.
5. Manter a política atual de eventos de entrada externa: emitir apenas `update:price` quando houver mudança efetiva, sem adicionar `update:modelValue`, `update:discount`, `type-change` ou `update:type_discount`. Não usar `emitValues()` nesse caminho, evitando realimentação e conversão involuntária do `null` do pai em zero.
6. Não alterar `parseInitialDiscount`, a precedência inicial entre aliases, a semântica de `default`, o watcher de `price/endValue`, a máscara, as fórmulas, a alternância de tipo ou os limites. A limpeza externa deve manter o tipo ativo, inclusive quando selecionado pelo usuário em modo `auto`.
7. Aplicar a mesma normalização aos dois callbacks, com alteração mínima. Não centralizar todos os watchers nem introduzir uma nova precedência global entre props simultâneas. Se ambos os aliases forem limpos no mesmo ciclo, a primeira mudança efetiva zera o estado e a segunda não deve duplicar `update:price`.
8. Concluir o bloco de implementação e testes antes dos gates; validar o conjunto uma vez, diagnosticar eventuais falhas, corrigir em lote e revalidar somente após concluir as correções.

### Testes de regressão e validação em lote

Acrescentar casos parametrizados para cada prop (`modelValue`, `discount`), isolando o outro alias salvo nos casos explicitamente indicados:

| Grupo | Preparação / ação | Asserções obrigatórias |
| --- | --- | --- |
| Limpeza percentual | `gross=200`, desconto 10, `percent`; prop → `null` | Antes: desconto 10, preço 180; depois: buffer `''`, desconto 0, campo `0,0 %`, preço 200 e exatamente uma nova emissão `[200]`. |
| Limpeza monetária | Mesmos valores em `currency` e alias `value` | Antes: preço 190; depois: buffer `''`, desconto 0, campo `R$ 0,00`, preço 200, nova emissão única `[200]` e tipo preservado. |
| Sem reaplicar padrão | `default=5`, desconto externo 10; prop → `null` | Desconto final 0, não 5; preço final 200. |
| Prop opcional ausente | Desconto 10; prop → `undefined` | Estado e campo continuam no valor anterior; não surge nova emissão de preço. |
| Valores externos válidos | Prop → `5`, depois `'7.5'`, depois `0` | Valores, máscara e preços coerentes com cada tipo; zero numérico continua funcionando. |
| Entrada inválida | Desconto 10; prop → `'inválido'` | Estado anterior preservado, sem emissão nova ou `NaN` no preço/campo. |
| Idempotência | Desconto já zero; prop → `null`; repetir `null` | Campo e preço continuam corretos, sem novas emissões por ausência de mudança efetiva. |
| Limpeza dos dois aliases | Montar com `modelValue=10` e `discount=10`; ambos → `null` em um `setProps` | Desconto zero, preço 200 e apenas uma emissão adicional de preço, sem ciclo de eventos. |
| Sem fallback para outro alias | Ambos inicialmente 10; limpar um alias por vez, em montagens separadas | A atualização explícita para `null` zera o estado mesmo com o outro alias ainda em 10, como já ocorre para atualização explícita numérica para 0. |
| Estado de validação | Desconto 25, limite percentual 20, mensagem de erro; prop → `null` | `InputBase` real recebe `error=null` e `done=undefined`, removendo o erro por excesso sem indicar desconto aplicado; desconto e preço refletem zero. Overrides manuais não são alterados. |
| Modo automático | `auto`, selecionar moeda via símbolo, depois prop → `null` | Tipo ativo permanece moeda, desconto zero e preço bruto restaurado; limpeza não emite eventos de troca de tipo. |
| Retorno bidirecional | Após limpar, alterar `price` para 180 com bruto 200 em percentual | Watcher de preço continua calculando desconto 10 e emitindo os eventos de desconto já previstos. Repetir com `endValue` em montagem isolada. |

Nos casos de atualização externa, verificar também que não apareceram emissões extras de `update:modelValue`/`update:discount`. Usar os membros já expostos por `defineExpose` (`src/components/MaxInputDiscount.vue:L504-510`) e o valor do input real; evitar ampliar a API pública ou usar `any` novo sem necessidade. Manter os testes existentes de digitação, aliases, conversão de tipo, limites, Delete/Backspace e desabilitação.

Gate do lote de implementação, executado dentro da worktree e somente após concluir fontes e testes:

```bash
npm run type-check:test && npm run lint && npm run build && npm run test
```

`build` já executa `vue-tsc`; não repetir `type-check` sobre a mesma revisão. A suíte completa inclui a regressão localizada, portanto não executar também o arquivo isolado sem necessidade concreta. Falhas preexistentes devem ser identificadas e reportadas, sem ampliar o escopo silenciosamente. Nesta etapa de planejamento, esses gates não foram executados; somente a reprodução diagnóstica em memória foi executada.

### Banco de dados

Nenhuma migration. Não há persistência ou acesso a banco no fluxo afetado.

### Riscos de quebra e Não-Regressão

- **Confundir `undefined` com limpeza:** normalizar apenas `null` para zero. Cobrir retirada da prop sem apagar o desconto em uso.
- **Reaplicar desconto padrão ou alias antigo:** não usar a cadeia de inicialização no watcher. Cobrir `default` não zero e aliases coexistentes.
- **Criar realimentação de v-model:** preservar a ausência de eventos de desconto em sincronização externa, testar idempotência e limpeza simultânea dos aliases, e contar emissões novas em vez de apenas verificar o último valor.
- **Alterar máscara ou tipo:** continuar usando `initBufferFromNumeric` com o tipo efetivo atual, sem resetar `userSelectedType`; cobrir percentual, moeda, `value` e seleção no modo `auto`.
- **Quebrar bidirecionalidade ou arredondamento:** manter intacto o watcher de preço e os computeds; cobrir atualização numérica posterior à limpeza e os testes existentes de conversão percentual/monetária.
- **Manter feedback visual obsoleto:** validar o `InputBase` real na suíte quando um desconto acima do limite for limpo. Não alterar overrides manuais de erro/conclusão.
- **Ampliar semântica fora do relato:** o comportamento de `null` na montagem com `default` não zero permanece o atual; esta correção trata transições externas após a montagem. Combinações contraditórias de preço e desconto alteradas simultaneamente não justificam redesenhar a precedência neste escopo.
- **Retrocompatibilidade estrutural:** sem mudanças em props, payloads, exports, dependências, classes legadas ou estilo. Não introduzir PrimeVue nem referência local a `@maxvue/max-use`.

### Validação

Prova conclusiva da implementação: os novos testes devem comprovar, nos dois watchers e nos dois tipos de desconto, a transição externa `10 → null` com `gross=200`, obtendo buffer vazio, desconto zero, campo formatado como zero, preço 200 e exatamente uma nova emissão `update:price(200)`, sem eventos extras de desconto ou tipo. Esses testes precisam detectar a implementação atual como incorreta e passar após a correção.

Comando de validação localizada, como alternativa ao gate completo ou para diagnosticar uma falha concreta, não como repetição automática:

```bash
npm run test -- tests/components/MaxInputDiscount.test.ts
```

Aceite do lote: gate de tipos dos testes, lint, build e suíte completa com saída zero; nenhuma alteração fora dos arquivos de implementação previstos. Antes de uma eventual release, usar `npm run verify` em vez de repetir manualmente suas etapas. Este plano não autoriza release, push, commit ou merge.

### Skills Aplicáveis

- `vue-debugging-best-practices`: rastrear divergência entre prop e estado derivado e respeitar o ciclo de atualização de watchers.
- `vue-components`: preservar Composition API, contratos de props/emits e estrutura do componente.
- `vue-typescript-best-practices`: manter os tipos anuláveis existentes e a tipagem dos testes.
- `vitest-skill` e `javascript-testing-patterns`: testes parametrizados, asserções de DOM/estado/eventos e sincronização com Vue Test Utils.
- `vue-eslint-stylelint-quality-standards`: aplicar as convenções mandatórias do projeto nas linhas tocadas, sem reformatação ampla.
- `code-review`: revisar a correção cirúrgica e seus riscos antes de eventual integração autorizada.
- `technical-documentation-best-practices`: manter este plano verificável, em português, distinguindo evidência executada de validações futuras.

Não depender de skills citadas apenas como exemplos e indisponíveis no catálogo. Aplicar as diretrizes canônicas de execução e validação em lote do projeto durante a implementação.
