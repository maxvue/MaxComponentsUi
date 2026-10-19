# Plano de implementação — Issue #99

## Escopo e veracidade

Planejamento elaborado em 19/10/2026 sobre a revisão `02955b7fce6d6a61c43ab68165c7f1bbdc846d8f`, na worktree pré-alocada `wt-implement-issue-99`. **Bug confirmado; correção necessária e ainda não implementada.** Nesta etapa, somente este plano é preenchido; código-fonte e testes permanecem intactos. Não executar commit, merge, publicação ou limpeza desta worktree.

### Descrição e Causa Raiz

Com `allowNegative=true` e `modelValue=-10`, colar `1.250,75` substitui os dígitos anteriores, mas conserva o estado negativo. O componente passa a representar `-1250.75`, invertendo o significado financeiro da entrada positiva. O defeito afeta tanto a apresentação quanto o evento público; não é apenas uma inconsistência visual. Pode também alterar indevidamente o resultado da validação de limites. Persistência incorreta por uma aplicação consumidora é um risco, não um efeito demonstrado neste repositório.

**Causa Raiz Comprovada:** `src/components/MaxInputMoney.vue:L281-291`, especificamente `L287`, atribui `true` a `isNegative` quando o texto começa com `-`, mas nunca atribui `false` quando uma colagem válida é positiva. Como os dígitos são substituídos integralmente em `L289`, o sinal preservado deixa de corresponder ao novo conteúdo.

Fluxo causal e rastreamento dos dados:

1. **Entrada pelo consumidor:** a prop `modelValue` admite número/string/nulo e a prop `allowNegative` controla o sinal (`src/components/MaxInputMoney.vue:L42-51`). `syncFromModel` transforma `-10` em `rawDigits='1000'` e `isNegative=true` (`L154-174`). O valor interno inicial é calculado em `L176-178`.
2. **UI → estado local:** o `<input>` conecta `@paste="onPaste"` e recebe `currentDisplay` (`src/components/MaxInputMoney.vue:L11-24`). `onPaste` impede a colagem nativa, lê `clipboardData.getData('text')`, extrai dígitos e ignora entradas sem dígitos (`L281-285`). Para `1.250,75`, o resultado é `125075`.
3. **Falha de substituição:** o ramo de `L287` não executa para texto positivo. `rawDigits` passa a `125075`, mas `isNegative` continua `true` (`L287-290`). O defeito independe da seleção/cursor: o manipulador já substitui todos os dígitos, não faz inserção parcial.
4. **Estado → apresentação:** `currentDisplay` divide os dígitos por `divisor` e aplica o sinal armazenado (`src/components/MaxInputMoney.vue:L180-185`); `formatDisplay` acrescenta o sinal antes do símbolo monetário (`L139-152`). Resultado: `-R$ 1.250,75`.
5. **Estado → contrato público/validação:** `emitCurrentValue` calcula `finalNum` usando esse mesmo sinal, atualiza `temp_value` e emite `update:modelValue` (`src/components/MaxInputMoney.vue:L214-225`). Resultado: `-1250.75`. `temp_value` também alimenta `useInputValidation`, cujo validador compara `min`/`max` (`L189-204`); o helper lê o valor em `src/helpers/useInputValidation.ts:L82-90`.
6. **Retorno do consumidor:** mudanças externas de `modelValue` são sincronizadas pelo watcher em `src/components/MaxInputMoney.vue:L316-327`. O watcher não corrige o sinal de uma colagem incorreta: se o consumidor devolver o valor negativo emitido, ele corresponde ao estado incorreto já calculado.

**Limite arquitetural do rastreamento:** o fluxo comprovado é `consumidor/v-model ⇄ props/evento público ⇄ estado local ⇄ input/validação`. Não há store, chamada HTTP, rota, controller/service ou banco de dados no caminho desse componente. Não atribuir o defeito a camadas backend nem criar alterações nessas camadas.

