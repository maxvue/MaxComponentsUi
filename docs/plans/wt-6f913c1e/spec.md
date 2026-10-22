# Especificação Técnica — Desabilitar sugestões de preenchimento do navegador e prop `suggestions`

- **Projeto**: `@maxvue/max-components-ui`
- **Worktree**: `wt-6f913c1e` (`/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-6f913c1e`, branch `wt-6f913c1e`, base `dev`)
- **Data**: 2026-10-22

---

## 1. Contexto & Objetivo

Ao digitar nos campos da biblioteca, o Chrome (e outros navegadores) abre a lista de "valores digitados anteriormente" (histórico de autocomplete) sobre o campo — na captura enviada, um campo "Qtd" mostra o balão `24` cobrindo a linha de baixo da tabela. Isso atrapalha formulários densos (tabelas de equipamentos, quantidades, valores).

Hoje **nenhum** campo baseado em `InputBase` define `autocomplete` por padrão, exceto casos isolados (`MaxChips`, `MaxInputCredential`, `MaxInputAutoComplete*` = `off`; `MaxInputEmail` = `email`, `MaxInputUrl` = `url`, `MaxInputPassword` = `current-password`, `MaxInputSlug` = indefinido; `MaxInputOTP` = `one-time-code` na 1ª casa).

**Objetivo**:
1. Por padrão, todos os campos de texto da biblioteca renderizam `autocomplete="off"` no elemento nativo.
2. Nova prop booleana `suggestions` (em todos os inputs): quando presente/`true`, o campo volta a permitir as sugestões do navegador.

## 2. Escopo

### Dentro do escopo
- `InputBase`: nova prop `suggestions?: boolean` (padrão `false`) e cálculo de `autocomplete` em `inputAttrs` (fonte única para todos os inputs que fazem `v-bind="inputAttrs"`).
- Propagação de `suggestions` nos componentes que **não** repassam `$attrs` ao `InputBase` (`inheritAttrs: false` com props selecionadas): `MaxBaseQuantity` (+ 7 numéricos semânticos via `BaseQuantityProps`), `MaxInputMonthDays`, `MaxInputDiscount`.
- Inputs semânticos com `autocomplete` próprio (`MaxInputEmail`, `MaxInputUrl`, `MaxInputPassword`, `MaxInputSlug`): token semântico só quando `suggestions`; caso contrário `off`; prop `autocomplete` explícita continua tendo prioridade.
- Inputs nativos secundários dentro de componentes com `InputBase` (2ª/3ª caixa de `MaxInputRG`, caixa "Fim" de `MaxInputDateRange`): seguir o mesmo valor do campo principal.
- Inputs internos de busca/filtro/edição (sem prop `suggestions`): sempre `autocomplete="off"` — filtros de `MaxInputSelect`, `MaxInputMultiSelect`, `MaxTagSelect`, `MaxListBox`, `MaxInputIconPicker`, `MaxInputPhone` (busca de país), `MaxTable` (2), `MaxMaps` (2), `MaxInputMarkdownToolbar` (3), `MaxInputHtmlToolbar` (2), `textarea` do `MaxToast`, primitivo `MaxBaseInput`.
- `MaxChips`: trocar `autocomplete="off"` fixo pelo valor vindo de `inputAttrs` (passa a respeitar `suggestions`).
- `MaxAuthCard`: passar `suggestions` aos campos de login (identificador, e-mail, senha, telefone) para **preservar** o preenchimento de usuário/senha salvo que existe hoje.
- Tipos (`src/types/semanticInputs.ts`), documentação (`COMPONENTS.md`, `docs/INPUTS-SEMANTICOS.md`) e testes.

### Fora de escopo
- `MaxInputCredential` (tokens/chaves de API): permanece **sempre** `off`, mesmo com `suggestions` — evita sugerir segredos.
- `MaxInputAutoComplete` / `MaxInputAutoCompleteApi`: já usam `inputAttrs?.autocomplete ?? 'off'`; o dropdown próprio conflitaria com o nativo. Continuam `off` (com `suggestions` o `inputAttrs.autocomplete` fica ausente e o `?? 'off'` mantém `off`). Sem alteração de código.
- `MaxInputOTP`: mantém o contrato documentado `one-time-code` na 1ª casa (preenchimento do código recebido por SMS, não é histórico) e `off` nas demais. Sem alteração.
- Editores ricos (`MaxInputCode`, `MaxInputHtml`, `MaxInputMarkdown` — conteúdo editável), checkboxes, radios, file, color, range.
- Garantir que o Chrome nunca ofereça **autofill de endereço/cartão** por heurística: `autocomplete="off"` remove o histórico (caso da captura), mas o Chrome pode ignorar `off` em alguns campos que ele classifica como endereço/cartão. Limitação do navegador, não da biblioteca.
- Itens da notificação `max-components-ui-arquivos-espurios-versionados.md`.

