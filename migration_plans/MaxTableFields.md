# Plano de Migração — MaxTableFields

> Objetivo: tornar o componente `MaxTableFields` totalmente independente do PrimeVue,
> preservando API pública, estilos e comportamento. Este documento é autossuficiente:
> um agente futuro deve conseguir executar a migração lendo apenas este arquivo mais
> o código-fonte referenciado.

Diretório de trabalho: `/home/johnattas/GitHub/MaxComponentsUi`

---

## 1. Componente

- **Nome:** `MaxTableFields`
- **Arquivo-fonte:** `/home/johnattas/GitHub/MaxComponentsUi/src/components/MaxTableFields.vue`
- **Nível de migração:** média
- **Função:** Renderiza uma tabela editável dirigida por dados. Recebe uma `list`
  (array ou `Record`) e uma definição de `columns` (`MaxTableColumn[]`) e monta
  dinamicamente cabeçalho, linhas e células. Cada célula pode ser:
  - um slot customizado (`col.slot`),
  - um dos vários inputs Max (`col.input`: `text` / `input`, `number`, `select`,
    `date`, `checkbox`, `textarea`, `increment`, `phone-number`, `auto-complete`,
    `auto-complete-api`),
  - ou apenas o valor textual do campo.
  Possui coluna extra opcional de botões de ação (`props.buttons` ou slot `buttons`)
  e estado vazio (`empty`).

- **Ponto crucial:** o `MaxTableFields.vue` **NÃO importa nem usa PrimeVue diretamente**.
  Ele já é uma tabela HTML nativa (`<table>/<thead>/<tbody>/<tr>/<th>/<td>`) com CSS
  próprio. Portanto, do ponto de vista de código do arquivo, **não há nada de PrimeVue
  a remover neste componente**. O acoplamento ao PrimeVue é **indireto** (ver Seção 2)
  e a migração aqui é majoritariamente de **coerência / verificação**, não de reescrita.

---

## 2. Dependências do PrimeVue

**Nenhuma dependência direta.** `MaxTableFields.vue` não importa `primevue/datatable`,
`primevue/column` nem qualquer outro símbolo do PrimeVue.

O acoplamento é **indireto**, por dois vetores:

1. **Tipo compartilhado `MaxTableColumn`** (`src/types/index.ts`, linhas ~118-157).
   Esse mesmo tipo descreve as colunas usadas pela geração dinâmica em
   `MaxTableFields` e é o contrato conceitual das colunas de `MaxTable` /
   `MaxTableColumn`. Nada nele referencia PrimeVue hoje (o único import PrimeVue em
   `types/index.ts` é `PrimeButtonProps`, usado por `MaxButtonsType`, que também é
   consumido aqui — ver Seção 3).

2. **Componentes-irmãos `MaxTable` e `MaxTableColumn`** — estes SIM usam PrimeVue:
   - `src/components/MaxTable.vue` importa `primevue/datatable` (`DataTable`) e
     `primevue/column` (`Column`).
   - `src/components/MaxTableColumn.vue` importa `primevue/column` (`_Column`) e não
     renderiza template (é apenas placeholder de estilo/geração dinâmica de colunas
     do `DataTable`).

   `MaxTableFields` **não instancia** nenhum desses dois componentes. Ele reimplementa
   a mesma aparência visual de tabela por conta própria. O vínculo de migração é de
   **consistência de motor e estilos** entre `MaxTable` (novo motor) e a tabela
   nativa de `MaxTableFields`, além do tipo de coluna compartilhado.

> Conclusão: a migração de `MaxTableFields` é o **último** passo do conjunto de tabelas.
> Só faz sentido executá-la depois que `MaxTable` e `MaxTableColumn` já tiverem sido
> migrados, para alinhar contrato de colunas e classes de estilo (ver Seções 5, 6 e 10).

---

## 3. Dependências internas

### 3.1 Componentes Max (inputs e botões) — importados diretamente

