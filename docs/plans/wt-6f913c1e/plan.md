# Plano de Execução — Sugestões do navegador desligadas por padrão + prop `suggestions`

- **Data**: 2026-10-22
- **Projeto**: `@maxvue/max-components-ui`
- **Worktree**: `wt-6f913c1e` — raiz `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-6f913c1e`, branch `wt-6f913c1e` (base `dev`)
- **Especificação técnica**: `docs/plans/wt-6f913c1e/spec.md` (fonte de verdade dos contratos; este plano referencia as seções dela)

---

## 1. Especificação resumida

- **Problema**: o navegador mostra a lista de valores já digitados sobre os campos (captura: campo "Qtd" com balão `24` cobrindo a tabela).
- **Objetivo**: todos os campos de texto renderizam `autocomplete="off"` por padrão; a nova prop booleana `suggestions` reabilita as sugestões.
- **Usuários afetados**: todas as aplicações consumidoras da biblioteca (mudança de comportamento padrão — deve ir para o changelog/release notes quando houver publicação).
- **Regra de precedência** (spec §3.1): `autocomplete` explícito do consumidor > `suggestions` (atributo ausente, ou token semântico) > `off`.
- **Exceções decididas** (spec §2 "Fora de escopo"): `MaxInputCredential` sempre `off`; `MaxInputAutoComplete(Api)` sempre `off` (dropdown próprio); `MaxInputOTP` mantém `one-time-code` na 1ª casa; editores ricos não mudam.
- **Preservação**: `MaxAuthCard` recebe `suggestions` nos campos de login para manter o preenchimento de usuário/senha salvo como hoje. Prop `autocomplete` dos semânticos e o teste `MaxInputEmail` "permite sobrescrever label e autocomplete" continuam válidos. Classes `.p-*`, ids, `aria-*` e demais atributos de `inputAttrs` não mudam.

## 2. Evidências (inspecionadas nesta sessão, somente leitura)

- `src/components/InputBase.vue`: `inputAttrs` (≈l.338) monta os atributos do elemento nativo a partir de `controlAttrsFromAttrs` (inclui `autocomplete` na lista `isControlAttribute`) e é exposto via slot e `provideInputBaseContext`. Não há `autocomplete` padrão.
- Varredura de todos os `<input>`/`<textarea>` de texto em `src/components/**/*.vue` (lista completa na spec §3.3/§3.4): a maioria faz `v-bind="inputAttrs"`; 18 tags internas não têm `autocomplete` nem `inputAttrs`.
- Componentes `inheritAttrs: false` que **descartam** `$attrs` ao chamar o `InputBase`: `base/MaxBaseQuantity.vue` (`forwardProps`, l.197), `MaxInputMonthDays.vue` (`forwardProps`, l.104), `MaxInputDiscount.vue` (props explícitas). Os 7 numéricos semânticos fazem `v-bind="props"` no `MaxBaseQuantity` com tipos de `BaseQuantityProps` (`src/types/semanticInputs.ts` l.130).
- Semânticos de texto: `MaxInputEmail` (default `'email'`), `MaxInputUrl` (`'url'`), `MaxInputPassword` (`'current-password'`), `MaxInputSlug` (`undefined`) — todos com `:autocomplete="props.autocomplete"` **depois** de `v-bind="inputAttrs"` (o binding posterior vence) e `forwardedAttrs` removendo `autocomplete` dos attrs.
- `MaxInputPhoneMail.vue` l.7: `v-bind="{ ...inputAttrs, ...attrs }"` no `<input>` — qualquer attr do consumidor (incluindo `suggestions`) vira atributo HTML.
- `MaxAuthCard.vue`: login usa `MaxInputPhoneMail` (l.16), `MaxInputText` email (l.24) e password (l.35), `MaxInputPhone` (l.77), `MaxInputOTP` (l.90); nenhum define `autocomplete` hoje.
- Docs: `COMPONENTS.md` (tabela de props do `InputBase`, l.54–76; nota l.303), `docs/INPUTS-SEMANTICOS.md` (l.116, 126, 140).
- Testes existentes relevantes: `tests/components/MaxInputEmail.test.ts` (l.71), `tests/architecture/inputBaseAccessibility.test.ts` (l.251), `tests/components/inputBaseAttributesSeparation.test.ts` (l.85, 163, 252), `tests/types/semantic-inputs.test.ts` (l.87–100), `tests/browser/inputBaseMatrix.browser.ts` (l.254); arquivos de teste por componente existem para Chips, DateRange, Discount, MonthDays, PhoneMail, Power, RG, AuthCard.
- **Limitações**: nenhum teste/build executado (sessão Plan). Comportamento do Chrome com `autocomplete="off"` não foi verificado empiricamente aqui: ele respeita `off` para o histórico de valores (caso da captura), mas pode ignorá-lo para autofill heurístico de endereço/cartão.
- Achado fora do escopo registrado em `docs/notifications/wt-6f913c1e/notifications/max-components-ui-arquivos-espurios-versionados.md`.