## 3. Arquitetura & Mudanças Técnicas

### 3.1. Regra de resolução (contrato público)

Precedência no elemento nativo principal de cada input:

1. Atributo/prop `autocomplete` explícito do consumidor → usado como está (inclusive `"on"`).
2. `suggestions` verdadeiro → **sem** atributo `autocomplete` (comportamento padrão do navegador), ou o token semântico do componente (`email`, `url`, `current-password`) nos inputs semânticos.
3. Caso contrário → `autocomplete="off"`.

`suggestions` é booleana: `<MaxInputText suggestions />` e `:suggestions="true"` habilitam; ausente ou `false` desabilita.

### 3.2. `InputBase` (`src/components/InputBase.vue`)

- `Props`: adicionar `/** Habilita as sugestões de preenchimento automático do navegador (desabilitadas por padrão) */ suggestions?: boolean;` e `suggestions: false` em `withDefaults`.
- `inputAttrs`: depois de montar `base` e antes do laço que remove `undefined`:
  ```ts
  if (base.autocomplete === undefined && !props.suggestions) base.autocomplete = 'off';
  ```
  (`base.autocomplete` já vem de `controlAttrsFromAttrs` quando o consumidor passa `autocomplete`.)
- Como `suggestions` passa a ser prop declarada, não vaza para `rootAttrs` nem para `inputAttrs`.

### 3.3. Componentes que filtram props (precisam declarar e repassar)

| Arquivo | Mudança |
|---|---|
| `src/components/base/MaxBaseQuantity.vue` | `suggestions?: boolean` em `Props`; incluir `suggestions: props.suggestions` em `forwardProps`. |
| `src/types/semanticInputs.ts` → `BaseQuantityProps` | `suggestions?: boolean` (cobre Percent, Power, Current, Voltage, Distance, Duration, TokenLimit, que fazem `v-bind="props"` no `MaxBaseQuantity`). Conferir que `MaxInputVoltage` (ramo select via `selectForwardProps`) não quebra — select não tem caixa de texto, ignorar. |
| `src/types/semanticInputs.ts` → `MaxInputMonthDaysProps` + `src/components/MaxInputMonthDays.vue` | Declarar e incluir em `forwardProps`. |
| `src/components/MaxInputDiscount.vue` | Declarar prop e passar `:suggestions="props.suggestions"` ao `<InputBase>` (tag de abertura em linha única ao tocá-la é opcional; não reformatar o resto). |
| `src/types/semanticInputs.ts` → `SemanticTextBaseProps` | `suggestions?: boolean`. |
| `MaxInputEmail.vue`, `MaxInputUrl.vue`, `MaxInputPassword.vue`, `MaxInputSlug.vue` | Remover o default de `autocomplete` em `withDefaults` (deixar `undefined`); criar `resolvedAutocomplete = computed(() => props.autocomplete ?? (props.suggestions ? '<token>' : 'off'))` com token `email` / `url` / `current-password` / `undefined` (Slug); trocar `:autocomplete="props.autocomplete"` por `:autocomplete="resolvedAutocomplete"`; passar `:suggestions="props.suggestions"` ao `InputBase`. |
| `src/components/MaxInputPhoneMail.vue` | Faz `v-bind="{ ...inputAttrs, ...attrs }"`: garantir que `suggestions` não chegue ao `<input>` como atributo HTML (remover `suggestions` do objeto `attrs` espalhado). Investigar se o `attrs` espalhado também contém `autocomplete` — se sim, mantém a precedência do consumidor. |

Componentes que já repassam `$attrs`/`attrs` ao `InputBase` (ex.: `MaxInputText` `{...props, ...attrs}`, `MaxInputNumber`, `MaxInputCep`, `MaxInputCpfCnpj`, `MaxInputMoney`, `MaxInputPhone`, `MaxInputSearch`, `MaxInputTextArea`, `MaxInputTextList`, `MaxInputDatePicker`, `MaxInputCoordinateDecimal*`, `MaxInputCredential`, `MaxInputSocialHandle`, `MaxInputDateRange`, `MaxInputRG`, `MaxInputDateTimeLocal`, `MaxChips`, `MaxColorPicker`, `MaxInputIconPicker`) recebem `suggestions` por fallthrough sem declarar. O executor deve **confirmar por teste** (seção 5) em vez de assumir.

### 3.4. Inputs secundários e internos