**Evidência executada, sem editar arquivos:** foi executado um programa Node via entrada padrão que leu o SFC e extraiu as funções existentes `syncFromModel`, `formatNumberString`, `formatDisplay`, `emitCurrentValue` e `onPaste`, removendo apenas as anotações TypeScript para execução em `node:vm`. Foram usados `ref`/`computed` reais do Vue e `hasContent` real de `@maxvue/max-use`. Apenas callbacks periféricos de validação/cursor e a captura do evento foram substituídos. Saída observada:

```json
{"initial":"-R$ 10,00","pasted":"1.250,75","display":"-R$ 1.250,75","negative":true,"emitted":[["update:modelValue",-1250.75]]}
{"initial":"-R$ 10,00","pasted":"-1.250,75","display":"-R$ 1.250,75","negative":true,"emitted":[["update:modelValue",-1250.75]]}
{"initial":"-R$ 10,00","pasted":"abc","display":"-R$ 10,00","negative":true,"emitted":[]}
```

Essa reprodução confirma a lógica defeituosa original, mas **não constitui montagem do componente nem teste de navegador**. A montagem completa será a prova automatizada de regressão na execução futura. O teste existente de colagem parte de `modelValue=null`, sem negativos habilitados (`tests/components/MaxInputMoney.test.ts:L164-176`), e não cobre a transição negativo → positivo. O teste de negativos verifica apenas o teclado (`L132-150`).

### Arquivos afetados

| Arquivo | Alteração prevista |
| --- | --- |
| `src/components/MaxInputMoney.vue` | Correção pontual da atribuição do sinal em `onPaste`, após o descarte de entradas sem dígitos. |
| `tests/components/MaxInputMoney.test.ts` | Casos de regressão de sinal, sequência de colagens e preservação dos contratos atuais. |
| `docs/issues/99/plan.md` | Registro deste planejamento; único arquivo alterado nesta etapa. |

Não alterar `InputBase.vue`, `useInputValidation.ts`, configurações, dependências, lockfile, exports, stores ou outros componentes. Esses arquivos são referências do fluxo, não alvos da correção.

### Execuções propostas

1. Reutilizar a worktree dedicada e conferir seu estado antes da implementação, preservando trabalho preexistente. A implementação deve ocorrer apenas quando autorizada; este comando autoriza planejamento, não correção.
2. Acrescentar os testes descritos abaixo à suíte existente, reutilizando `mountInputMoney`, Pinia e `input.trigger('paste', { clipboardData: { getData: () => texto } })`. Não acessar os refs privados para comprovar o comportamento público.
3. Em `onPaste`, substituir a atribuição condicional por uma atribuição booleana completa: `isNegative.value = props.allowNegative && text.trim().startsWith('-');`.
4. Manter essa atribuição **após** `if (!hasContent(digits)) return;` e **antes** da atualização de `rawDigits` e de `emitCurrentValue`. Assim, toda colagem aceita calcula seu próprio sinal; colagens ignoradas não alteram valor, sinal ou eventos.
5. Preservar integralmente extração de dígitos, reconhecimento atual de sinal ASCII no início do texto aparado, limite de 15 dígitos, divisor, casas decimais, símbolo e semântica de substituição total. Não introduzir parser de moedas ou formatos internacionais.
6. Preservar `emitCurrentValue`, validação, cursor ao final, eventos de foco/blur, sincronização externa e ações de teclado. Não aproveitar a correção para formatar o SFC inteiro ou refatorar fluxos adjacentes.
7. Concluir o bloco de alteração e todos os testes antes de iniciar validações; executar os gates em lote, diagnosticar falhas e corrigir o conjunto antes de revalidar. Não executar testes, tipos ou builds após cada microedição.
8. Revisar o diff final garantindo apenas a mudança causal e os testes correspondentes. Não fazer commit, merge, push ou publicação sem solicitação explícita.

### Testes de regressão e validação em lote

Em todos os cenários de colagem aceita, verificar **simultaneamente** o valor do input e o último payload de `update:modelValue`; quando aplicável, conferir um único novo evento por colagem. Aguardar o ciclo assíncrono com `await input.trigger(...)`; usar `setProps` com `await` para sincronizações externas.

