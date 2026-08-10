# MaxPopoverMenu: o guard `executing` é setado mesmo quando o item não tem `route` nem `action`, bloqueando o próximo clique por 200ms

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxPopoverMenu.vue:78-96`
- **Domínio:** overlays-navegacao

## Problema

```
const executing = useDefaultReset<boolean>(false, 200);

const onClick = (event: any, item: any) => {
    if (! executing.value) {
        executing.value = true;

        const data = item.data ?? item.props ?? item.params ?? item.query ?? {};

        if (item.route) {
            goToRoute(item.route, data);
            return;
        }

        if (item.action) {
            item.action({ event: event, data: data });
            return;
        }
    }
};
```

`executing.value = true` é atribuído **antes** de verificar se o item tem de fato algo a executar. Um item de menu puramente informativo ou separador (sem `route` e sem `action` — cenário real: `MaxUserSection` inclui um item `{ label: 'Versão: x' }` sem ação, `src/components/MaxUserSection.vue:130`) consome o guard de 200ms sem fazer nada.

Efeito: clicar em um item inerte e, em seguida, num item com ação dentro de 200ms faz o segundo clique ser **silenciosamente descartado**. O usuário clica e nada acontece.

Observações secundárias:

- O guard de 200ms é a única proteção contra duplo clique, mas não é resetado ao fechar o menu — o `useDefaultReset` reseta apenas por tempo.
- O `onClick` só é alcançado pelo caminho do template quando o item **não** tem `action` própria: o template chama `item.action ? item.action(...) : onClick(event, item)` (linha 12), então o ramo `if (item.action)` das linhas 91-94 é, na prática, **inalcançável pelo template** — só é atingível se `onClick` for chamado diretamente (como fazem os testes, `tests/components/MaxPopoverMenu.test.ts:80`). Código efetivamente morto no fluxo real, mantido vivo apenas pelo teste.

## Impacto

Cliques perdidos em menus com itens informativos — sintoma difícil de reproduzir de forma consistente ("às vezes o menu não faz nada"). O ramo inalcançável infla a cobertura de forma enganosa.

## Plano de correção

1. Mover a atribuição do guard para **depois** de determinar que há algo a executar:
   ```
   const onClick = (event: Event, item: MaxMenuItem) => {
       if (executing.value) return;

       const data = item.data ?? item.params ?? item.query ?? {};

       if (item.route) {
           executing.value = true;
           goToRoute(item.route, data);
           return;
       }

       if (item.action) {
           executing.value = true;
           item.action({ event, data });
       }
   };
   ```
2. Resolver a duplicação entre o template (linha 12) e o `onClick` (linhas 91-94): unificar num único caminho, fazendo o template sempre chamar `onClick(event, item)` e deixando o `onClick` decidir entre `route` e `action`. Isso elimina o ramo morto e faz o guard `executing` valer também para itens com `action` própria (que hoje **não passam** pelo guard — um duplo clique num item com `action` executa a ação duas vezes, o que é o bug oposto e provavelmente mais grave).
3. Aplicar a tipagem de `MaxMenuItem` proposta em `overlays-tipos-any-em-componentes-de-navegacao.md`.

## Verificação

- Teste em `tests/components/MaxPopoverMenu.test.ts`: clicar num item sem `route`/`action`, em seguida clicar num item com `action` (sem avançar timers) e afirmar que a `action` **foi** chamada.
- Teste de duplo clique com `action` própria: após a unificação do passo 2, dois cliques rápidos no mesmo item devem executar a ação **uma** vez (hoje executam duas).
- Ajustar o teste existente `tests/components/MaxPopoverMenu.test.ts:98` ("onClick bloqueia chamadas duplicadas") ao novo comportamento.
- `npx vitest run tests/components/MaxPopoverMenu.test.ts`
