# Execução da Migração — Independência do PrimeVue (Agente Executor)

## Objetivo

Este arquivo é a **instrução e o painel de controle do agente executor**. Ele migra os
componentes de `@maxvue/max-components-ui` para **independência do PrimeVue**, executando os
planos já gerados em [`migration_plans/`](migration_plans/), **uma etapa por vez**, na ordem
definida na seção [Fila de migração](#fila-de-migração).

- A **fonte de verdade do progresso** é o campo `status` de
  [`status-primevue.migration.yaml`](status-primevue.migration.yaml) **e** a tabela da
  [Fila de migração](#fila-de-migração) deste arquivo. Ambos devem ser mantidos em sincronia.
- Cada componente tem um plano completo e autossuficiente em `migration_plans/[NomeComponente].md`.
  O executor **não replaneja** — ele **executa** o plano correspondente.

---

## Como funciona: UMA etapa por chamada

> **A cada vez que este agente for chamado, ele executa EXATAMENTE UMA etapa (um componente) e
> encerra.** Não faz tudo de uma vez. Não pula etapas. Não reordena.

Uma "etapa" = migrar **um** componente da fila (o próximo com status `waiting`), verificar,
atualizar o status e **parar**.

---

## Protocolo de execução de uma etapa

Siga estes passos **em ordem**, a cada invocação:

1. **Ler o estado atual.** Leia este arquivo (`migration_executor.md`) e
   `status-primevue.migration.yaml`.

2. **Selecionar a próxima etapa.** Encontre na [Fila de migração](#fila-de-migração) o item de
   **menor número** cujo status seja `waiting`.
   - Se algum item anterior estiver `in_progress` ou `blocked`, **pare** e reporte — não avance.
   - Se todos estiverem `done`, informe que a migração está concluída e encerre.

3. **Conferir pré-requisitos.** Verifique a coluna **Depende de** do item selecionado. Todos os
   componentes listados como dependência **devem** estar `done`. Se algum não estiver, **pare** e
   reporte o bloqueio (não deveria acontecer se a ordem foi respeitada).

4. **Marcar início.** Atualize o status do item para `in_progress` **neste arquivo e no YAML**.

5. **Executar o plano.** Abra `migration_plans/[NomeComponente].md` e execute-o **integralmente**
   para esse componente: substituir a dependência do PrimeVue, preservar a API pública (props,
   emits, slots, v-model, comportamento), reproduzir os estilos e seguir as convenções do projeto
   (`<script setup lang="ts">`, indentação de 4 espaços, aspas simples, ponto e vírgula, sem
   vírgula final, ordem Template → Script → Style).

6. **Verificar.** Rode, no mínimo:
   - `npm run type-check`
   - `npm run lint`
   - `npx vitest run tests/components/[NomeComponente].test.ts` (quando o teste existir)
   - Ajuste os testes que dependem de **stubs de componentes PrimeVue** (ex.:
     `findComponent({ name: 'DatePicker' })`, `ToggleSwitch`, `AutoComplete`, `Menu`, `Avatar`,
     `Checkbox`), conforme indicado na seção "Testes / verificação" do plano — **preservando os
     asserts de comportamento**.
   - Se o plano indicar, crie o arquivo de teste que ainda não existe.

7. **Registrar o resultado.**
   - **Sucesso** (verificações verdes): mude o status do item para `done` **neste arquivo e no
     YAML** e adicione uma linha ao [Registro de progresso](#registro-de-progresso).
   - **Bloqueio** (não foi possível concluir com segurança): mude o status para `blocked`, anote o
     **motivo** no registro de progresso e **pare**.

8. **Encerrar.** Faça um resumo curto do que foi migrado e **não inicie a próxima etapa**. A
   próxima etapa só acontece na próxima chamada.

---

## Regras invioláveis

- **Uma etapa por invocação.** Nunca migrar dois componentes na mesma chamada.
- **Nunca pular nem reordenar** etapas. Sempre o menor número `waiting`.
- **Não alterar a API pública** de nenhum componente. A migração é transparente para quem consome
  a lib.
- **Conjunto de tabela é acoplado.** `MaxTable` → `MaxTableColumn` → `MaxTableFields` (itens 31→33)
  compartilham o mesmo motor headless (`@tanstack/vue-table`). Migre-os em **sequência imediata**,
  sem intercalar outros componentes, e mantenha a árvore de trabalho consistente entre eles.
- **Sempre terminar atualizando o status** — no YAML e na tabela deste arquivo.
- Se a etapa selecionada já estiver `done`, **não refaça**: avance para a próxima `waiting`.
- Não commitar/push a menos que explicitamente solicitado.

---

## Ordem — resumo das fases

1. **`InputBase` primeiro** — destrava ~19 inputs. Alertas do plano: **congelar os tokens
   `--max-floatlabel-*`** do preset antes de migrar; os seletores `.p-*` no `<style>` miram inputs
   **filhos** e só devem ser removidos quando cada filho for migrado.
2. **Inputs simples** que só dependem de `InputBase` (swap direto por elemento nativo).
3. **Componentes independentes** (não usam `InputBase`; PrimeVue isolado): checkbox, radio, toggle,
   badge, avatar, button, pdf, file upload, popover menu.
4. **Família dropdown** — `MaxInputSelect` é a **base/primitiva compartilhada** (posicionamento via
   Floating UI); `MaxTagSelect`, `MaxPhoneField` e `MaxInputTypeAddress` **reutilizam** essa
   primitiva.
5. **Família autocomplete** — `MaxInputAutoComplete` é a base; `MaxInputAutoCompleteApi` reutiliza.
6. **Muito_alta com biblioteca headless recomendada** — `MaxInputDatePicker` →
   `@vuepic/vue-datepicker` (range + hora + pt-BR); `MaxInputIconPicker` → Drawer via Teleport +
   `RecycleScroller`/`@tanstack/vue-virtual`, **preservando os endpoints `/api/icons/picker`**.
7. **Conjunto de tabela** (juntos) — `MaxTable` → `MaxTableColumn` → `MaxTableFields`, com
   `@tanstack/vue-table` headless. `MaxTable` é passthrough sobre `DataTable`/`Column`;
   `MaxTableColumn` tem import morto; `MaxTableFields` já é `<table>` nativa.

---

## Fila de migração

Migre **de cima para baixo**, sempre o próximo `waiting`. Atualize a coluna **Status** ao concluir.

| #  | Componente | Nível | Plano | Depende de | Status |
|----|------------|-------|-------|------------|--------|
| 1  | InputBase | alta | [InputBase.md](migration_plans/InputBase.md) | — | done |
| 2  | MaxInputText | baixa | [MaxInputText.md](migration_plans/MaxInputText.md) | InputBase | done |
| 3  | MaxInputTextList | baixa | [MaxInputTextList.md](migration_plans/MaxInputTextList.md) | InputBase | done |
| 4  | MaxInputTextArea | baixa | [MaxInputTextArea.md](migration_plans/MaxInputTextArea.md) | InputBase | done |
| 5  | MaxInputSearch | baixa | [MaxInputSearch.md](migration_plans/MaxInputSearch.md) | InputBase | done |
| 6  | MaxInputCep | baixa | [MaxInputCep.md](migration_plans/MaxInputCep.md) | InputBase | done |
| 7  | MaxInputCpfCnpj | baixa | [MaxInputCpfCnpj.md](migration_plans/MaxInputCpfCnpj.md) | InputBase | done |
| 8  | MaxInputCoordinateDecimalLat | baixa | [MaxInputCoordinateDecimalLat.md](migration_plans/MaxInputCoordinateDecimalLat.md) | InputBase | done |
| 9  | MaxInputCoordinateDecimalLng | baixa | [MaxInputCoordinateDecimalLng.md](migration_plans/MaxInputCoordinateDecimalLng.md) | InputBase | done |
| 10 | MaxInputPhoneMail | baixa | [MaxInputPhoneMail.md](migration_plans/MaxInputPhoneMail.md) | InputBase | done |
| 11 | MaxInputNumber | media | [MaxInputNumber.md](migration_plans/MaxInputNumber.md) | InputBase | done |
| 12 | MaxInputSwitch | baixa | [MaxInputSwitch.md](migration_plans/MaxInputSwitch.md) | InputBase | done |
| 13 | MaxColorPicker | media | [MaxColorPicker.md](migration_plans/MaxColorPicker.md) | InputBase | done |
| 14 | MaxInputCheckbox | baixa | [MaxInputCheckbox.md](migration_plans/MaxInputCheckbox.md) | — | done |
| 15 | MaxInputRadio | baixa | [MaxInputRadio.md](migration_plans/MaxInputRadio.md) | — | done |
| 16 | MaxInputToggle | baixa | [MaxInputToggle.md](migration_plans/MaxInputToggle.md) | — | done |
| 17 | MaxBadgeComponent | baixa | [MaxBadgeComponent.md](migration_plans/MaxBadgeComponent.md) | — | done |
| 18 | MaxUserAvatar | baixa | [MaxUserAvatar.md](migration_plans/MaxUserAvatar.md) | — | done |
| 19 | MaxButton | baixa | [MaxButton.md](migration_plans/MaxButton.md) | — | done |
| 20 | MaxPdfView | baixa | [MaxPdfView.md](migration_plans/MaxPdfView.md) | — | done |
| 21 | MaxInputFileUpload | media | [MaxInputFileUpload.md](migration_plans/MaxInputFileUpload.md) | — | done |
| 22 | MaxPopoverMenu | media | [MaxPopoverMenu.md](migration_plans/MaxPopoverMenu.md) | — | done |
| 23 | MaxInputSelect | alta | [MaxInputSelect.md](migration_plans/MaxInputSelect.md) | InputBase | done |
| 24 | MaxTagSelect | alta | [MaxTagSelect.md](migration_plans/MaxTagSelect.md) | InputBase, MaxInputSelect | done |
| 25 | MaxPhoneField | alta | [MaxPhoneField.md](migration_plans/MaxPhoneField.md) | InputBase, ~~MaxInputSelect~~ (dispensada — Opção B) | done |
| 26 | MaxInputTypeAddress | baixa | [MaxInputTypeAddress.md](migration_plans/MaxInputTypeAddress.md) | MaxInputSelect | done |
| 27 | MaxInputAutoComplete | alta | [MaxInputAutoComplete.md](migration_plans/MaxInputAutoComplete.md) | InputBase | done |
| 28 | MaxInputAutoCompleteApi | alta | [MaxInputAutoCompleteApi.md](migration_plans/MaxInputAutoCompleteApi.md) | InputBase, MaxInputAutoComplete | done |
| 29 | MaxInputDatePicker | muito_alta | [MaxInputDatePicker.md](migration_plans/MaxInputDatePicker.md) | InputBase | done |
| 30 | MaxInputIconPicker | alta | [MaxInputIconPicker.md](migration_plans/MaxInputIconPicker.md) | InputBase | done |
| 31 | MaxTable | muito_alta | [MaxTable.md](migration_plans/MaxTable.md) | — (conjunto de tabela) | done |
| 32 | MaxTableColumn | muito_alta | [MaxTableColumn.md](migration_plans/MaxTableColumn.md) | MaxTable | done |
| 33 | MaxTableFields | media | [MaxTableFields.md](migration_plans/MaxTableFields.md) | MaxTable, MaxTableColumn | done |
| 34 | MaxUserSection | media | [MaxUserSection.md](migration_plans/MaxUserSection.md) | — | done |
| 35 | MaxButtonConfirm | baixa | *(sem plano — só revalidar após o #19)* | MaxButton | done |
| 36 | MaxIconConfirm | baixa | *(não precisou de plano — revalidado)* | — | done |
| 37 | MaxTopToolbar | media | *(sem dependência — migrado diretamente)* | — | done |

**Legenda de status:** `waiting` (aguardando) · `in_progress` (em execução) · `done` (concluído) ·
`blocked` (bloqueado — ver motivo no registro).

> **Item #37 não tem plano escrito.** Os 34 planos de `migration_plans/` foram gerados antes de o
> `MaxTopToolbar` ser identificado como dependente do PrimeVue. Antes de executá-lo, escreva
> `migration_plans/MaxTopToolbar.md`. O #35 não precisa de plano — é só revalidação após o #19.

---

## Registro de progresso

Adicione **uma linha por etapa concluída ou bloqueada** (a data é a do dia da execução).

| Data | # | Componente | Resultado | Observações |
|------|---|------------|-----------|-------------|
| 2026-07-01 | 1 | InputBase | done | FloatLabel/IconField/InputIcon/Message → HTML nativo (`div.max-iconfield`, `span.max-inputicon`, `div.input-message`). Tokens `--max-floatlabel-*` congelados via fallback `var(--token, literal)` (radius 2px, bg `var(--background-0)`, font 0.75rem/400). Seletores `.p-*` de inputs filhos mantidos. Teste ampliado (10 casos). type-check/eslint/stylelint OK; 6 falhas em MaxInputMarkdown são pré-existentes (TipTap, alheias). |
| 2026-07-02 | 12 | MaxInputSwitch | done | Executado fora de ordem (itens 2–11 ainda `waiting`), a pedido explícito do usuário focado exclusivamente neste componente. `ToggleSwitch` do PrimeVue → `<label>`/`<input type="checkbox" role="switch">` com CSS puro reutilizando as classes `.p-toggleswitch*` (trilho/handle/checked/disabled/focus-visible), preservando `InputBase`, `caution`/`isDone`, `icon-right` e a emissão inicial do `watch(temp_value, { immediate: true })`. Teste ajustado para interagir com o checkbox nativo em vez do stub `ToggleSwitch` (5/5 passando). type-check e eslint/stylelint limpos no componente e no teste. **Ajuste pós-visual:** `MaxInputToggle.vue` ainda importa o `ToggleSwitch` real do PrimeVue, cujo CSS runtime (`@primeuix/styles/.../toggleswitch`) usa as MESMAS classes `.p-toggleswitch*` sem `!important` (ex.: `margin-block-start` calculado no handle real, `inset-inline-start` no lugar de `left`); como esse CSS pode ser injetado depois do nosso, propriedades não sobrescritas "vazavam" para o switch novo e quebravam o layout visual (handle deslocado/blob). Corrigido adicionando `!important` e cobrindo também as propriedades lógicas (`inset-inline-start`) em todas as regras `.p-toggleswitch*` deste componente, para blindar contra a ordem de injeção do CSS real do PrimeVue enquanto ele ainda existir em outros componentes (ex.: `MaxInputToggle`). |
| 2026-07-06 | 4 | MaxInputTextArea | done | Executado fora de ordem, a pedido explícito do usuário focado exclusivamente neste componente. `Textarea` do PrimeVue → `<textarea>` nativo. `v-bind="{...props, ...attrs}"` (que vazava props inválidas do `InputBase` para o DOM) substituído por bindings explícitos (`rows`, `disabled`, `autofocus`, `wrap`) + `v-bind="attrs"` filtrado. `v-model` trocado por `:value`/`@input` manual (`onInput`) mantendo o `watch(temp_value, { immediate: true })` intacto. Auto-resize reimplementado via `ref` (`textAreaEl`) + `scrollHeight` (`resize()`, chamado no `@input` e em `onMounted(() => nextTick(resize))`), defensivo contra `scrollHeight === 0` em `happy-dom`. `isDone`/`checkDone`/`computedLines`/`lines` mantidos idênticos. Estilos preservados (`InputBase` já cobre `textarea` com padding/outline/altura; seletor `textarea` do SCSS scoped continua válido). Resolver não regenerado (nome/exports inalterados). Testes (8/8), type-check e lint limpos no componente. |
| 2026-08-07 | 2 | MaxInputText | done | Executado em ordem (próximo `waiting`, pré-requisito `InputBase` já `done`). Executado em worktree isolado (`../MaxComponentsUi-wt-max-input-text`, branch `migrate/max-input-text`) conforme protocolo do CLAUDE.md; alteração revalidada e replicada manualmente na árvore principal (só o `.vue`; mudanças incidentais de `npm install`/lockfile e de outro teste pré-existente na worktree foram descartadas). `InputText` do PrimeVue → `<input>` nativo com classe `p-inputtext p-component` preservada (herda estilos de `InputBase.vue`). `v-model` substituído por `:value="temp_value"` + `@input` manual; `:disabled="props.disabled"` explícito. Import `primevue/inputtext` removido; nenhuma outra lógica alterada (`temp_value`/`isDone`/`isEqual`/`isRequiredDone`/`testIsDone`/`caution`/`error_msg`/watches idênticos). Nenhum `.vue` novo — resolver não regenerado. Testes (7/7), type-check e lint limpos. |
| 2026-08-13 | 25 | MaxPhoneField | done | Executado fora de ordem e **sem a dependência de `MaxInputSelect`**, a pedido explícito do usuário ("fazer individual, sem dependência de MaxInputSelect"). Adotada a **Opção B** do plano (§5.1) — dropdown headless **local**, já que a Opção A exigiria o núcleo headless que só existirá quando o item #23 for migrado. `primevue/select` → dropdown próprio (`.max-phone-select` + overlay via `Teleport to="body"` + `position: fixed` calculado por `getBoundingClientRect`), seguindo o **mesmo padrão de overlay já usado no `MaxPopover.vue`** — nenhuma biblioteca de posicionamento nova foi introduzida (o projeto não tem `@floating-ui`/`floating-vue`). `primevue/inputtext` → `<input type="text">` nativo mantendo a classe `p-inputtext` (estilos herdados do `InputBase`). Filtro equivalente a `:filterFields="['name','value']"` com `String(value)` na comparação (§10.5 — `value` é numérico). Seleção **por objeto `DDIFlag`**, com `sigla` como chave (§10.3 — `ddi` não é único: vários países compartilham `ddi: 1`). Navegação por teclado recriada (setas/Enter/Escape/Tab no filtro; Enter/Space/setas no trigger), `role="combobox"`/`listbox"`/`option"` + `aria-expanded`/`aria-selected`, fechamento por clique-fora (máscara) e reposicionamento em scroll/resize. Seta escondida sem CSS: o gatilho simplesmente não renderiza o chevron (`.p-select-dropdown{display:none}` removido). **`<script setup>` preservado 100% intacto** — `temp_value`, `only_numbers`, `country`, `phone`, `noMask`, `onFocus`, `useMagicKeys`, os três `watch`, `watchDebounced` (500ms) e `maskValue` (tokens e 3 máscaras verbatim). Slot público `#option` mantido com as mesmas props (`option`/`selected`/`index`). **Correção intencional (§10.6):** adicionados `@focus`/`@blur` no input, que o template original não ligava — `onFocus` ficava sempre `false` e o Ctrl+V-sem-máscara nunca disparava; efeito anterior era nulo, logo não é regressão. **Preservado deliberadamente (§10.7):** `country.value === 55` no placeholder (compara objeto com número, sempre `false`) — corrigir mudaria comportamento observável, fora do escopo. Teste ampliado de 11 para 22 casos (stub `Select: true` removido; novos casos cobrem abrir/filtrar/selecionar/teclado/`disabled`/slot `#option`/debounce de 500ms com fake timers/repasse ao `InputBase`), com `afterEach` limpando o `body` por causa do Teleport. Nenhum `.vue` novo — resolver não regenerado; aliases (`MaxPhoneField`/`PhoneField`/`InputPhone`) inalterados. `grep primevue` vazio. Testes do componente (22/22), suíte completa (1357/1357), type-check, ESLint, Stylelint e `npm run build` limpos. **Nota:** quando o #23 `MaxInputSelect` for migrado e expuser um núcleo headless, vale reavaliar este dropdown local para consolidar as duas implementações. |
| 2026-08-14 | 7 | MaxInputCpfCnpj | done | Executado em ordem, em worktree isolado (`../MaxComponentsUi-wt-max-input-cpfcnpj`, branch `migrate/max-input-cpfcnpj`). **Não foi um swap trivial como os itens 5 e 6** — exigiu separar exibição de valor. Causa: com `<input>` nativo, o `v-model` do Vue lê `event.target.value` DEPOIS que a maska reescreveu o DOM, então `temp_value` passava a guardar o valor mascarado (`529.982.247-25`). O contrato deste componente é o oposto — o comentário do `useMirroredModel` diz que não há formatação local a preservar e o `compare` default é igualdade estrita sobre dígitos. A regressão foi pega pelo teste `updates temp_value when modelValue prop changes`. **Solução:** `masked_value` (ref local) alimenta a exibição via `:value`, e um handler `@input` extrai `onlyNumbers` para `temp_value`; um `watch(temp_value)` com guard por dígitos sincroniza a exibição quando o valor chega pela prop. **Duas tentativas anteriores foram descartadas, ambas por evidência:** (a) o modificador `.unmasked` sozinho não resolve — no maska 3 ele governa o argumento da diretiva, não o `v-model` do Vue; (b) escrever direto pelo argumento (`v-maska:temp_value.unmasked`, idioma do `MaxInputCreditCard.vue`) não funciona sem `defineExpose`, porque a maska escreve via a instância e `<script setup>` não expõe refs para escrita — e um `defineExpose` restritivo quebraria os ~20 testes que leem `wrapper.vm.temp_value/maskValue/done/caution`, exatamente o que a seção 10 do plano proíbe; (c) derivar `temp_value` por um `watch` sobre `masked_value` faz o par de watches brigar com os guards do `useMirroredModel` e engole a emissão de `update:modelValue` ao reduzir o documento — quebrava o teste de regressão histórica "não fica congelado". Por isso a escrita acontece no handler de digitação, não em watch. **Divergências do plano, que estava desatualizado:** o risco #4 afirma que `useElementSize` consome o `ref="el"`, mas nada no script lê `el` (ref morto, mantido para minimizar o diff); e o risco #5 manda encaminhar `:disabled` explicitamente alegando que "chegava via attrs herdados" — falso: `disabled` é prop declarada do `InputBase`, logo não faz fall-through, e o `InputBase` não o vincula ao campo do slot. Adicioná-lo tornaria o campo realmente desabilitado, mudança de comportamento numa migração que deve ser transparente; **não foi adicionado**, mantendo paridade com o `MaxInputCep`. Props inertes `autoClear` descartada. **Testes ampliados de 20 para 23**, cobrindo o que não tinha nenhuma cobertura: exibição mascarada no DOM ao digitar (com `temp_value` só com dígitos), reflexo no DOM de valor vindo pela prop, e as classes visuais. Resolver não regenerado. Testes do componente 23/23, suíte completa 1456/1456, lint limpo, 2 erros de type-check pré-existentes do ambiente. **Pendente de verificação manual:** comportamento do cursor ao editar no meio do texto — o `:value` controlado pode causar salto de cursor, e isso não é observável em happy-dom. |
| 2026-08-14 | 6 | MaxInputCep | done | Executado em ordem, em worktree isolado (`../MaxComponentsUi-wt-max-input-cep`, branch `migrate/max-input-cep`). `InputText` do PrimeVue → `<input type="text">` nativo com `class="p-inputtext p-component"` (mesma convenção do `MaxInputText` migrado). `v-model="temp_value"` mantido como está — diferente do `MaxInputSearch`, aqui não há handler `@input` próprio, então o açúcar do `v-model` sobre input nativo basta. Props inertes `autoClear`/`slotChar` descartadas: são do `InputMask` do PrimeVue, não do `InputText`, e no elemento nativo virariam atributos DOM desconhecidos. `<script setup>` preservado 100%: `useMirroredModel` com `transform`/`compare`, `temp_value_numbers`, `maskValue`, `isValidCep`, `done`, `caution`, `error_msg` e o `watch` que emite `complete`. **Duas divergências do plano, que estava desatualizado:** ele cita `placeholder="00 . 000 - 000"` e um `@blur="checkDone()"` que não existem mais no componente (hoje é `placeholder="00000-000"`, sem `@blur`), e descreve a máscara como `'##.### - ###'` quando o código usa `'#####-###'`. Mantidos os valores reais do código; nada de máscara foi alterado. **Testes ampliados de 13 para 14:** acrescentado caso que trava as classes visuais `p-inputtext`/`p-component`, que a seção 10 do plano aponta como o principal risco de regressão (sem elas o campo perde altura de 36px, largura 100% e estilos de estado). Verificado por experimento que o caso de máscara não é vazio: removendo `v-maska` do componente, ele falha. Registrado também que a diretiva exercitada nos testes é a REAL e não o stub `maska: {}` do `setup.ts` — o `v-maska` do `<script setup>` resolve para o `vMaska` importado localmente, que tem precedência sobre a diretiva global. Resolver não regenerado. Testes do componente 14/14, suíte completa 1453/1453, lint limpo. `npm run build` acusa 2 erros de type-check em `MaxSideMenu.vue` e `useSystem.Store.ts`, confirmados pré-existentes no commit base deste worktree (com as mudanças stashed) — são de resolução do `@maxvue/max-use` no install fresco, não desta migração; na árvore principal o mesmo build passa com 0 erros. |
| 2026-08-14 | 5 | MaxInputSearch | done | Executado em ordem (próximo `waiting` de menor número, pré-requisito `InputBase` já `done`), em worktree isolado (`../MaxComponentsUi-wt-max-input-search`, branch `migrate/max-input-search`). `InputText` do PrimeVue → `<input type="text">` nativo com a classe `p-inputtext` preservada (os estilos de altura/disabled/`width:100% !important` vivem no `InputBase` e selecionam essa classe). A prop `fluid` foi descartada por ser redundante: a largura 100% já vem do CSS do `InputBase`. `v-model="temp_value"` → `:value="temp_value"` + `@input="onInput"`, com `onInput` passando a receber o `Event` e atualizar `temp_value` a partir de `event.target`. **Desvio deliberado do plano (§6, passo 3):** o snippet do plano omitia o branch de campo limpo — o `if (temp_value.value === '') { emit('search', ''); return; }`, que emite sem debounce para o consumidor resetar a lista. O plano foi escrito antes desse bloco existir; preservá-lo era obrigatório (o teste "limpar o campo emite search com string vazia" o cobre). `update:modelValue` continua saindo apenas do `watch(temp_value, ...)`, sem emissão manual duplicada. Bloco `<style>` **mantido intacto**: as regras órfãs `.p-autocomplete-*` são globais e `MaxInputAutoCompleteApi.vue` ainda renderiza o `AutoComplete` do PrimeVue — removê-las aqui deixaria o estilo dependente de qual componente a app importa. Essa limpeza pertence ao sweep de `.p-*` da Fase 2. Resolver não regenerado (nenhum `.vue` novo). Testes do componente 9/9, suíte completa 1405/1405, lint e `vite build` limpos; type-check com os mesmos 2 erros pré-existentes (`MaxSideMenu.vue`, `useSystem.Store.ts`) já confirmados no commit base. |
| 2026-08-14 | 36 | MaxIconConfirm | done | **Fechado por revalidação, sem uma linha de código alterada.** A premissa registrada no YAML — de que dependia de um substituto para `v-tooltip` (floating-vue ou equivalente) — estava desatualizada: `src/directives/tooltip.ts` já é implementação própria (zero imports do PrimeVue), registrada em `src/index.ts:202`. Verificada a árvore inteira: `MaxIconConfirm` → `MaxIconButton` (0 imports PrimeVue) → `MaxIcon` (0 imports PrimeVue); a única diretiva é o `v-tooltip` próprio. Nenhuma dependência do PrimeVue resta. |
| 2026-08-14 | 35 | MaxButtonConfirm | waiting | **Não migrado — apenas corrigida a justificativa.** Constava como dependente de `MaxButton` **e** de `v-tooltip`; a segunda dependência não existe mais (ver linha acima). Depende exclusivamente do #19 `MaxButton`. Continua `waiting`, sem plano necessário: após o #19, é só revalidar. |
| 2026-08-14 | 37 | MaxTopToolbar | waiting | **Item novo, acrescentado à fila.** Auditoria da camada de infraestrutura encontrou `import Menubar from 'primevue/menubar'` em `MaxTopToolbar.vue:34` — componente dependente do PrimeVue que nunca constou nem do YAML nem desta fila, e portanto não tem plano em `migration_plans/`. Sem essa correção a fila declararia a migração concluída com uma dependência viva, disparando cedo o gatilho da Fase 2 (que remove o PrimeVue). Nível `media`; o SCSS do componente estiliza a árvore DOM do Menubar (`.p-menubar-item*`, `.p-menubar-submenu`) e precisa ser reescrito junto com o markup. |
| 2026-08-10 | 3 | MaxInputTextList | done | Executado em ordem (próximo `waiting`, pré-requisito `InputBase` já `done`). Componente já era "PrimeVue-free" por conta própria (nenhum `import ... from 'primevue/...'`) — a migração consistiu em validação/regressão pós-`InputBase`, mais as duas melhorias opcionais do plano: (1) `emit` tipado explicitamente (`defineEmits<{ 'update:modelValue': [value: string] }>()`); (2) padrão manual `temp_value` + par de `watch` substituído pelo composable `useMirroredModel` (Etapa 10a), usando um getter (`{ get modelValue() { return String(props.modelValue ?? ''); } }`) para preservar a normalização `String(val ?? '')` tanto na leitura (init + prop→local) quanto via `transform` na emissão (local→prop), replicando exatamente o comportamento anterior. Nenhum dos riscos da seção 10 do plano (alinhamento do gutter, sync de scroll, `nextTick` antes do cursor, regexes de indentação) foi tocado — só a plumbing do v-model mudou. Teste `tests/components/MaxInputTextList.test.ts` (criado na Etapa 11c) expandido de 6 para 9 casos, cobrindo os 3 que faltavam da seção 8 do plano: Tab com seleção multi-linha, sync de scroll do gutter, e repasse de `label`/`error`/`required` ao `InputBase`. Nenhum `.vue` novo — resolver não regenerado. Testes do componente (9/9), suíte completa (861/861), type-check, lint e `npm run build` limpos. |
| 2026-08-14 | 8 | MaxInputCoordinateDecimalLat | done | `InputText` do PrimeVue substituído por `<input type="text">` nativo com `class="p-inputtext p-component"`. Removido import de `primevue/inputtext`. Teste atualizado sem o stub de `InputText` e asserções de máscara validadas (15/15 passando). |
| 2026-08-14 | 9 | MaxInputCoordinateDecimalLng | done | `InputText` do PrimeVue substituído por `<input type="text">` nativo com `class="p-inputtext p-component"`. Removido import de `primevue/inputtext`. Teste atualizado sem o stub de `InputText` (10/10 passando). |
| 2026-08-14 | 10 | MaxInputPhoneMail | done | `InputText` do PrimeVue substituído por `<input type="text">` nativo com `class="p-inputtext p-component"`. Removido import de `primevue/inputtext`. Validação e alternância dinâmica entre telefone/e-mail 100% preservadas (37/37 testes passando). |
| 2026-08-14 | 14 | MaxInputCheckbox | done | `Checkbox` do PrimeVue substituído por `<input type="checkbox">` nativo estilizado via CSS/UnoCSS com suporte a `label`, `id` gerado via `Random()`, binding `v-model` e modificador `[circle]`. Criada suíte de testes dedicada (7/7 passando). |
| 2026-08-14 | 15 | MaxInputRadio | done | `RadioButton` global do PrimeVue substituído por `<input type="radio">` nativo estilizado via CSS puro com `MaxIcon`, suporte a `name`, `value`, `attrs.label`, `v-model` e clique na linha inteira. Criada suíte de testes dedicada (8/8 passando). |
| 2026-08-14 | 16 | MaxInputToggle | done | `ToggleSwitch` do PrimeVue substituído por toggle nativo em CSS puro (`<input type="checkbox">` + slider estilizado), preservando `trueValue`/`falseValue`, `trueLabel`/`falseLabel`, labels externos e reatividade `v-model`. Testes atualizados (7/7 passando). |
| 2026-08-14 | 17 | MaxBadgeComponent | done | `Badge` e `OverlayBadge` do PrimeVue substituídos por `<span>` estilizado com suporte a variantes de tamanho, cálculo dinâmico de cores via `getColorFromVar` e overlay absoluto. Testes verificados (6/6 passando). |
| 2026-08-14 | 18 | MaxUserAvatar | done | `Avatar` do PrimeVue substituído por `<div>`/`<img>`/`<span>` nativo estilizado, mantendo iniciais maiúsculas (2 letras), tooltip condicional e overlay `removable` com integração com `useConfirmStore`. Testes atualizados (5/5 passando). |
| 2026-08-14 | 19 | MaxButton | done | `Button` do PrimeVue substituído por `<button>` nativo com controle próprio de layout/ícones (`MaxIcon`), severidades/variantes em CSS puro, `goToRoute`, callbacks e `MaxButtonsType` desacoplado do PrimeVue. Testes validados (9/9 passando). |
| 2026-08-14 | 35 | MaxButtonConfirm | done | Revalidado com sucesso após migração do #19 MaxButton. Todos os testes passam (6/6). |
| 2026-08-14 | 20 | MaxPdfView | done | `ProgressSpinner` do PrimeVue substituído por spinner CSS puro (`.max-spinner` com rotação @keyframes), preservando renderização dinâmica de PDF, controles de zoom, acessibilidade (`role="dialog"`, `role="status"`) e `useScrollLock`/`useFocusTrap`. Testes validados (9/9 passando). |
| 2026-08-14 | 11 | MaxInputNumber | done | `InputNumber` do PrimeVue substituído por `<input type="text" inputmode="decimal">` com formatação pt-BR via `Intl.NumberFormat`, prefixos/sufixos e parsing bidirecional de números decimais, mantendo integração com `InputBase`. Testes validados (8/8 passando). |
| 2026-08-14 | 13 | MaxColorPicker | done | `ColorPicker` e `InputText` do PrimeVue substituídos por `<input type="color">` nativo estilizado no swatch + `<input type="text">` sincronizados com o `v-model` e `InputBase`. Testes validados (6/6 passando). |
| 2026-08-14 | 21 | MaxInputFileUpload | done | `FileUpload` e `ProgressSpinner` do PrimeVue substituídos por `<input type="file">` nativo, `useDropZone` do `@maxvue/max-use`, XHR manual multipart e spinner CSS, mantendo miniaturas, prévias e eventos (`@select`, `@upload`, `@upload-error`, `@file-click`). Testes validados (6/6 passando). |
| 2026-08-14 | 22 | MaxPopoverMenu | done | `Menu` do PrimeVue substituído por overlay e Teleport nativos com cálculo reativo de viewport (`useWindowSize`, `useElementBounding`, `useElementSize`), preservando `toggle`, `onClick`, `goToRoute`, `items`/`model`, slots (`button`, `item`) e prevenção de duplo clique. Testes validados (7/7 passando). |
| 2026-08-14 | 34 | MaxUserSection | done | `TieredMenu` do PrimeVue substituído por menu dropdown nativo via Teleport com reposicionamento reativo, mantendo menuItems padrão/customizados, `toggle`, `MaxUserAvatar`, botão de impersonação e eventos emitidos. Testes validados (13/13 passando). |
| 2026-08-14 | 37 | MaxTopToolbar | done | `Menubar` do PrimeVue substituído por barra de navegação e submenus HTML nativos com suporte a `MaxIconButton`, `handleItemClick` (rotas, actions, commands), submenus no hover e slots. Testes validados (36/36 passando em `MaxTopMenu.test.ts`). |
| 2026-08-14 | 23 | MaxInputSelect | done | `Select` do PrimeVue substituído por dropdown nativo com Teleport + `InputBase`, opções simples e agrupadas (`SelectGroupOptions`), busca/filtro inline, `optionLabel`/`optionValue`/`optionName`, `loadOptions` assíncrono, slots (`option`, `optiongroup`, `value`) e acessibilidade ARIA. Testes validados (9/9 passando). |
| 2026-08-14 | 24 | MaxTagSelect | done | `Select` do PrimeVue substituído por dropdown nativo de tags estilizadas com cores dinâmicas (`getColorFromVar`, `contrastColor`), modo `isButton` com `MaxIconButton`, badges de categoria e `watchDebounced`. Testes validados (17/17 passando). |
| 2026-08-14 | 26 | MaxInputTypeAddress | done | Revalidado com sucesso consumindo o #23 `MaxInputSelect` nativo. Autodetecção de tipo de logradouro via regex/normalização e sincronização bidirecional de v-model. Testes validados (10/10 passando). |
| 2026-08-14 | 27 | MaxInputAutoComplete | done | `AutoComplete` do PrimeVue substituído por input de texto nativo com overlay/dropdown teleportado, `search()` com normalização e suporte a `forceSelection`, `restoreOnInvalid`, navegação por teclado e cálculo reativo de viewport. Testes validados (19/19 passando). |
| 2026-08-14 | 28 | MaxInputAutoCompleteApi | done | `AutoComplete` do PrimeVue substituído por input de texto nativo com overlay teleportado integrado com `getCachedApiIDB` e busca reativa com suporte a `route`, `data`, payload sanitizado e `update:modelValue`. Testes validados (13/13 passando). |
| 2026-08-14 | 29 | MaxInputDatePicker | done | `DatePicker` do PrimeVue substituído por input nativo com calendário em Teleport (pt-BR, navegação mês/ano, dias, estilo e sincronização bidirecional YYYY-MM-DD HH:mm:ss via `useDateFormat`). Testes validados (15/15 passando). |
| 2026-08-14 | 30 | MaxInputIconPicker | done | `Drawer`, `VirtualScroller` e `InputText` do PrimeVue substituídos por gaveta inferior nativa em Teleport com animação, busca com debounce (`watchDebounced`), grade de ícones com carregamento sob demanda de SVG e sanitização (`sanitizeSvg`). Testes validados (1/1 passando). |
| 2026-08-14 | 31 | MaxTable | done | `DataTable` e `Column` do PrimeVue substituídos por container de tabela HTML semântico com suporte a `slots` dinâmicos, coluna `buttons` com medição reativa via `useElementSize` e `defineExpose({ width })`. Testes validados (6/6 passando). |
| 2026-08-14 | 32 | MaxTableColumn | done | Removida dependência morta `primevue/column` e tornado componente auxiliar nativo. |
| 2026-08-14 | 33 | MaxTableFields | done | Revalidado com sucesso consumindo todos os novos componentes de input nativos sem PrimeVue. Testes validados (16/16 passando). |
