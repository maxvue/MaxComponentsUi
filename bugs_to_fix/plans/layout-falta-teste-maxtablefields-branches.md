# MaxTableFields: ramos de estado vazio, slots e ações sem cobertura

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `tests/components/MaxTableFields.test.ts`, `src/components/MaxTableFields.vue`
- **Domínio:** tabela-layout-exibicao

## Problema

A suíte tem 12 testes e boa cobertura das funções puras (`getFieldValue`, `setFieldValue`, `resolveData`, `getColumnStyle`), mas a cobertura de branches está em 87,8% e a de funções em 87,5%. Os ramos descobertos concentram-se exatamente onde estão os defeitos catalogados nos demais planos deste domínio:

1. **Guard `action_click` (linhas 176-181).** Nenhum teste dispara duas alterações em sequência imediata. O ramo `if (action_click.value) return` — que descarta emissões — nunca é exercitado. O teste da linha 39 ("deve emitir update:field ao alterar um input") faz **uma única** alteração.

2. **Fallback do slot customizado (linhas 29-33).** Nenhum teste declara `col.slot` **sem** fornecer o slot correspondente, que é o caminho que renderiza os metadados de depuração na célula.

3. **Ramo `v-else` sem input (linhas 69-71).** Colunas sem `slot` e sem `input` renderizam célula vazia; nenhum teste verifica esse caso.

4. **`totalColspan` com `props.buttons` (linha 144).** O teste de estado vazio (linha 148) não combina `list: []` com `buttons: [...]`, que é o caso em que o colspan diverge do número real de colunas.

5. **`col.action` (linha 179).** A prop `action` de coluna (`src/types/index.ts:219`) nunca é fornecida em nenhum teste — o callback jamais é invocado na suíte.

6. **Estabilidade de linha.** Nenhum teste remove ou reordena linhas, que é onde o `:key="index"` (linha 24) corrompe o estado dos inputs.

7. **`hasButtons` via slot (linha 141).** O teste da linha 199 usa `props.buttons`; o caminho do **slot** `buttons` não é coberto.

## Impacto

- Os ramos não cobertos são precisamente os que contêm os defeitos de severidade crítica e alta deste domínio (`layout-maxtablefields-debounce-global-perde-edicoes.md`, `layout-maxtablefields-key-por-index.md`, `layout-maxtablefields-colspan-ignora-props-buttons.md`).
- A suíte verde dá falsa confiança para a migração do PrimeVue, na qual este componente muda em conjunto com `MaxTable` e `MaxTableColumn`.

## Plano de correção

1. Adicionar teste de **duas alterações consecutivas** em campos distintos, asserindo duas emissões de `update:field`.
2. Adicionar teste com `col.action` definido, asserindo a invocação do callback com `{ row, field, value }`.
3. Adicionar teste com `col.slot` apontando para um slot inexistente, asserindo o conteúdo da célula.
4. Adicionar teste com coluna sem `slot` e sem `input`, asserindo que o valor é exibido.
5. Adicionar teste de estado vazio combinado com `buttons`, asserindo o `colspan`.
6. Adicionar teste de remoção de linha do meio com inputs preenchidos, asserindo a correspondência valor↔registro.
7. Adicionar teste do slot `buttons` (em vez da prop).

## Verificação

- `npx vitest run tests/components/MaxTableFields.test.ts`.
- `npm run test:coverage` — branches e funções de `MaxTableFields.vue` acima de 95%.
- Os testes 1, 3, 5 e 6 devem **falhar** contra o código atual, confirmando que capturam os defeitos correspondentes.
