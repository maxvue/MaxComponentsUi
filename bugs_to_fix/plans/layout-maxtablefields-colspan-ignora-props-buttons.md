# MaxTableFields calcula o colspan do estado vazio ignorando props.buttons

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTableFields.vue:141`, `src/components/MaxTableFields.vue:144`, `src/components/MaxTableFields.vue:13`, `src/components/MaxTableFields.vue:85`
- **Domínio:** tabela-layout-exibicao

## Problema

A coluna extra de ações é renderizada quando `size(props.buttons) > 0` — tanto no cabeçalho (linha 13) quanto no corpo (linha 75). Já o `totalColspan`, usado pelo `<td>` do estado vazio (linha 85), depende de `hasButtons`, que verifica apenas a **existência do slot**:

```ts
const hasButtons = computed(() => !!slots['buttons']);              // linha 141
const totalColspan = computed(() => props.columns.length + (hasButtons.value ? 1 : 0)); // linha 144
```

São duas condições diferentes para a mesma coluna. Quando o consumidor usa a prop `buttons` (sem o slot `buttons`), o cabeçalho tem `columns.length + 1` colunas, mas o `colspan` do estado vazio vale apenas `columns.length` — a célula não cobre a tabela inteira.

O caminho inverso também existe: com apenas o slot `buttons` fornecido e `props.buttons` vazio, o `<th>` da linha 13 não é renderizado, mas o `totalColspan` conta a coluna extra.

## Impacto

- Estado vazio desalinhado (célula estreita demais ou larga demais), quebrando o layout da mensagem "Nenhum registro encontrado".
- Semântica de tabela incorreta para leitores de tela, que usam o `colspan` para entender a extensão da célula.

## Plano de correção

1. Unificar a condição da coluna de ações em um único computed:
   ```ts
   const hasActionsColumn = computed<boolean>(() => size(props.buttons) > 0 || !!slots['buttons']);
   ```
2. Usar `hasActionsColumn` nos três pontos: `<th>` (linha 13), `<td>` (linha 75) e `totalColspan` (linha 144).
3. Remover o `hasButtons` antigo ou redefini-lo em termos do novo.

## Verificação

- Teste com `list: []` + `buttons: [{...}]` (sem slot), asserindo `colspan === columns.length + 1`.
- Teste com `list: []` + slot `buttons` (sem prop), asserindo o mesmo.
- `npx vitest run tests/components/MaxTableFields.test.ts`.
