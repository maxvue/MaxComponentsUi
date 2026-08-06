# Relatório de bugs — `InputBase.vue` e seus consumidores

> Análise de 06/08/2026. Todos os itens marcados **[runtime]** foram confirmados em render real
> (Chromium/Playwright sobre o playground); os demais foram confirmados por análise estática
> (leitura do código + grep) e histórico do git.
>
> **Escopo:** `src/components/InputBase.vue` e os 22 componentes que o utilizam:
> MaxColorPicker, MaxInputAutoComplete(Api), MaxInputCep, MaxInputCoordinateDecimalLat/Lng,
> MaxInputCpfCnpj, MaxInputCreditCard(/Cvv/Date), MaxInputDatePicker, MaxInputIconPicker,
> MaxInputNumber, MaxInputPhoneMail, MaxInputSearch, MaxInputSelect, MaxInputSwitch,
> MaxInputText, MaxInputTextArea, MaxInputTextList, MaxPhoneField, MaxTagSelect.

---

## 🔴 Críticos

### 1. [runtime] Regra global `[disabled]` quebra botões desabilitados no app inteiro

`InputBase.vue:507` — o `<style>` **não é `scoped`** e contém:

```scss
.p-disabled, [disabled='true'], [disabled] {
    background-color: unset !important;
    ...
}
```

O seletor `[disabled]` casa com **qualquer elemento desabilitado da aplicação**, não só inputs.
Medido em runtime: `MaxButton disabled` fica com `background: rgba(0,0,0,0)` — o botão vira
texto solto sem fundo. Qualquer `<button disabled>`, PrimeVue ou não, é afetado.

**Solução planejada:** escopar a regra para dentro de `.max-input-main-div` (ela já está no
arquivo certo, só precisa ser aninhada). Se a intenção era estilizar inputs desabilitados,
o alvo correto é `.max-input-main-div input[disabled], .max-input-main-div .p-disabled`.

### 2. [runtime] Mensagens de erro/atenção/ajuda **nunca aparecem**

`InputBase.vue:446` — `.input-message { display: none; }` e **nenhuma regra em todo o `src/`
volta a exibi-la**. O commit `b86bd881` trocou o `<Message>` do PrimeVue por uma div própria
e perdeu o mecanismo de exibição na troca.

Consequência: as props `message`, `msg`, `iconMessage` e as mensagens de `error`/`caution`
em string ("Campo obrigatório", "Valor esperado: …") são calculadas, renderizadas no DOM…
e ficam invisíveis. Medido: `msg: "Campo obrigatório" display=none`.

Todos os 22 consumidores são afetados — a cadeia inteira de validação visual da lib
(ex.: `error_msg` do MaxInputText/Number/CpfCnpj/Cep/CreditCard*) não comunica nada ao usuário.

**Solução planejada:** exibir a mensagem quando houver conteúdo:
- No template: `v-if="displayMessage"` na div `.input-message` (em vez de sempre renderizar);
- No CSS: `display: flex` como padrão da classe (o `v-if` passa a controlar a existência);
- Rever `grid-template-rows: 36px 19px` (a linha de 19px comporta os 16px + 4px de padding? são 20px — ajustar para `36px 20px` ou `auto`).

### 3. [runtime] `{{ displayMessage }}` renderiza a string `"false"`

`InputBase.vue:144-150` — o computed retorna `false` quando não há mensagem, e o template
interpola direto: `<span class="message-text">{{ displayMessage }}</span>`. Medido no DOM:
`msg: "false"` em todos os inputs sem mensagem.

Hoje o bug é mascarado pelo item 2 (display:none). **Se o item 2 for corrigido sem este,
todos os inputs do sistema passam a exibir "false"** embaixo do campo.

**Solução planejada:** retornar `''` em vez de `false` no computed, e usar `v-if` no span.
Corrigir **junto** com o item 2, nunca separado.

---

## 🟠 Altos

### 4. [runtime] Estado de erro é quase invisível

Três causas somadas (medidas com `error="Campo obrigatório"`):

| Elemento | Esperado | Real | Causa |
|---|---|---|---|
| Outline do campo | vermelho | cinza `--background-300` | não existe regra `.error .max-input-field-div { outline-color: … }` (`InputBase.vue:200-212`) |
| Label | vermelho | cinza | a regra base `.max-input-label { color: var(--background-650) !important }` (linha 170) tem `!important`; a regra `.error .max-input-label` (linha 283) não tem — perde sempre |
| Mensagem | visível | invisível | item 2 |

O único feedback visível de erro é um ícone "!" de 0.8rem no canto. O mesmo vale para `.caution`.

**Solução planejada:**
- Adicionar `&.error .max-input-field-div { outline-color: var(--red-600) !important }` (e o equivalente `.caution`);
- Remover o `!important` da cor base do label (ou adicionar aos estados) — a ordem correta de precedência é estado > base;
- Depende do item 5 (variáveis).

### 5. Variáveis CSS de estado **não existem**