| Caso | Preparação/ação | Resultado esperado |
| --- | --- | --- |
| Regressão principal | `modelValue=-10`, `allowNegative=true`; colar `1.250,75` | Input `R$ 1.250,75`; payload numérico `1250.75`, sem sinal herdado. |
| Sinal negativo legítimo | Valor inicial positivo/nulo; `allowNegative=true`; colar `-1.250,75` | Input `-R$ 1.250,75`; payload `-1250.75`. |
| Colagens sucessivas | Na mesma instância, colar negativo → positivo → negativo | Cada apresentação e cada evento seguem exclusivamente o texto da respectiva colagem. |
| Valor idêntico em módulo | Inicial `-10`; colar `10,00` | Input `R$ 10,00`; payload `10`, mesmo sem mudança no módulo numérico. |
| Espaços e símbolo | Inicial negativo; colar `  R$ 1.250,75  ` e `  -R$ 1.250,75  ` com negativos permitidos | Respectivamente positivo e negativo, conforme a regra atual de `trim().startsWith('-')`. |
| Negativos desabilitados | `allowNegative=false`; colar `-1.250,75` | Input positivo e payload `1250.75`; não ampliar a política atual para rejeição. |
| Sinal residual após mudança de permissão | Iniciar com `-10` e negativos permitidos; aplicar `setProps({ allowNegative: false })`; colar positivo ou negativo | A colagem aceita redefine o sinal para `false`. Não exigir mudança retroativa do valor antes da colagem. |
| Conteúdo ignorado | Inicial `-10`, negativos permitidos; colar `''`, espaços, `abc` e `'-'` | Valor permanece `-R$ 10,00`; nenhuma nova emissão. Depois, colar positivo deve remover o sinal. |
| Clipboard ausente | Disparar `paste` sem `clipboardData` | Mesmo comportamento de colagem ignorada, sem erro nem nova emissão. |
| Zero positivo | Inicial negativo; colar `0,00` | Input `R$ 0,00`; emissão de `0`, não `-0` (`Object.is(payload, -0)` deve ser `false`). Não redefinir a política de texto explicitamente negativo com módulo zero. |
| Decimais configuráveis | Inicial negativo e negativos permitidos; `decimals=0`, colar `1.250`; `decimals=3`, colar `1.250,750` | Respectivamente `R$ 1.250`/`1250` e `R$ 1.250,750`/`1250.75`, positivos. |
| Limite de dígitos | Inicial negativo; colar `1234567890123456` | Mantém os primeiros 15 dígitos, escala vigente e sinal positivo; conferir payload `1234567890123.45` e apresentação correspondente. |
| Validação de limites | Inicial `-10`, negativos permitidos, `min=0`, `max=2000`; ativar validação com blur e colar `1.250,75` | Valor positivo válido; `InputBase` deixa de apresentar erro. Colar `-1.250,75` deve continuar inválido pelo mínimo; `2.000,01` deve continuar inválido pelo máximo. |
| Sincronização com consumidor | Após a colagem positiva, devolver o payload via `setProps({ modelValue: 1250.75 })`; depois fornecer `-20` externamente | Colagem permanece positiva; atualização externa negativa continua formatada corretamente quando permitida. |

Manter todas as asserções existentes de renderização, símbolo customizado, máscara reversa, alternância por `-`, Backspace, obrigatório, foco/blur e sincronização externa. Se for necessário testar o cursor, montar com elemento anexado ao documento e desmontar ao final, sem alterar o comportamento global da suíte.

**Validação local, após concluir o lote:**

```bash
npm run test -- tests/components/MaxInputMoney.test.ts
npm run type-check
npm run type-check:test
npm run lint:check
npm run build
```

Os comandos são gates com resultados independentes; não prosseguir com integração se algum falhar. O `build` inclui checagem de tipos, portanto pode-se omitir o `type-check` isolado quando o build for executado na mesma revisão. Não alterar configurações ou baseline para ocultar falhas preexistentes; registrar e estabelecer causalidade antes de ampliar o escopo.

