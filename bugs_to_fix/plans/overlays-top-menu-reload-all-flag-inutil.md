# MaxTopMenu: `reloading` é setado e revertido de forma síncrona — o ícone de carregamento nunca aparece

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxTopMenu.vue:99-105`, `src/components/MaxTopMenu.vue:21`
- **Domínio:** overlays-navegacao

## Problema

```
const reloading = ref(false);

const reloadAll = (): void => {
    reloading.value = true;
    system.reloadAll();
    reloading.value = false;
};
```

O `reloading` volta a `false` na **mesma execução síncrona** em que foi setado a `true`. O Vue só renderiza no próximo tick, então a UI **nunca** observa o estado `true`. O botão que o consome (linha 21) é:

```
<MaxIconButton v-tooltip.bottom="'Atualizar dados'" :i="reloading ? 'loading' : 'reload'" size="1.7" light icon-hover-white @click.stop="reloadAll" />
```

O ícone `loading` é, portanto, código morto — o usuário nunca vê feedback de que a atualização está em curso.

A causa raiz é o tratamento de `system.reloadAll()` como se fosse síncrono. Se `reloadAll` retornar uma `Promise` (comportamento esperado de uma operação de recarregamento de dados), o `reloading.value = false` executa **antes** da conclusão real. Se for de fato síncrono, então a flag inteira e o ramo do ícone `loading` são supérfluos.

Não há tratamento de erro: se `reloadAll()` lançar (síncrono) ou rejeitar (assíncrono), o estado `reloading` fica preso em `true` no primeiro caso, e a falha passa silenciosamente no segundo. Não há também nenhum guard contra cliques repetidos disparando múltiplos recarregamentos concorrentes.

O `MaxTopMenu` tem 80,7% de cobertura, e `reloadAll` não é exercitado por nenhum dos testes de `tests/components/MaxTopMenu.test.ts:34-112`.

## Impacto

Ausência de feedback visual numa ação que o usuário espera que demore, levando a cliques repetidos. Erros de recarregamento silenciados.

## Plano de correção

1. Verificar a assinatura de `reloadAll` em `src/stores/useSystem.Store.ts` (retorna `void` ou `Promise<void>`?).
2. Se for assíncrona, tornar o handler `async` com `try`/`finally`:
   ```
   const reloadAll = async (): Promise<void> => {
       if (reloading.value) return;
       reloading.value = true;
       try {
           await system.reloadAll();
       }
       finally {
           reloading.value = false;
       }
   };
   ```
   O `finally` garante que a flag seja liberada mesmo em erro, e o guard inicial evita recarregamentos concorrentes.
3. Se for síncrona, remover a flag `reloading` e o ramo `reloading ? 'loading' : 'reload'` (linha 21), simplificando para `i="reload"` — e avaliar tornar `reloadAll` assíncrona na store, já que recarregar dados quase certamente envolve I/O.
4. Adicionar `:disabled="reloading"` ao `MaxIconButton` enquanto a operação estiver em curso.

## Verificação

- Teste em `tests/components/MaxTopMenu.test.ts`: mockar `system.reloadAll` com uma promise controlada, clicar no botão, afirmar `await nextTick()` que o ícone é `loading`; resolver a promise e afirmar que voltou a `reload`.
- Teste de erro: fazer `reloadAll` rejeitar e afirmar que `reloading` volta a `false`.
- Teste de reentrância: clicar duas vezes com a promise pendente e afirmar que `reloadAll` da store foi chamado uma única vez.
- `npx vitest run tests/components/MaxTopMenu.test.ts` e conferir a subida da cobertura de 80,7%.
