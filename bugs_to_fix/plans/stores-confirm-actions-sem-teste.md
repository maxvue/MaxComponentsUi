# useConfirm.Store: as actions de accept/reject nunca são invocadas nos testes (60% de functions)

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/stores/useConfirm.Store.ts:22-31,50-60`; `tests/stores/useConfirmStore.test.ts`
- **Domínio:** stores-barrel

## Problema

A cobertura de **functions** da `useConfirm.Store` é de 60%. A causa é identificável lendo os dois arquivos: a store declara cinco funções, mas duas delas são os *callbacks* `action` embutidos nos defaults e nunca são chamados por teste algum.

Em `src/stores/useConfirm.Store.ts:22-31` os defaults trazem `action: () => {}` tanto em `rejectProps` quanto em `acceptProps`:

```ts
const rejectProps: Ref<ConfirmActionProps> = ref({ label: 'Não', icon: undefined, action: () => {} });
const acceptProps: Ref<ConfirmActionProps> = ref({ label: 'Sim', icon: undefined, action: () => {} });
```

`tests/stores/useConfirmStore.test.ts` verifica a *presença* dessas props (`:21-34`) e substitui `acceptProps` por um objeto com ação customizada em `:60-73`, mas **nenhum teste chama** `store.acceptProps.action()` ou `store.rejectProps.action()`. As no-op default e o contrato de invocação ficam sem cobertura.

Isso importa porque o contrato do `useConfirmStore` é justamente ser um canal entre quem abre o confirm (`MaxButtonConfirm`, `MaxIconConfirm`, `MaxTogglePopover`) e quem o renderiza (`MaxPopoverConfirm`): a única razão de `action` existir é ser executada pelo componente de popover ao clicar. Nada na suíte de store garante que a ação sobreviva ao ciclo `confirm()` → clique → `hide()`.

Adicionalmente, o default `action: () => {}` existe para que o renderizador possa invocar `action?.()` sem checagem — mas o tipo declara `action?:` opcional (`:5`), então um payload legítimo pode omiti-la e o renderizador **precisa** tolerar `undefined`. Não há teste que fixe esse caso.

## Impacto

Se alguém trocar `action: () => {}` por `action: undefined` nos defaults, ou se o `confirm()` deixar de propagar `acceptProps.action` do payload, o botão "Sim" do confirm deixaria de fazer efeito silenciosamente — sem erro, sem teste vermelho. É o pior modo de falha para um diálogo de confirmação (o usuário acha que confirmou uma exclusão e nada acontece — ou pior, o inverso).

## Plano de correção

Estender `tests/stores/useConfirmStore.test.ts` com um bloco `describe('actions')`:

1. Defaults são invocáveis e não lançam: `expect(() => store.acceptProps.action?.()).not.toThrow()` e o mesmo para `rejectProps` — cobre as duas funções faltantes.
2. `confirm()` preserva a ação do payload: passar `acceptProps: { label: 'Sim', action: spy }`, chamar `store.acceptProps.action?.()` e asseverar `spy` chamado uma vez.
3. A ação recebe o `event` repassado: `store.acceptProps.action?.(evento)` → `expect(spy).toHaveBeenCalledWith(evento)` (a assinatura em `:5` é `(event?: any) => void`).
4. Payload sem `action` não quebra o consumidor: `confirm({ ..., acceptProps: { label: 'Sim' } })` e então `expect(() => store.acceptProps.action?.()).not.toThrow()`.
5. Um segundo `confirm()` substitui integralmente a ação anterior — o primeiro spy não é mais chamado após o segundo `confirm()` (reforça a garantia de "não vaza estado entre instâncias" já testada para `messageIcon` em `:98`).
6. `hide()` não zera as props (é o comportamento atual: só `show` muda em `:40-42`); fixar isso por teste, pois o renderizador executa a ação e depois chama `hide()`.

## Verificação

```bash
npx vitest run tests/stores/useConfirmStore.test.ts
npm run test:coverage
```

Meta: `useConfirm.Store.ts` de 60% para 100% de functions.