Todos em `src/components/`:

| Import | Uso |
|--------|-----|
| `MaxInputText` | `col.input === 'text' | 'input'` e dentro do incremento |
| `MaxInputNumber` | `col.input === 'number'` |
| `MaxInputSelect` | `col.input === 'select'` |
| `MaxInputDatePicker` | `col.input === 'date'` |
| `MaxInputCheckbox` | `col.input === 'checkbox'` |
| `MaxInputTextArea` | `col.input === 'textarea'` |
| `MaxInputAutoComplete` | `col.input === 'auto-complete'` |
| `MaxInputAutoCompleteApi` | `col.input === 'auto-complete-api'` |
| `MaxPhoneField` | `col.input === 'phone-number'` |
| `MaxIconButton` | botões de incremento (`+`/`-`) e botões de ação da coluna |

> Estes componentes têm seus **próprios planos de migração** e serão migrados
> independentemente. `MaxTableFields` os consome apenas por seus contratos públicos
> (`modelValue` / `update:modelValue`, `options`, `route`, `data`, `placeholder`,
> `required`, `w-full`, `size`, `dark`, `i`, `v-bind="btn"`). **Não** dependa de
> nenhum detalhe interno PrimeVue desses filhos neste plano.

### 3.2 Helpers e composables

- `getCssSize` — `src/helpers/getCssSize.ts`. Função pura (não usa PrimeVue). Converte
  número ou string numérica em `Npx`, mantendo strings com unidade. Usada em
  `getColumnStyle` para `width`/`size`/`minWidth`/`maxWidth`. **Manter como está.**

- `@maxvue/max-use` (pacote irmão, fonte em `../MaxUse/src`):
  - `ulid` — gera id único; usado em `tableId = computed(() => props.id ?? ulid())`.
    Fonte: `../MaxUse/src/Helpers/Strings/random.ts` (reexporta lib `ulid`). Sem PrimeVue.
  - `size` — conta elementos de array/objeto; usado em `size(props.buttons) > 0` e no
    cálculo de fallback da largura da coluna de botões quando `buttonsWidth` não for informado. Fonte: `../MaxUse/src/Helpers/Iterables/size.ts`. Sem PrimeVue.
  - `refAutoReset` — cria ref que retorna ao valor inicial após um timeout; usado em
    `const action_click = refAutoReset(false, 100)` para debounce da emissão de
    `update:field`. Fonte: `../MaxUse/src/Composables` (reexportado em
    `../MaxUse/src/index.ts` linha 37). Sem PrimeVue.

  > **Estes três (`ulid`, `size`, `refAutoReset`) DEVEM ser mantidos exatamente como estão.**
  > São neutros a PrimeVue e fazem parte do comportamento observável. Não substituir.

### 3.3 Tipos

- `MaxTableColumn` — `src/types/index.ts`. Não referencia PrimeVue. Manter.
- `MaxButtonsType` — `src/types/index.ts` linha 15:
  `extends Omit<PrimeButtonProps, 'size' | 'iconPos'>`. **Este tipo estende
  `PrimeButtonProps`**, importado do PrimeVue. É o único elo de tipo com PrimeVue
  que chega a `MaxTableFields` (via prop `buttons`). Ver Seção 10 (Riscos): sua
  migração pertence ao plano de `types`/`MaxIconButton`, **não** a este componente,
  mas deve estar concluída antes para não vazar tipos PrimeVue.

---

## 4. API pública a preservar