## 3. Solução e decisões

- **Confirmadas (pedido do usuário)**: `off` por padrão em todos os campos; prop `suggestions` habilita.
- **Decididas por investigação (registrar, não reabrir)**:
  - Ponto central no `InputBase` (uma regra em `inputAttrs`) em vez de editar 40+ componentes; só os que descartam attrs recebem repasse explícito.
  - Com `suggestions`, o atributo é **omitido** (padrão do navegador) em vez de `"on"` — mantém o HTML idêntico ao de hoje para quem optar.
  - `autocomplete` explícito vence `suggestions` — preserva contrato e teste existentes.
  - Exceções Credential / AutoComplete / OTP (motivos na spec §2).
  - `MaxAuthCard` com `suggestions` para não regredir o login.
  - Inputs internos (filtros, toolbars, tabela, mapa, toast) sempre `off`, sem prop.
- **Alternativas descartadas**: `autocomplete="new-password"`/nomes aleatórios para enganar o Chrome (hack, piora acessibilidade e gerenciadores de senha); diretiva global aplicada no `app.use` (não cobre consumidores que importam componentes isolados e foge do padrão de props).
- **Hipótese a confirmar na execução**: componentes com fallthrough de attrs (lista spec §3.3, parágrafo final) entregam `suggestions` ao `InputBase` sem alteração — confirmar pelos testes da Etapa 7; se algum falhar, aplicar o mesmo repasse explícito da Etapa 3.

## 4. Etapas

Execução sequencial por um único executor (arquivos compartilhados entre etapas, sem ganho real em paralelizar). Seguir as regras do projeto: `<script setup>` com indentação base de 4 espaços, aspas simples, sem vírgula final, `if` de linha única sem chaves, **tags de abertura que forem tocadas em uma única linha**, comentários em pt-BR.

1. **InputBase** — `src/components/InputBase.vue`
   - Prop `suggestions?: boolean` com JSDoc pt-BR; `suggestions: false` em `withDefaults`.
   - Em `inputAttrs`, antes do laço de limpeza: `if (base.autocomplete === undefined && !props.suggestions) base.autocomplete = 'off';`
   - Conclusão: `inputAttrs.autocomplete === 'off'` sem attrs; ausente com `suggestions`; valor do consumidor quando passado.
2. **Tipos** — `src/types/semanticInputs.ts`: `suggestions?: boolean` (com comentário pt-BR) em `SemanticTextBaseProps`, `BaseQuantityProps` e `MaxInputMonthDaysProps`.
3. **Repasse explícito**
   - `src/components/base/MaxBaseQuantity.vue`: prop em `Props` + `suggestions: props.suggestions` em `forwardProps`.
   - `src/components/MaxInputMonthDays.vue`: idem em `forwardProps` (props vêm do tipo da Etapa 2 — confirmar como o componente declara as props).
   - `src/components/MaxInputDiscount.vue`: declarar prop e passar `:suggestions="props.suggestions"` ao `InputBase`.
4. **Semânticos de texto** — `MaxInputEmail.vue`, `MaxInputUrl.vue`, `MaxInputPassword.vue`, `MaxInputSlug.vue`:
   - Remover o default de `autocomplete` no `withDefaults` (Slug já é `undefined`).
   - `const resolvedAutocomplete = computed(() => props.autocomplete ?? (props.suggestions ? '<token>' : 'off'));` (Email `'email'`, Url `'url'`, Password `'current-password'`, Slug `undefined`).
   - `<input ... :autocomplete="resolvedAutocomplete" ...>` e `:suggestions="props.suggestions"` no `<InputBase>`.