**Gate de pré-release:** se a execução futura incluir preparação para release, executar `npm run verify` no lugar dos comandos isolados acima, pois já agrega suíte completa, cobertura, tipos, lint/build, navegador, consumidores, benchmarks, integridade e segurança. Não repetir essas etapas isoladamente sobre o mesmo conteúdo sem falha ou mudança relevante. A publicação não faz parte deste plano.

Nesta etapa de planejamento não foram executados Vitest, tipos, lint, build, navegador ou o gate de release; somente a reprodução isolada das funções e a inspeção do código.

### Banco de dados

Nenhuma. O defeito é local ao componente Vue; não requer migration, alteração de schema, backfill ou atualização de registros financeiros existentes. Não há evidência de dados persistidos incorretamente neste relato.

### Riscos de quebra e Não-Regressão

- **Contrato financeiro:** consumidores que dependam acidentalmente do sinal anterior observarão o valor positivo correto ao colar conteúdo positivo. Isso é a correção da regra violada, não uma mudança de tipo/API. Cobrir apresentação e payload numérico conjuntamente.
- **Colagens inválidas:** mover a atribuição antes da guarda apagaria indevidamente o sinal sem substituir o conteúdo. Cobrir texto vazio, não numérico, apenas sinal e clipboard ausente, exigindo nenhuma emissão.
- **Negativos legítimos/permissões:** uma limpeza incondicional do sinal bloquearia colagens negativas válidas; uma atribuição sem `allowNegative` permitiria negativos proibidos. Cobrir ambas as políticas e a troca de permissão antes da colagem.
- **Validação:** `min`/`max` dependem de `temp_value`. Garantir que erro e conteúdo acompanhem o sinal corrigido, sem alterar o helper compartilhado nem os overrides manuais.
- **Máscara e precisão:** não modificar separadores, escala decimal, corte de 15 dígitos, símbolo ou tratamento de zero. Cobrir decimais 0/2/3, limite e ausência de `-0` na colagem positiva.
- **Fluxos adjacentes:** não alterar teclado, IME/fallback nativo, watcher, seleção parcial, acessibilidade ou estilo. Manter regressões existentes; falhas independentes nesses fluxos exigem outro escopo.
- **Dependências e compatibilidade:** nenhuma dependência nova, import PrimeVue, mudança de export público ou alteração de classes legadas. O contrato de emissão permanece `number | null`.

### Validação

O comando conclusivo para o contrato corrigido será:

```bash
npm run test -- tests/components/MaxInputMoney.test.ts
```

Ele deverá incluir um teste com nome explícito, por exemplo `remove o sinal anterior ao colar valor positivo após negativo`, que monte o componente com `{ modelValue: -10, allowNegative: true }`, dispare `paste` com `1.250,75` e exija input `R$ 1.250,75` e último evento `[1250.75]`. No código atual, essas expectativas são contrariadas pela causa comprovada; após a correção, devem passar junto com toda a matriz de não-regressão. Um comando verde sem essas novas asserções não prova a correção da issue.

Critérios de aceite: teste principal e matriz passando; nenhum sinal herdado em colagem aceita; negativos explícitos respeitando a permissão; entradas ignoradas preservadas; tipos/lint/build sem novas falhas. Gate completo adicional quando houver exigência de pré-release. Não declarar correção implementada ou gates aprovados com base apenas neste planejamento.

### Skills Aplicáveis

- `vue-debugging-best-practices`: rastreamento do estado reativo e dos eventos, diferenciando causa do defeito e consequência visual.
- `vue-components`: implementação pontual em Composition API e preservação dos eventos/props públicos.
- `vue-typescript-best-practices`: manutenção dos tipos de props, evento de clipboard e payload `number | null`.
- `vitest-skill`: testes parametrizados e asserções de regressão com Vitest na suíte real do pacote.
- `vue-eslint-stylelint-quality-standards`: convenções do SFC e validação estática, subordinadas ao `AGENTS.md` local e sem reformatação não relacionada.
- `code-review`: revisão final da correção e dos testes antes de qualquer integração autorizada.
- `technical-documentation-best-practices`: fidelidade das referências, distinção entre evidência executada e validação futura e manutenção deste plano.