Usadas no `InputBase.vue` mas não definidas em lugar nenhum da lib (nem em `src/themes/`,
nem em `src/styles/`):

| Variável | Usos | Efeito real |
|---|---|---|
| `--max-red-600` | 5 (cores de erro) | declaração inválida → cor herdada |
| `--max-orange-500` | 1 (caution) | idem |
| `--max-surface-400` | 1 (cor da mensagem) | idem |

**Solução planejada:** trocar pelas variáveis que existem (`--red-600`, `--orange-600`,
`--background-400`) ou defini-las em `src/themes/colors.scss`. Auditar o restante da lib
por outras `--max-*` órfãs.

### 6. [runtime] Prop `caution` é ignorada em 5 componentes

`MaxInputText.vue:74` (e o mesmo padrão em **MaxInputNumber, MaxColorPicker,
MaxInputAutoComplete, MaxInputIconPicker**):

```ts
const caution = computed(() => (props.caution !== undefined
    ? props.caution && isDone.value === false
    : isDone.value === false));
```

`isDone` inicia como `null`, então `isDone.value === false` é falso e `caution="Atenção aqui"`
**não produz nenhum efeito** até o campo passar por um ciclo de validação que torne `isDone`
false. Medido: componente com `caution` string renderiza sem classe, sem ícone, sem cor.

**Solução planejada:** quando o consumidor **explicitou** caution, respeitar:
`props.caution !== undefined ? hasContent(props.caution) || props.caution === true : isDone.value === false`.

### 7. Vazamentos globais adicionais (não-scoped)

Fora do `.max-input-main-div`, valendo para o app inteiro (`InputBase.vue:498-519`):

```scss
.p-inputtext { height: 36px; … }          // TODO input PrimeVue do app vira 36px
.p-inputtext[disabled] { font-size: 12px; … }
.p-disabled, [disabled='true'], [disabled] { … }   // item 1
```

**Solução planejada:** aninhar tudo sob `.max-input-main-div`. Regra geral para o arquivo:
nenhum seletor no nível raiz que não comece com `.max-input-main-div` (exceção consciente e
comentada, se precisar existir).

---

## 🟡 Médios

### 8. Seletores-bomba que atingem todos os descendentes

Três blocos aplicam dimensões com `!important` a **todo** `div`/`span` descendente:

| Local | Seletor | Efeito |
|---|---|---|
| linha 378 | `&[slim], &[input-click] → div, span, input, … { height: 20px !important }` | achata qualquer estrutura interna |
| linha 331 | `[input-click] … .p-select-label { min/max-height: 10px !important }` | causa-raiz do bug da tag achatada (corrigido por contra-`!important` no MaxTagSelect) |
| linha 414 | `&.in-line → div, span, … { height: 100% !important }` | estica qualquer estrutura interna |

Esses seletores são a razão de os wrappers precisarem de contra-hacks (o `MaxTagSelect`
carrega três blocos de CSS só para se defender deles). Cada novo componente com filho
`div` herda o problema.

**Solução planejada (incremental, um modo por vez, com verificação visual):**
1. Trocar `div, span, …` por alvos explícitos (`.input-slot-div`, `> *`, classes conhecidas);
2. Reduzir `!important` onde a especificidade natural resolve;
3. Após cada etapa, validar os 22 consumidores no playground (checklist no fim).

### 9. `:input-click="false"` não desliga o modo compacto

O bloco da linha 305 tem o guard `&:not([input-click='false'])`, mas o bloco da linha 374
(`&[slim], &[input-click]`) **não tem** — `[input-click]` casa com o atributo mesmo com valor
`"false"`. Resultado: `:input-click="false"` ainda recebe `height: 20px` e fonte 0.8rem.

**Solução planejada:** replicar o guard `:not([input-click='false'])` no segundo bloco.

### 10. Classe `float` sempre ativa (casting booleano)

`InputBase.vue:2` — `props.float !== undefined ? 'float' : ''`. Com props tipadas, o Vue faz
casting booleano: prop ausente vira **`false`**, não `undefined` → a condição é sempre
verdadeira. Confirmado no DOM: todo input carrega a classe `float`.

Hoje é inerte (nenhum stylesheet define `.float`), mas é uma bomba armada: no dia em que
alguém estilizar `.float`, o estilo atinge todos os inputs.

**Solução planejada:** trocar por checagem truthy (`props.float ? 'float' : ''`) ou declarar
`default: undefined` no `withDefaults` se o "presente sem valor" precisa ser distinguido.

### 11. Props dos wrappers vazam como atributos DOM

Os wrappers que fazem `v-bind="{...props, ...attrs}"` (MaxTagSelect, MaxInputSelect) despejam
props não reconhecidas pelo InputBase como **atributos do DOM** — visto no DOM real:
`filter`, `hasremove`, `isbutton`, `backgroundcolor` no div raiz.

Risco concreto: o InputBase ativa modos por **seletor de atributo** (`[full]`, `[flex]`,
`[slim]`, `[small]`, `[transparent]`, `[no-message]`) e o UnoCSS attributify usa atributos
como utilitários (`flex` é utilitário attributify!). Uma prop ou utilitário com esses nomes
liga um modo de layout sem intenção.

