# MaxTableFields declara a prop buttonsWidth mas nunca a utiliza

- **Categoria:** divergência
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxTableFields.vue:126`, `src/components/MaxTableFields.vue:13`, `src/components/MaxTableFields.vue:75`
- **Domínio:** tabela-layout-exibicao

## Problema

A prop está declarada e documentada:

```ts
/** Largura da coluna de botões (ex: '120px') */
buttonsWidth?: string;
```

Mas a largura da coluna de ações é sempre calculada de forma fixa, ignorando-a — tanto no `<th>` (linha 13) quanto no `<td>` (linha 75):

```vue
:style="`width: ${size(props.buttons) * 32}px`"
```

Um consumidor que passe `buttons-width="120px"` não observa nenhum efeito, sem aviso algum. A heurística de 32px por botão também não considera o `btn.size` individual (linha 77, `:size="btn.size ?? 1.2"`), então botões maiores estouram a coluna.

## Impacto

- API pública enganosa: prop documentada sem efeito.
- Impossível ajustar a largura da coluna de ações quando a heurística de 32px/botão não serve (botões com label, ícones maiores, botões condicionais).

## Plano de correção

1. Aplicar a prop com precedência sobre a heurística, em um único computed reutilizado pelo `<th>` e pelo `<td>`:
   ```ts
   const actionsWidth = computed<string>(() => props.buttonsWidth
       ? getCssSize(props.buttonsWidth)
       : `${size(props.buttons) * 32}px`);
   ```
2. Substituir os dois `:style` inline pelo computed.
3. Alternativamente, se a prop for considerada morta, removê-la — mas isso é uma quebra de API pública e deve ser decidido explicitamente.

## Verificação

- Teste passando `buttonsWidth: '120px'` com dois botões, asserindo `width: 120px` no `<th>` e no `<td>` de ações.
- Teste sem a prop, asserindo o fallback `64px`.
- `npx vitest run tests/components/MaxTableFields.test.ts`.
