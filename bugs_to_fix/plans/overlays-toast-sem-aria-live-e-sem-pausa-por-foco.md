# MaxToast: sem região `aria-live`, e o timer só pausa por hover (não por foco de teclado)

- **Categoria:** acessibilidade
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxToast.vue:2-9`, `src/components/MaxToast.vue:22-24`, `src/stores/useToast.Store.ts:103-122`
- **Domínio:** overlays-navegacao

## Problema

1. **Sem `aria-live`.** O `<TransitionGroup tag="div" class="max-toast-container">` (linha 2) não declara `role="status"`/`role="alert"` nem `aria-live`/`aria-atomic`. Toasts são inseridos dinamicamente no DOM e, sem uma região viva, **leitores de tela não anunciam nada**: a notificação é puramente visual.

2. **Severidade não é comunicada.** A severidade só se manifesta como classe CSS (`severity-${toast.severity}`, linha 5) e ícone (linha 12). Um toast de erro é indistinguível de um de sucesso para quem não vê a cor. Não há texto alternativo no ícone nem `role="alert"` para as severidades críticas.

3. **Pausa apenas por mouse.** `pause`/`resume` são acionados por `@mouseenter`/`@mouseleave` (linhas 7-8). Um usuário navegando por teclado que tabule até o botão "Fechar" (linha 22) não pausa o timer — o toast pode desaparecer sob seu foco antes que ele consiga lê-lo ou fechá-lo, um problema clássico de WCAG 2.2.1 (Timing Adjustable).

4. **Sem forma de dispensar por teclado além de alcançar o botão.** Não há atalho (ex.: Escape) e o container é `pointer-events: none` (linha 79) com os itens reativando eventos (linha 86) — correto para o mouse, mas nenhum tratamento equivalente para foco.

## Impacto

Toda a camada de notificação da aplicação é invisível para usuários de leitor de tela, e efêmera demais para usuários de teclado ou com deficiência motora. Notificações de erro em fluxos de formulário podem passar completamente despercebidas.

## Plano de correção

1. Adicionar no container (linha 2): `role="region"`, `aria-live="polite"`, `aria-atomic="false"` e um `aria-label="Notificações"`.
2. Para toasts de severidade `error` (e possivelmente `warning`), aplicar `role="alert"` no item individual (`:role="toast.severity === 'error' ? 'alert' : 'status'"`, linha 4), garantindo anúncio imediato.
3. Adicionar um texto acessível de severidade no item, por exemplo um `<span class="sr-only">` com "Erro:" / "Sucesso:" antes do título, ou `aria-label` no `.max-toast-icon`.
4. Adicionar `@focusin="toastStore.pause(toast.id)"` e `@focusout="toastStore.resume(toast.id)"` no item (linhas 7-8), espelhando o comportamento de hover. Não é preciso alterar a store — `pause`/`resume` já são idempotentes (`src/stores/useToast.Store.ts:105,118`).
5. Adicionar `aria-label` mais descritivo ao botão de fechar: `:aria-label="'Fechar notificação: ' + toast.title"` (linha 22).

## Verificação

- Teste em `tests/components/MaxToast.test.ts`: afirmar que o container tem `aria-live="polite"` e que um toast com `severity: 'error'` recebe `role="alert"`.
- Teste de pausa por foco: adicionar um toast, disparar `focusin` no item, avançar os timers além da duração e afirmar que o toast **continua** na store; disparar `focusout` e afirmar que ele é removido depois.
- Teste do `aria-label` do botão de fechar incluindo o título.
- `npx vitest run tests/components/MaxToast.test.ts`