**Solução planejada:** nos wrappers, bind explícito das props que o InputBase entende
(ou `inheritAttrs: false` + repasse seletivo). A longo prazo, migrar os modos de
atributo para props reais (`variant="slim"`).

---

## 🔵 Baixos

### 12. `message-spacer` é CSS morto
A classe é referenciada em **5 arquivos** (InputBase ×3, MaxGrid, MaxColorPicker, mais os
resets de MaxTable/MaxTableColumn/MaxTableFields) e **nunca é renderizada** por template
algum. Vestígio de estrutura antiga. **Solução:** remover todas as referências.

### 13. `caution` duplicado no template
`InputBase.vue:2` monta a string de classes com `${!noStatus && caution ? 'caution' : ''}`
**duas vezes**, e gera espaços duplos. **Solução:** usar objeto/array no `:class`
(`{ caution: …, error: …, float: … }`), que também elimina o item 10.

### 14. Prop `class` é código morto
`class` não chega como prop em Vue 3 (é merge automático no root). `props.class ? props.class : ''`
nunca contribui. **Solução:** remover a prop e o trecho.

### 15. `.max-input-label::before` usa `attr(data-content)` sem `data-content`
O template nunca define o atributo; o `content` resolve vazio e a faixa de 2px com
`background: var(--background-0)` fica sem função clara. **Solução:** definir
`:data-content="props.label"` ou remover o pseudo-elemento.

### 16. Cores de status hardcoded e inconsistentes
`.is-done { color: #16a34a }`, `.is-caution { color: #da422b }` (vermelho para *caution*,
divergindo do `color-orange-600` que o próprio template aplica no ícone). **Solução:** usar
as variáveis do tema.

### 17. `&[full], &[flex]` só estiliza `input`
Selects, textareas e estruturas próprias precisam de contra-regras em cada wrapper (o
MaxTagSelect precisou). **Solução:** cobrir `input, textarea, select, .p-select` no bloco.

### 18. `isError` inclui `done === false`
`InputBase.vue:142` — campo `required` vazio após blur entra **simultaneamente** em `error`
e `caution` (classes coexistem; `error` vence por ordem no CSS). Semântica surpreendente,
mas pode ser intencional. **Solução:** documentar ou separar os estados
(`done === false` → caution, não error).

---

## 🧩 Fora do InputBase, encontrados durante a análise

### 19. [runtime] `install()` não registra Pinia e o playground quebra
`MaxIcon` (usado pelos ícones de status do InputBase) chama `useIconStore()` na montagem.
O `install()` da lib não cria Pinia e o `playground/src/main.ts` também não → **qualquer
componente que renderize um MaxIcon derruba o playground** ("getActivePinia() was called but
there was no active Pinia"). Os testes não pegam porque o `tests/setup.ts` registra Pinia.
**Solução:** registrar Pinia no `install()` quando ausente (ou documentar como requisito e
corrigir o `main.ts` do playground).

### 20. Padrão `caution` replicado por copy-paste
O computed quebrado do item 6 existe idêntico em 5 componentes — sintoma de lógica de
validação duplicada. **Solução (médio prazo):** extrair um composable
(`useInputValidation`) com `isDone/caution/error_msg` e consumir nos wrappers.

---

## Plano de execução sugerido

Ordem pensada para não quebrar consumidores (cada fase em worktree, com validação visual
no playground antes do merge):

| Fase | Itens | Risco | Observação |
|---|---|---|---|
| 1 | 1, 7 (escopo das regras globais) | baixo | ganho imediato no app inteiro |
| 2 | 5 (variáveis) + 4 (cores de estado) | baixo | pré-requisito do 2 |
| 3 | 2 + 3 juntos (mensagens) | médio | mudança de layout: revalidar altura dos 22 |
| 4 | 6 (caution nos 5 componentes) | baixo | comportamento novo visível |
| 5 | 9, 10, 13, 14, 12, 15, 16 (limpeza) | baixo | mecânico |
| 6 | 8 + 17 (seletores-bomba) | **alto** | um modo por vez; remover os contra-hacks do MaxTagSelect ao final |
| 7 | 11, 18, 19, 20 (arquitetura) | médio | decisões de API — validar com o time |

**Checklist de validação por fase** (playground + Chromium):
inputs básicos, com ícones, estados done/error/caution/required, disabled,
modos `slim`/`input-click`/`in-line`/`flex`/`full`/`no-message`, MaxTagSelect com e sem cor,
MaxInputSelect com placeholder, dropdowns abertos, MaxButton normal/disabled.

---

## Evidências

- Runtime: playground servido por Vite + medições via Playwright/CDP (alturas, cores computadas,
  regras casadas por elemento).
- Histórico: `git log -L` para datar a regressão das mensagens (commit `b86bd881`).
- Estático: grep de definições/usos de variáveis, classes e seletores em todo o `src/`.