### 4.1 Props (`defineProps` com `withDefaults`)

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `list` | `any[] | Record<string, any>` | `() => ({})` | Dados da tabela (array ou objeto) |
| `columns` | `MaxTableColumn[]` | `() => []` | Definição das colunas (geração dinâmica) |
| `headerButton` | `string?` | — | Texto do cabeçalho da coluna de ações |
| `id` | `string?` | — | Id da tabela (fallback `ulid()`) |
| `emptyMessage` | `string?` | `'Nenhum registro encontrado'` | Mensagem de estado vazio |
| `buttonsWidth` | `(string \| number)?` | — | Largura da coluna de botões (ex: '120px' ou 120). Prioritária sobre o cálculo dinâmico baseado em `buttons`. Se omitida e apenas o slot `#buttons` for utilizado, adota largura neutra (`width: auto`). |
| `buttons` | `MaxButtonsType[]?` | — | Lista de botões de ação por linha |

### 4.2 Emits

- `update:field` — payload `{ row: any; field: string; value: any; index?: number }`.
  Emitido em `setFieldValue` **após** o debounce de `refAutoReset` e **após**
  chamar `col.action?.(...)`.

### 4.3 `defineExpose`

- `{ tableId }` — computed exposto (usado por testes e por consumidores externos).

### 4.4 Slots

- `header-${col.field}` (scoped: `{ column }`) — cabeçalho customizado por coluna.
- `buttons-header` — cabeçalho da coluna de ações.
- `col.slot ?? col.field` (scoped: `{ data, value, index, field }`) — corpo customizado
  da célula quando `col.slot` está definido e `col.input` não.
- `buttons` (scoped: `{ data, index }`) — corpo da coluna de ações.
- `empty` — conteúdo do estado vazio.

### 4.5 Geração dinâmica de colunas (contrato central a preservar)

O coração do componente é o mapeamento **`MaxTableColumn` → célula renderizada**:

1. Para cada `col in columns`, cria-se um `<th>` (cabeçalho) e, por linha, um `<td>`.
2. Estilo da coluna via `getColumnStyle(col)` (width/size/minWidth/maxWidth/align/style).
3. Seleção do renderizador da célula por prioridade:
   - `col.slot && !col.input` → slot nomeado;
   - senão, cadeia de `v-else-if` sobre `col.input` escolhendo o input Max;
   - senão (fallback) → template vazio.
4. Leitura/escrita de valores com **notação de ponto** (`getFieldValue`/`setFieldValue`),
   suportando campos aninhados (ex.: `user.name`).
5. `resolveData(row, col.data)` resolve caminhos declarados em `data` (string ou objeto).
6. Incremento/decremento (`incrementValue`/`decrementValue`) para `input: 'increment'`.

> **TODO este comportamento é PrimeVue-agnóstico e deve permanecer idêntico.**
> A "geração dinâmica de colunas" aqui NÃO é a do `DataTable`/`Column` do PrimeVue;
> é a iteração própria sobre `columns`. Preservar bit a bit.

---

## 5. Estratégia de substituição

**Premissa:** `MaxTable` e `MaxTableColumn` JÁ foram migrados para o novo motor de
tabela (sem PrimeVue) antes de iniciar este plano.

Como `MaxTableFields.vue` não usa PrimeVue, a estratégia **não é reescrever o
componente**, e sim:

1. **Confirmar independência.** Verificar (grep) que o arquivo não introduziu nenhum
   import PrimeVue e que continua usando tabela HTML nativa. Se limpo, o núcleo já está
   migrado.

2. **Adaptar a geração dinâmica ao novo motor / contrato de colunas.** Após a migração
   de `MaxTable`, o tipo `MaxTableColumn` e/ou as convenções de coluna (nomes de campos,
   classes de estilo, formato de `data`/`options`) podem ter mudado. Alinhar
   `MaxTableFields` a esse contrato **atualizado**:
   - Se o novo motor de `MaxTable` renomear/expandir campos de `MaxTableColumn`,
     refletir isso nos usos em `getColumnStyle`, na cadeia de `v-else-if` e em
     `resolveData` — mantendo a semântica.
   - Manter os mesmos nomes de slots e o mesmo formato de payload de `update:field`.

