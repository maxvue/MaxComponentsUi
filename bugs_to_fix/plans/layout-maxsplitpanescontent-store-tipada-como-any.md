# MaxSplitPanesContent tipa a store como any e escreve nela sem debounce durante o arrasto

- **Categoria:** performance
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxSplitPanesContent.vue:40`, `src/components/MaxSplitPanesContent.vue:46-48`, `src/components/MaxSplitPanesContent.vue:53-55`
- **Domínio:** tabela-layout-exibicao

## Problema

Dois pontos de escrita em store disparados por eventos de alta frequência, sem qualquer amortecimento:

1. **`onResize` (linhas 46-48).** O `@resize` do `splitpanes` dispara continuamente durante o arrasto do divisor — tipicamente a cada frame. Cada disparo escreve `system.split_panel`, uma propriedade de store Pinia. Como a store é reativa e possivelmente persistida (o padrão `@maxvue/max-pinia` usado no projeto sincroniza stores com `localStorage`/IndexedDB), isso significa dezenas de escritas por segundo, cada uma potencialmente disparando serialização e persistência.

2. **`watch` de dimensões (linhas 53-55).** O `useElementSize` emite a cada mudança de tamanho observada pelo `ResizeObserver`; o watcher escreve `system.content_page_size` a cada emissão. Durante um redimensionamento de janela ou o arrasto do divisor, o mesmo padrão de escrita em rajada se repete.

O guard `if (h > 0 || w > 0)` (linha 54) filtra apenas o caso degenerado de dimensão zero — não reduz a frequência.

Terceiro ponto, de tipagem: `const system: any = useSystemStore();` (linha 40) descarta o tipo da store. O projeto tem uma regra explícita de não usar `any` (skill `typescript-best-practices`), e aqui o `any` desativa a verificação sobre `split_panel` e `content_page_size` — se a store renomear qualquer um dos dois, o erro só aparece em runtime. O mesmo `any` aparece em `onResize(event: any)` (linha 46), onde o tipo do evento do `splitpanes` (`{ prevPane: { size: number } }`) é conhecido e simples de declarar.

## Impacto

- Escritas em rajada na store durante arrasto/redimensionamento, com possível persistência em cada uma — jank perceptível e I/O desnecessário.
- Perda de segurança de tipos sobre duas propriedades de store usadas em toda a aplicação.

## Plano de correção

1. Remover o `any` da store: `const system = useSystemStore();` — o tipo é inferido do `defineStore`. Se faltarem propriedades no tipo, corrigir a store em vez de mascarar com `any`.
2. Tipar o evento de resize:
   ```ts
   interface SplitpanesResizeEvent { prevPane: { size: number } }
   const onResize = (event: SplitpanesResizeEvent): void => { system.split_panel = event.prevPane.size; };
   ```
3. Amortecer as escritas de alta frequência. `@maxvue/max-use` já é dependência e expõe utilitários de debounce; aplicar em ambos os pontos:
   - `onResize`: debounce de ~100 ms, ou escrever apenas no evento `@resized` (fim do arrasto) se o `splitpanes` o expuser, mantendo o valor local durante o movimento.
   - Watcher de dimensões: debounce de ~150 ms.
4. Confirmar se `system.split_panel` é persistido; se for, o debounce é obrigatório e não apenas otimização.

## Verificação

- Teste com timers falsos: disparar `onResize` 10 vezes em sequência e asserir uma única escrita na store após o debounce.
- Teste asserindo que o valor final escrito corresponde ao último evento.
- `npx vitest run tests/components/MaxSplitPanesContent.test.ts` (8 testes existentes) e `npm run type-check`.