- `MaxInputRG.vue` (linhas 8 e 12, órgão emissor e UF) e `MaxInputDateRange.vue` (linha 7, "Fim"): adicionar `:autocomplete="inputAttrs.autocomplete"` (valor `off` ou ausente, igual ao principal). Usar o nome real da variável do slot já disponível no template.
- Inputs internos — adicionar `autocomplete="off"` literal na tag de abertura: `MaxInputSelect.vue:70`, `MaxInputMultiSelect.vue:45`, `MaxTagSelect.vue:71`, `MaxListBox.vue:10`, `MaxInputIconPicker.vue:63`, `MaxInputPhone.vue:51`, `MaxTable.vue:163` e `:424`, `MaxMaps.vue:28` e `:40`, `MaxInputMarkdownToolbar.vue:204`, `:261`, `:294`, `MaxInputHtmlToolbar.vue:258`, `:315`, `MaxToast.vue:78`, `base/MaxBaseInput.vue:2` (este tem `inheritAttrs: true`, então um `autocomplete` vindo do consumidor sobrescreve).
- `MaxChips.vue:58`: remover `autocomplete="off"` fixo (o valor passa a vir de `inputAttrs`).

### 3.5. `MaxAuthCard.vue`

Adicionar o atributo `suggestions` em `MaxInputPhoneMail` (l.16), `MaxInputText` type email (l.24) e type password (l.35), `MaxInputPhone` (l.77). **Não** em `MaxInputOTP` (sem efeito). Objetivo: manter o comportamento atual do login.

### 3.6. Fluxo

```
Consumidor ──(suggestions / autocomplete)──▶ Wrapper (MaxInputX)
     │ fallthrough $attrs ou prop declarada + repasse
     ▼
InputBase.props.suggestions + attrs.autocomplete
     ▼
inputAttrs.autocomplete = attrs.autocomplete ?? (suggestions ? <ausente> : 'off')
     ▼
<input v-bind="inputAttrs"> (semânticos sobrescrevem com resolvedAutocomplete)
```

## 4. Plano de Execução Faseado

1. `InputBase`: prop + regra em `inputAttrs`.
2. Tipos em `semanticInputs.ts` (`SemanticTextBaseProps`, `BaseQuantityProps`, `MaxInputMonthDaysProps`).
3. Repasse em `MaxBaseQuantity`, `MaxInputMonthDays`, `MaxInputDiscount`.
4. Semânticos de texto (Email, Url, Password, Slug).
5. `MaxInputPhoneMail` (não vazar `suggestions`).
6. Inputs secundários (RG, DateRange) e internos (`autocomplete="off"`), `MaxChips`.
7. `MaxAuthCard` com `suggestions`.
8. Testes novos/ajustados.
9. Documentação.
10. Validação em lote (seção 5).

## 5. Critérios de Aceite & Validação

- `mount(MaxInputText)` → `input[autocomplete="off"]`; com `suggestions: true` → sem atributo `autocomplete`; com `attrs: { autocomplete: 'name' }` → `name` (com ou sem `suggestions`).
- Mesmo trio de asserções, por amostragem, em `MaxInputNumber`, `MaxInputMoney`, `MaxInputCep`, `MaxInputPhone`, `MaxInputTextArea`, `MaxInputPower` (via `MaxBaseQuantity`), `MaxInputMonthDays`, `MaxInputDiscount`, `MaxInputRG` (3 caixas), `MaxInputDateRange` (2 caixas), `MaxChips`.
- `MaxInputEmail`: padrão `off`; `suggestions` → `email`; `autocomplete: 'username'` → `username` (teste existente em `tests/components/MaxInputEmail.test.ts` continua verde). Idem Url (`url`), Password (`current-password`), Slug (ausente).
- `MaxInputCredential` permanece `off` com `suggestions`; `MaxInputAutoComplete(Api)` permanece `off` com `suggestions`; `MaxInputOTP` mantém `one-time-code` na 1ª casa.
- Nenhum `<input>` recebe atributo HTML `suggestions` (asserção `attributes('suggestions')` indefinido; em especial `MaxInputPhoneMail`).
- Teste de arquitetura estático: todo `<input>`/`<textarea>` de texto em `src/components/**/*.vue` tem `v-bind` de `inputAttrs` **ou** `autocomplete`/`:autocomplete` na tag (exceções: `type` checkbox/radio/file/color/range/hidden).
- Comandos (identificados em `package.json`/`CLAUDE.md`): `npm run lint`, `npm run type-check`, `npm run type-check:test`, `npm run test`, `npm run build`. `npm run verify` apenas se o usuário pedir o gate de release.
- Manual (playground `npm run dev:playground`, Chrome): digitar e enviar valores num campo, recarregar e focar — nenhuma lista de histórico aparece; com `suggestions`, a lista aparece.