5. **MaxInputPhoneMail** — `src/components/MaxInputPhoneMail.vue`: criar `computed` com os attrs do input sem `suggestions` (ex.: `const { suggestions: _s, ...rest } = attrs`) e usar `v-bind="{ ...inputAttrs, ...nativeAttrs }"`. O `InputBase` raiz continua recebendo `suggestions` por fallthrough.
6. **Secundários, internos, Chips e AuthCard**
   - `MaxInputRG.vue` (caixas emissor/UF) e `MaxInputDateRange.vue` (caixa "Fim"): `:autocomplete="inputAttrs.autocomplete"`.
   - `autocomplete="off"` literal: `MaxInputSelect.vue:70`, `MaxInputMultiSelect.vue:45`, `MaxTagSelect.vue:71`, `MaxListBox.vue:10`, `MaxInputIconPicker.vue:63`, `MaxInputPhone.vue:51`, `MaxTable.vue:163`/`:424`, `MaxMaps.vue:28`/`:40`, `MaxInputMarkdownToolbar.vue:204`/`:261`/`:294`, `MaxInputHtmlToolbar.vue:258`/`:315`, `MaxToast.vue:78`, `base/MaxBaseInput.vue:2` (números de linha são do snapshot desta sessão; localizar pela tag).
   - `MaxChips.vue:58`: remover `autocomplete="off"` fixo.
   - `MaxAuthCard.vue`: atributo `suggestions` em `MaxInputPhoneMail`, `MaxInputText` (email e password) e `MaxInputPhone`.
7. **Testes**
   - Novo `tests/components/inputSuggestions.test.ts`: para `MaxInputText`, `MaxInputNumber`, `MaxInputMoney`, `MaxInputCep`, `MaxInputPhone`, `MaxInputTextArea`, `MaxInputPower`, `MaxInputMonthDays`, `MaxInputDiscount`, `MaxChips`, `MaxInputRG` (todas as caixas), `MaxInputDateRange` (ambas), `MaxInputPhoneMail` — padrão `off`; `suggestions: true` → sem atributo; `autocomplete` explícito → preservado; nenhum elemento com atributo `suggestions`. Semânticos Email/Url/Password/Slug com os tokens da spec §5. Exceções: Credential e AutoComplete continuam `off` com `suggestions`; OTP mantém `one-time-code`. Seguir o padrão de montagem dos testes vizinhos (props mínimas obrigatórias de cada componente).
   - `MaxAuthCard.test.ts`: os campos de login não têm `autocomplete="off"`.
   - Novo `tests/architecture/nativeInputAutocomplete.test.ts`: varre `src/components/**/*.vue`, extrai tags `<input`/`<textarea` do `<template>` (ignorando comentários e `type` checkbox/radio/file/color/range/hidden) e exige `inputAttrs` em `v-bind` ou `autocomplete=`/`:autocomplete=` na tag.
   - Ajustar asserções existentes que dependam de `autocomplete` ausente/`email` por padrão, **sem** enfraquecer a intenção do teste (ex.: `inputBaseAttributesSeparation`, `tests/browser/inputBaseMatrix.browser.ts`). `tests/types/semantic-inputs.test.ts` continua válido; acrescentar `suggestions: true` em um dos objetos.
8. **Documentação**
   - `COMPONENTS.md`: linha `suggestions | boolean | false | Habilita as sugestões de preenchimento automático do navegador (desabilitadas por padrão; autocomplete explícito tem prioridade)` na tabela do `InputBase`; nota curta na seção de inputs (l.≈303).
   - `docs/INPUTS-SEMANTICOS.md` l.116/126/140: tokens passam a valer só com `suggestions`; exemplo de cadastro com `autocomplete="new-password"` continua correto.
9. **Validação em lote** (seção 5), correção em lote, revalidação.

## 5. Validação

Implementar todas as etapas 1–8 antes de rodar qualquer comando. Depois:

```bash
npm run lint
npm run type-check
npm run type-check:test
npm run test
npm run build
```

`npm run test:browser` somente se `tests/browser/inputBaseMatrix.browser.ts` for alterado (e o ambiente Playwright estiver disponível; caso contrário registrar `manualPending`). `npm run verify` só se o usuário pedir o gate de release. Não rodar `npx tsx src/scripts/generateResolver.ts` (nenhum componente novo).

### Matriz de aceite

