# useLoading.Store: keys_target cresce indefinidamente e o contador nunca é reciclado

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/stores/useLoading.Store.ts:31,40,60,103-109,128-138`
- **Domínio:** stores-barrel

## Problema

A store mantém três estruturas paralelas indexadas por chave interna:

- `targets` (`:22`) — os itens em si, agrupados por target.
- `keys` (`:28`) — mapa chave lógica → chave interna.
- `keys_target` (`:31`) — mapa chave interna → target.

O ciclo de vida delas é **inconsistente**. Ao encerrar um loading, `end()` (`:103-109`) remove apenas a entrada de `keys`:

```ts
const end = (loading_key: string): void => {
    const item = resolveItem(loading_key);
    delete keys.value[loading_key];
    if (item) Object.assign(item, { status: 'done' });
};
```

`keys_target` nunca sofre `delete` em nenhum ponto do arquivo. E o watcher de limpeza (`:128-138`) esvazia `targets.value[target].items` quando nada mais está pendente, mas também não toca em `keys_target`.

Somado ao contador monotônico `count` (`:34,40`), que nunca é reciclado — cada `setKeys()` gera uma chave interna nova (`'0001.foo'`, `'0002.foo'`, …) porque `end()` liberou a chave lógica —, o resultado é que **`keys_target` acumula uma entrada permanente por cada operação de loading já realizada na sessão**.

Em uma SPA de longa duração, onde cada navegação, cada requisição de tabela e cada salvamento registra um loading, isso significa milhares de entradas retidas em um objeto reativo do Pinia. Cada entrada é pequena (chave string → target string), mas o objeto é **reativo e profundo**, e o watcher de `:128` roda com `deep: true` sobre `targets` — o custo real é o crescimento sem limite de um estado que nunca é coletado.

Há ainda um efeito de correção, não só de memória: o padding de `:40` é `String(count.value++).padStart(4, '0')`, projetado para preservar ordem lexicográfica. A partir de **10.000 loadings** na mesma sessão o padding satura (`'10000'` tem 5 dígitos) e a ordenação lexicográfica das chaves quebra — `'10000.x'` ordena antes de `'9999.x'`. Como `count` nunca reinicia, uma sessão longa o bastante chega lá.

## Impacto

Vazamento de memória de crescimento linear no tempo de vida da sessão, em uma store que é exercitada por praticamente toda operação assíncrona da aplicação. O sintoma é degradação gradual (aba pesada após horas de uso), difícil de atribuir à causa. A quebra de ordenação acima de 10.000 é remota, mas real e silenciosa — os loadings passariam a aparecer fora de ordem.

Os testes existentes (`tests/stores/useLoading.Store.test.ts`) cobrem bem o comportamento funcional (15 casos, incluindo `:90` "liberar a chave permite reiniciar o mesmo loading depois"), mas nenhum assevera o **tamanho** de `keys_target` após o encerramento — por isso o vazamento passa verde.

## Plano de correção

1. Em `end()` (`:103-109`), remover também a entrada de `keys_target` correspondente à chave interna, antes de descartar `keys`:
   - capturar `const key = getKeys(loading_key, false)` (sem criar);
   - `if (key) delete keys_target.value[key];`
   - Atenção à ordem: `resolveItem()` (`:89-98`) depende de `keys` **e** de `keys_target`, então a limpeza precisa vir depois de resolver o item.
2. No watcher de limpeza (`:128-138`), ao esvaziar `targets.value[target].items`, remover de `keys_target` todas as chaves que apontavam para aquele target — assim o mapa acompanha o ciclo de vida real dos itens.
3. Avaliar reciclar `count` quando não houver nenhum item pendente em nenhum target (o watcher já detecta exatamente essa condição), zerando o contador e eliminando o risco de saturação do padding. Alternativamente, aumentar o padding para 8 dígitos, que é mitigação e não correção.

## Verificação

Novos casos em `tests/stores/useLoading.Store.test.ts`:

- `start()` seguido de `end()` para N chaves distintas → `Object.keys(store.keys_target).length` volta a 0 (hoje seria N).
- Após o debounce do watcher liquidar e o target ser esvaziado, `keys_target` não retém entradas daquele target.
- O caso já existente de `:90` ("reiniciar o mesmo loading depois") continua passando — a limpeza não pode quebrar o reuso de chave lógica.

```bash
npx vitest run tests/stores/useLoading.Store.test.ts
```
