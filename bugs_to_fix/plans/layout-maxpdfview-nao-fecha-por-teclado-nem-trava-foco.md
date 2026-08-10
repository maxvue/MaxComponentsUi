# MaxPdfView é um modal em tela cheia sem Escape, sem foco preso e sem papel

- **Categoria:** acessibilidade
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxPdfView.vue:2-33`, `src/components/MaxPdfView.vue:84-89`
- **Domínio:** tabela-layout-exibicao

## Problema

O componente renderiza um overlay `position: fixed` cobrindo toda a viewport (`.viewPDF`, linhas 101-115) com `backdrop-filter: blur(10px)`, ou seja, um diálogo modal de fato. Faltam todos os requisitos de um modal acessível:

1. **Sem fechamento por Escape.** As únicas formas de fechar são clicar nas áreas `.space` (linhas 4 e 26) ou no botão de fechar (linha 31). `Escape` não faz nada.
2. **Sem papel nem rótulo.** Não há `role="dialog"`, `aria-modal="true"` nem `aria-label` — leitores de tela não anunciam a abertura de um diálogo.
3. **Sem armadilha de foco.** O foco permanece no conteúdo por baixo do overlay. Um usuário de teclado continua tabulando pelos elementos da página oculta, invisíveis sob o blur.
4. **Sem restauração de foco.** Ao fechar, o foco não retorna ao elemento que abriu o visualizador.
5. **Divs clicáveis sem semântica.** Os dois `.space` (linhas 4 e 26) têm `@click` mas são `<div>` sem `role`, `tabindex` ou handler de teclado — mesmo problema catalogado em `MaxIconButton`.
6. **Sem bloqueio de scroll do body.** A página por baixo continua rolando.

Há ainda um defeito funcional relacionado ao ciclo de vida: `closePDF` (linhas 84-89) agenda um `setTimeout` de 500 ms que escreve em `is_open` **sem armazenar o handle nem cancelá-lo no unmount**. Se o componente for desmontado dentro dessa janela, o timer dispara sobre um componente morto. O mesmo vale para a abertura via `watch` (linhas 91-97), que não cancela um fechamento pendente — abrir um novo PDF dentro dos 500 ms de um fechamento faz o timer antigo fechá-lo logo em seguida.

## Impacto

- Violação de WCAG 2.1.2 (No Keyboard Trap, no sentido inverso), 2.4.3 (Focus Order) e 4.1.2 — nível A.
- Usuários de teclado ficam presos: não conseguem fechar o visualizador nem navegar por ele.
- Leitores de tela leem o conteúdo de fundo como se estivesse acessível.
- Timer órfão escrevendo estado após o unmount; reabertura rápida fecha sozinha.

## Plano de correção

1. Adicionar `role="dialog"`, `aria-modal="true"` e `aria-label="Visualizador de PDF"` ao container `.viewPDF`.
2. Registrar um listener de `keydown` para `Escape` enquanto `is_open` for verdadeiro, removendo-o em `onBeforeUnmount` e ao fechar.
3. Implementar armadilha de foco: mover o foco para o container ao abrir, ciclar o Tab entre os elementos focáveis do overlay, e restaurar o foco ao elemento anterior ao fechar.
4. Converter as áreas `.space` em elementos com semântica adequada, ou marcá-las `aria-hidden="true"` e deixar o fechamento a cargo do botão dedicado e do Escape.
5. Bloquear o scroll do `body` enquanto aberto, restaurando ao fechar.
6. Corrigir o ciclo de vida do timer:
   ```ts
   let close_timer: ReturnType<typeof setTimeout> | null = null;

   function closePDF(): void {
       opacity.value = 0;
       if (close_timer) clearTimeout(close_timer);
       close_timer = setTimeout(() => { is_open.value = false; close_timer = null; }, 500);
   }

   onBeforeUnmount(() => { if (close_timer) clearTimeout(close_timer); });
   ```
   e cancelar `close_timer` no `watch` de abertura.
7. Tipar `loaded(event: any)` e `progressPdf(event: any)` (linhas 74 e 79) com os tipos do `vue-pdf-embed`, conforme a convenção do projeto.

## Verificação

- Teste: abrir, disparar `keydown.escape`, avançar os timers e asserir o fechamento.
- Teste: asserir `role="dialog"` e `aria-modal` quando aberto.
- Teste: fechar e desmontar imediatamente, avançar os timers e asserir que nenhum warning de escrita pós-unmount ocorre.
- Teste: fechar e reabrir dentro de 500 ms, asserindo que permanece aberto.
- `npx vitest run tests/components/MaxPdfView.test.ts` (cobertura atual: 77,7% stmts / 53,8% functions).