3. **Alinhar classes/estilo com o novo `MaxTable`.** Hoje `MaxTable.vue` e
   `MaxTableColumn.vue` estilizam via seletores PrimeVue (`.p-datatable`, `.p-row-even`,
   etc.). `MaxTableFields` já usa classes próprias (`.max-table-fields-*`). Após a
   migração de `MaxTable` para classes próprias, **garantir consistência visual**
   (mesmas variáveis de tema, mesmo look de header/listras) entre as duas tabelas, sem
   necessariamente compartilhar CSS. Ver Seção 7.

4. **Neutralizar o tipo `MaxButtonsType`** quanto a PrimeVue: garantir que, após a
   migração de tipos, `buttons` não exija `PrimeButtonProps`. (Dependência externa a
   este componente — apenas verificar, não implementar aqui.)

5. **Preservar** `ulid`, `size`, `refAutoReset`, `getCssSize` e toda a lógica de
   leitura/escrita por notação de ponto exatamente como estão.

> Resumo: para este componente, "substituir PrimeVue" = **adaptar a geração dinâmica de
> colunas ao novo contrato/motor de `MaxTable`** e **alinhar estilos**, não trocar
> biblioteca de tabela (ela já é nativa).

---

## 6. Passos de implementação

> Convenções obrigatórias (CLAUDE.md): `<script setup lang="ts">`, indentação de 4
> espaços, aspas simples, ponto e vírgula, sem trailing comma, ordem
> Template → Script → Style. Não modificar código fora do necessário.

1. **Pré-condição (bloqueante):** confirmar que os planos de `MaxTableColumn` e
   `MaxTable` já foram executados e seus testes passam. Se não, **parar** — este é o
   último do conjunto (ver Seção 10).

2. **Auditar imports:** rodar
   `grep -n "primevue" src/components/MaxTableFields.vue`.
   Esperado: **nenhum resultado**. Se aparecer algo, remover conforme o input Max
   correspondente já migrado.

3. **Revisar o tipo `MaxTableColumn`** em `src/types/index.ts` após a migração de
   `MaxTable`. Listar quaisquer campos novos/renomeados. Ajustar em
   `MaxTableFields.vue`:
   - `getColumnStyle` (uso de `width`, `size`, `minWidth`, `maxWidth`, `align`, `style`);
   - cadeia `v-else-if` sobre `col.input` (garantir que todos os valores do union
     `input` continuam mapeados a um componente Max migrado);
   - `resolveData` (formato de `col.data`).
   Se nada mudou no contrato, **não alterar** — apenas registrar a verificação.

4. **Verificar cada input filho migrado:** para cada componente da tabela em 3.1,
   confirmar que a API pública consumida aqui (`v-model`/`update:modelValue`,
   `options`, `route`, `data`, `placeholder`, `required`, atributos utilitários
   `w-full`/`text-center`, e `MaxIconButton` com `i`/`size`/`dark`/`v-bind="btn"`)
   permaneceu estável pós-migração. Ajustar bindings apenas se algum contrato mudou.

5. **Alinhar estilos** com o novo `MaxTable` (Seção 7): garantir mesmas variáveis de
   tema e aparência de cabeçalho/listras/estado vazio. Não introduzir seletores
   `.p-*`.

6. **Preservar intocados:** `ulid`, `size`, `refAutoReset`, `getCssSize`,
   `getFieldValue`, `setFieldValue`, `incrementValue`, `decrementValue`, `resolveData`,
   `normalizedList`, `hasButtons`, `totalColspan`, `tableId`, `defineExpose`, todos os
   slots e o emit `update:field`. **Nenhuma mudança de comportamento.**

7. **Regenerar manifesto de resolver** apenas se algum arquivo `.vue` foi
   adicionado/renomeado (não é o caso esperado aqui):
   `npx tsx src/scripts/generateResolver.ts`.

8. **Rodar verificação** (Seção 8): type-check, lint e testes.

---

## 7. Estilos

