# MaxIconButton faz early-return antes de resetar o guard de execução

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxIconButton.vue:29-47`
- **Domínio:** tabela-layout-exibicao

## Problema

```ts
const executing = useDefaultReset<boolean>(false, 200);

const onClick = (event: any) => {
    if (! executing.value) {
        executing.value = true;

        if (props.route) {
            goToRoute(props.route, data.value);
            return;                              // <- sai com executing = true
        }

        if (props.action) {
            props.action({ event: event, data: data.value });
            return;                              // <- sai com executing = true
        }

        emit('action', true);
    }
};
```

O guard `executing` depende exclusivamente do auto-reset temporal de `useDefaultReset` (200 ms). Dois problemas decorrem disso:

1. **A janela é fixa e cega à operação.** Se `props.action` for assíncrona e demorar mais de 200 ms (o caso comum: uma requisição HTTP), o guard libera antes da conclusão e o usuário consegue disparar a ação novamente — exatamente o duplo-envio que o guard pretendia impedir. O componente não tem como saber que a ação terminou porque não aguarda o retorno.

2. **Ações rápidas e legítimas são bloqueadas.** No sentido oposto, cliques deliberados em menos de 200 ms (ex.: incrementar uma quantidade repetidamente) são silenciosamente descartados — sem feedback algum ao usuário.

Note o contraste com `MaxButton.vue:44-56`, que implementa o mesmo `onClick` **sem** nenhum guard. Dois componentes que se delegam mutuamente (`MaxButton.vue:13` renderiza `MaxIconButton`) têm comportamentos de reentrância diferentes para a mesma interação — uma divergência não documentada.

## Impacto

- Proteção contra duplo-clique ineficaz justamente no caso que importa (ações assíncronas lentas).
- Cliques rápidos legítimos descartados sem feedback.
- Comportamento inconsistente entre `MaxButton` (sem guard) e `MaxIconButton` (com guard de 200 ms).

## Plano de correção

1. Amarrar o guard ao ciclo de vida real da ação, e não a um timer:
   ```ts
   const executing = ref(false);

   const onClick = async (event: MouseEvent): Promise<void> => {
       if (executing.value) return;
       executing.value = true;
       try {
           if (props.route) return void goToRoute(props.route, data.value);
           if (props.action) return void await props.action({ event, data: data.value });
           emit('action', true);
       } finally {
           executing.value = false;
       }
   };
   ```
   O `finally` garante a liberação em todos os caminhos, inclusive nos early-returns e em caso de exceção.
2. Expor o estado como `loading` para o template desabilitar visualmente o botão enquanto executa — feedback que hoje não existe.
3. Alinhar `MaxButton` ao mesmo comportamento, ou documentar explicitamente por que diferem.
4. Trocar `event: any` (linha 31) por `MouseEvent`, conforme a convenção de tipagem do projeto.

## Verificação

- Teste com `action` assíncrona que resolve em 500 ms: disparar dois cliques com 300 ms de intervalo e asserir **uma única** execução.
- Teste com `action` síncrona: dois cliques sequenciais devem produzir duas execuções.
- Teste asserindo que uma `action` que lança exceção ainda libera o guard.
- `npx vitest run tests/components/MaxIconButton.test.ts` e `npm run type-check`.
