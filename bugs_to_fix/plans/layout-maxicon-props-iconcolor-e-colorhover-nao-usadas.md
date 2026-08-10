# MaxIcon declara as props iconColor e colorHover sem nunca lê-las

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxIcon.vue:59`, `src/components/MaxIcon.vue:61`, `src/components/MaxIcon.vue:86-119`
- **Domínio:** tabela-layout-exibicao

## Problema

Duas props são declaradas na interface:

```ts
color?: string;
iconColor?: string;      // linha 59 — nunca lida
/** Icone de adição */
colorHover?: string;     // linha 61 — nunca lida
```

`grep -n "iconColor\|colorHover" src/components/MaxIcon.vue` retorna **apenas** as duas linhas de declaração. Os computeds `color` (linhas 86-98) e `hover_color` (linhas 100-119) leem `props.color` e `props.hoverColor`, mas nunca `props.iconColor` nem `props.colorHover`.

O impacto é concreto e já está em produção: `MaxButton.vue:7` passa `:color="iconColor"` ao `MaxIcon` — esse funciona, pois usa `color`. Mas qualquer consumidor que siga a nomenclatura alternativa exposta pela interface (`icon-color`, `color-hover`) não obtém efeito algum. `colorHover` é particularmente enganoso por conviver com `hoverColor` (linha 63), que **é** lida — duas props quase homônimas, uma funcional e outra morta.

Os comentários JSDoc das linhas 58 e 60 (`/** Icone de adição */`) foram copiados da prop `plus` e descrevem a coisa errada, o que sugere que as declarações foram adicionadas por copiar/colar sem implementação.

## Impacto

- API pública enganosa: props documentadas via tipo que não fazem nada.
- Falha silenciosa — nenhum erro de tipo, nenhum warning, apenas a cor ignorada.
- Confusão entre `colorHover` (morta) e `hoverColor` (viva).

## Plano de correção

1. Decidir o contrato. A biblioteca já adota o padrão de aliases múltiplos (`icon`/`i`, `size`/`scale`), então o caminho coerente é **implementar** os aliases:
   ```ts
   const color = computed<string>(() => {
       if (props.color ?? props.iconColor) return (props.color ?? props.iconColor) as string;
       ...
   });

   const hover_color = computed<string>(() => {
       ...
       const explicit = props.hoverColor ?? props.colorHover;
       if (explicit) return explicit;
       ...
   });
   ```
2. Corrigir os comentários JSDoc das linhas 58 e 60, que hoje dizem "Icone de adição".
3. Se a decisão for remover as props em vez de implementá-las, tratar como quebra de API pública e registrar no CHANGELOG.

## Verificação

- Teste passando `iconColor: 'red'` e asserindo `color: red` no style do elemento.
- Teste passando `colorHover: 'blue'` com `pointer`, asserindo a cor de hover.
- `npx vitest run tests/components/MaxIcon.test.ts` e `npm run type-check`.