- `MaxTableFields.vue` já possui `<style lang="scss">` com classes próprias
  `.max-table-fields-*` e **nenhum** seletor PrimeVue (`.p-datatable`, `.p-row-*`).
  Usa variáveis de tema Max: `var(--background-300)`, `var(--blue-800)`,
  `var(--blue-200)`, `var(--primary-25)`, `var(--primary-100)`, `var(--text-400)`.
  **Manter todo o bloco de estilo como está.**

- Regra a preservar por importar comportamento visual dos inputs dentro de célula:
  ```scss
  .max-table-fields-td {
      .max-input-main-div {
          grid-template-rows: 1fr;
          .message-spacer, .input-message { display: none; }
      }
  }
  ```
  Depende do markup interno dos inputs Max (`.max-input-main-div`, `.message-spacer`,
  `.input-message`). **Verificar após a migração dos inputs** que essas classes ainda
  existem; se algum input migrado renomear seu wrapper, atualizar o seletor aqui para
  manter as mensagens ocultas dentro da tabela.

- **Consistência com `MaxTable`:** `MaxTable.vue`/`MaxTableColumn.vue` hoje estilizam via
  seletores `.p-datatable ... th/td` com `!important`. Depois que `MaxTable` migrar para
  classes próprias, garanta que header (altura 40px, `var(--blue-800)` de fundo,
  `var(--blue-200)` de texto, fonte `Jost`), listras (`--primary-25`/`--primary-100`) e
  bordas (`--background-300`) fiquem **visualmente idênticos** entre as duas tabelas. Não
  é necessário compartilhar arquivo de estilo; basta paridade visual.

---

## 8. Testes / verificação

- **Suite existente:** `tests/components/MaxTableFields.test.ts` (10 casos). Cobre:
  montagem/headers, emissão de `update:field`, campos aninhados em
  `getFieldValue`/`setFieldValue`, `incrementValue`/`decrementValue`, `resolveData`
  (string/objeto/array/fallback), cálculo de estilo de coluna, `emptyMessage`,
  conversão de `Record` em lista, renderização de todos os `input` types e coluna de
  botões. O teste **mocka `@maxvue/max-use`** (`ulid`, `size`, `refAutoReset`,
  `getCssSize`) e stub-a os componentes filhos.

  > Essa suite é o contrato de regressão. **Deve continuar passando sem alterações.**
  > Se ela quebrar após a migração, é sinal de mudança de comportamento — reverter.

- Comandos (rodar da raiz do projeto):
  ```bash
  npx vitest run tests/components/MaxTableFields.test.ts   # suite alvo
  npm run type-check                                        # vue-tsc
  npm run lint                                              # ESLint + Stylelint
  npm run test                                              # suite completa (regressão do conjunto de tabelas)
  ```

- **Verificação manual (opcional):** `npm run dev:playground` e conferir visualmente:
  header, listras, inputs por tipo, incremento `+`/`-`, coluna de botões, estado vazio,
  e paridade visual com `MaxTable` migrado.

- **Checagem de independência:** `grep -rn "primevue" src/components/MaxTableFields.vue`
  deve retornar vazio ao final.

---

## 9. Skills necessárias

Skills relevantes (todos sob
`/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/`):

1. **`vue-3-dynamic-components-and-keep-alive-caching-best-practices/SKILL.md`**
   — Justificativa: o núcleo de `MaxTableFields` é **renderização dinâmica de células
   por tipo** (cadeia `v-else-if` sobre `col.input`). Ao adaptar a geração dinâmica ao
   novo motor, se for desejável trocar a longa cadeia por um mapa
   `input → componente` com `<component :is="...">`, este skill orienta o padrão
   correto (`shallowRef`/`markRaw` para as definições, tipagem forte do mapa). Base
   conceitual para manter a geração dinâmica de colunas performática e tipada.