| Requisito | Evidência | Testes | Revisão / manual |
|---|---|---|---|
| `off` por padrão em todos os campos | `inputAttrs` + tags internas | `inputSuggestions.test.ts`, `nativeInputAutocomplete.test.ts` | Playground no Chrome: sem lista de histórico |
| `suggestions` reabilita | atributo ausente / token semântico | `inputSuggestions.test.ts` | Playground: lista volta a aparecer |
| `autocomplete` explícito vence | precedência §3.1 | `MaxInputEmail.test.ts` existente + novos | — |
| Numéricos/MonthDays/Discount repassam | `forwardProps`/props | casos Power, MonthDays, Discount | — |
| Sem atributo HTML `suggestions` | `MaxInputPhoneMail` | caso PhoneMail | — |
| Exceções preservadas | Credential, AutoComplete, OTP | casos de exceção | — |
| Login preservado | `MaxAuthCard` | `MaxAuthCard.test.ts` | Login no playground com senha salva |
| Docs atualizadas | `COMPONENTS.md`, `INPUTS-SEMANTICOS.md` | — | Leitura |
| Gates do projeto | — | lint, type-check, type-check:test, test, build | — |

## 6. Riscos e operação

- **Mudança de padrão para consumidores** (alto alcance, baixo risco técnico): formulários que contavam com histórico do navegador deixam de tê-lo; mitigação: prop `suggestions` e registro em release notes.
- **Gerenciadores de senha**: Chrome/Firefox geralmente ignoram `off` em campos de senha; `MaxAuthCard` já recebe `suggestions`. Telas de login fora do `MaxAuthCard` que usem `MaxInputPassword` perdem o token `current-password` por padrão — documentar que devem usar `suggestions` ou `autocomplete="current-password"`.
- **Autofill heurístico do Chrome** pode persistir em campos de endereço/cartão — limitação conhecida, fora do escopo.
- **Testes de snapshot/atributos** podem quebrar pela nova presença de `autocomplete="off"`: ajustar mantendo a intenção.
- Reversão simples: remover a regra do `InputBase` e os `autocomplete="off"` literais (sem dados/migrações).
- Não publicar, não fazer commit/merge/push (responsabilidade do MaxCode/usuário).

## 7. Retomada e registro de progresso

- Ler este plano e a spec na primeira admissão; nas retomadas, consultar só os trechos pertinentes.
- Antes de editar: `git status` e `git diff` na worktree para conferir trabalho já feito; revalidar o código atual (linhas podem ter mudado).
- Seguir as decisões da §3; não reabrir sem evidência nova ou mudança de requisito. Interromper e perguntar ao usuário se: algum componente exigir mudança de API além de `suggestions`, ou um teste existente só passar enfraquecendo a asserção.
- Falha repetida sem progresso exige diagnóstico de causa antes de nova execução; não corrigir baseline fora do escopo sem estabelecer causalidade e autorização.
- Registrar progresso em `docs/plans/wt-6f913c1e/execution-state.json` após marcos e no handoff (somente na fase Execute), vinculado ao SHA256 real do `plan.md`:
  - Raiz: `{ version: 2, planRevision, tasks, verification, updatedAt?, nextAction? }` — `version: 2` (nunca `schemaVersion`); `planRevision` = SHA256 do `plan.md`; `updatedAt` inteiro positivo em milissegundos; proibidos na raiz `worktree`, `branch`, `head`, `planPath`, `status` e `checks` solto.
  - Tarefa: `{ id, status, files, validations, revision?, nextAction? }` — `status` ∈ `pending | running | completed | blocked | manualPending | validationFailed`; `validations: []` sempre presente; proibidos `title` e `evidence`; `nextAction` até 512 caracteres (motivos de bloqueio vão aqui).
  - `verification`: `{ revision: <SHA256>, checks: [{ command, revision: <SHA256>, result, exitCode? }] }` — `result` ∈ `passed | failed | pending` (`blocked` não é resultado); `passed` exige `exitCode: 0`; `failed` exige inteiro ≠ 0; `pending` sem `exitCode`; proibido `exitCode: null`; `command` até 4.096 caracteres.
  - Proibidos campos extras (`blocker`, `diagnostic`, `branchSync`, `durableSync`, `followUp`). Revisions são hashes reais de conteúdo, nunca rótulos. Registrar apenas comandos realmente executados e todas as falhas; não inferir sucesso de `tool:end.ok`. Checks vazios ou falha vigente impedem declarar validação integral.
  - Tarefas sugeridas (ids): `t1-inputbase`, `t2-tipos`, `t3-repasse`, `t4-semanticos`, `t5-phonemail`, `t6-internos-authcard`, `t7-testes`, `t8-docs`, `t9-validacao`.
