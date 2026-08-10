# useLogin.Store: submit() e loadProviders() sem tratamento de exceção — loading trava ligado

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/stores/useLogin.Store.ts:91-117`, `src/stores/useLogin.Store.ts:148-154`
- **Domínio:** stores-barrel

## Problema

`submit()` (`:91-117`) liga `loading.value = true` na primeira linha e o desliga na última (`:116`), mas **não há `try/finally`**:

```ts
const submit = async (): Promise<void> => {
    loading.value = true;
    error.value = '';

    const result_api = await apiPostRoute(getMaxAppConfig().routeLogin as string, { ... });

    if (result_api) { ... } else { ... }

    loading.value = false;
};
```

O código assume que `apiPostRoute` sempre **resolve** — devolvendo valor truthy no sucesso e falsy na falha de credenciais. Isso cobre o caminho "usuário ou senha inválidos", que é o único testado (`tests/stores/useLogin.Store.test.ts:128`, com o mock resolvendo `null`). Mas qualquer rejeição da promise escapa:

- Falha de rede/DNS/timeout dentro do `apiPostRoute`.
- `getRoute()` lançando por rota não registrada — cenário concreto, já que `routeLogin` vem de `getMaxAppConfig()` e uma aplicação que não chamou `configureMaxApp()` fica com o default `'login'`, que pode não existir no resolver dela.
- Erro 500 do servidor, se a implementação de `apiPostRoute` propagar em vez de engolir.

Quando isso ocorre, `loading.value` **permanece `true` para sempre**: o botão de login fica travado em estado de carregamento, sem mensagem de erro (`error.value` foi limpo em `:93` e nunca repreenchido) e sem toast. O usuário não tem como tentar de novo sem recarregar a página. Este é o pior lugar possível para esse modo de falha, porque é a primeira tela da aplicação e a única saída dela.

`loadProviders()` (`:148-154`) tem o mesmo problema em forma mais branda:

```ts
const ids = await apiGetRoute(getMaxAppConfig().routeProviders as string);
providers.value = (ids ?? []).filter(...).map(...);
```

O `?? []` protege contra `null`/`undefined`, e há teste para isso (`:189`, "lida com resposta vazia da API"), mas não contra rejeição nem contra a API devolver algo que não seja array (ex.: um objeto de erro `{ message: ... }` com status 200 — `.filter` não existe em objeto e lança `TypeError`). Como `loadProviders()` costuma ser chamado no `onMounted` da tela de login, uma rejeição não tratada aborta o restante do setup do componente.

## Impacto

**Alto.** Tela de login permanentemente travada em loading diante de qualquer instabilidade de rede ou rota mal configurada, sem feedback e sem recuperação possível pela interface. É uma falha de disponibilidade total do fluxo de autenticação, disparada pela condição mais comum de todas (rede ruim).

## Plano de correção

1. Envolver o corpo de `submit()` em `try/catch/finally`:
   - `finally { loading.value = false; }` — garante que o botão sempre destrave.
   - `catch` — preencher `error.value` com mensagem genérica ("Não foi possível conectar ao servidor. Tente novamente.") e emitir o mesmo toast de erro já usado em `:107-111`, para que a falha de rede seja distinguível de credenciais inválidas.
2. Envolver `loadProviders()` em `try/catch`, deixando `providers.value = []` no catch (degradação silenciosa é aceitável aqui: sem provedores sociais, o login por senha continua funcionando).
3. Endurecer a checagem de tipo em `:151`: usar `Array.isArray(ids) ? ids : []` em vez de `ids ?? []`, cobrindo respostas de formato inesperado.
4. Considerar o mesmo tratamento em `social()` (`:159-163`), que hoje já é defensivo (`if (url && ...)`) e não precisa de mudança — apenas confirmar.

## Verificação

Novos casos em `tests/stores/useLogin.Store.test.ts`:

- `apiPostRoute` mockado com `mockRejectedValue(new Error('network'))` → após `await store.submit()`, asseverar `store.loading === false`, `store.error` não vazio e toast de erro emitido.
- `apiGetRoute` rejeitando em `loadProviders()` → não lança e `providers === []`.
- `apiGetRoute` resolvendo `{ erro: 'x' }` (não-array) → não lança e `providers === []`.

```bash
npx vitest run tests/stores/useLogin.Store.test.ts
```