2. **`vue-max-components-ui-development-best-practices/SKILL.md`**
   — Justificativa: convenções específicas do design system Max (uso de `InputBase`,
   variáveis de tema, padrões de `v-model` dos inputs Max, aliases de export). Garante
   que os bindings dos inputs filhos e os estilos permaneçam idiomáticos após a migração.

3. **`vue-3-dynamic-forms-schema-renderer-with-maxcomponentsui-best-practices/SKILL.md`**
   — Justificativa: `MaxTableFields` é essencialmente um **renderizador de formulário
   dirigido por schema** (`columns` como schema, cada `col.input` como campo). Este skill
   cobre exatamente o padrão de mapear definição declarativa → input, útil ao alinhar a
   geração dinâmica ao novo contrato de `MaxTableColumn`.

4. **`vue-unocss-styling-best-practices/SKILL.md`** (apoio)
   — Justificativa: o template usa classes utilitárias do preset UnoCSS custom
   (`w-full`, `text-center`). Referência para preservar/ajustar utilitárias sem quebrar
   o preset.

> Skills NÃO relevantes para este componente (ignorar): quaisquer `adonisjs-*`,
> `laravel-*`, `typescript-billing-*`, e skills de integrações específicas
> (charts, calendário, uploads, etc.).

---

## 10. Riscos e pontos de atenção

1. **Ordem de execução (bloqueante): este é o ÚLTIMO do conjunto de tabelas.**
   Depende de `MaxTableColumn` e `MaxTable` já migrados. Ordem recomendada:
   `MaxTableColumn` → `MaxTable` → **`MaxTableFields`**. Executar antes cria risco de
   alinhar a geração dinâmica a um contrato de coluna que ainda vai mudar.

2. **Ilusão de "nada a fazer".** Como o arquivo não usa PrimeVue, é tentador marcar como
   migrado sem tocá-lo. O trabalho real é de **adaptação ao novo contrato de
   `MaxTableColumn`/motor** e **paridade visual com o novo `MaxTable`**. Não pular a
   revisão do tipo e dos estilos.

3. **`MaxButtonsType extends Omit<PrimeButtonProps, ...>`** (`src/types/index.ts` linha 15).
   Enquanto esse tipo depender de `PrimeButtonProps`, a prop `buttons` ainda vaza tipos
   PrimeVue para os consumidores de `MaxTableFields`. A remoção pertence ao plano de
   `types`/`MaxIconButton`, mas **deve estar concluída** para o conjunto ser 100%
   independente. Registrar como dependência externa.

4. **Acoplamento de estilo ao markup dos inputs filhos.** O seletor
   `.max-table-fields-td .max-input-main-div .message-spacer/.input-message` assume os
   nomes de classe internos dos inputs Max. Se a migração de algum input renomear seu
   wrapper (`.max-input-main-div`) ou as classes de mensagem, as mensagens deixarão de
   ser ocultas dentro da tabela. Verificar pós-migração dos inputs.

5. **Não alterar comportamento observável.** `refAutoReset` implementa um debounce de
   100ms na emissão de `update:field` (evita emissões duplicadas em `setFieldValue`).
   Mudar isso quebra a suite e o comportamento. Preservar exatamente.

6. **`list` como `Record` vs array.** `normalizedList` converte objeto em array via
   `Object.values`. Manter — há teste dedicado ("converte object em list iterável").

7. **`getCssSize` e notação de ponto** são invariantes de comportamento com testes
   dedicados. Qualquer refatoração deve manter os resultados exatos verificados em
   `MaxTableFields.test.ts`.

8. **Se optar por `<component :is>` para os inputs:** usar `markRaw`/`shallowRef` nas
   definições (ver skill 1). Porém, dado que a cadeia `v-else-if` atual já é
   PrimeVue-agnóstica e coberta por testes, **essa refatoração é opcional** e só deve
   ser feita se trouxer ganho claro; caso contrário, manter a cadeia para minimizar
   risco de regressão.
