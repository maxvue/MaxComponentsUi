# useTopToolbar.Store sem teste unitário dedicado — fallbacks de rota não cobertos

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/stores/useTopToolbar.Store.ts:37-67` (nenhum `tests/stores/useTopToolbar*.test.ts`)
- **Domínio:** stores-barrel

## Problema

Não existe `tests/stores/useTopToolbar.Store.test.ts`. Há um bloco `describe('useTopToolbarStore')` dentro de `tests/components/MaxTopMenu.test.ts:219-260`, mas ele testa a store no contexto de um componente montado e não percorre os quatro caminhos da função `route()`.

A cobertura reportada (**70,8% stmts / 41,6% branches**) corresponde a esta cascata de quatro ramos em `src/stores/useTopToolbar.Store.ts:37-67`:

1. `:41-45` — sem `target` (nem `routeName`, nem `defaultRoute`) → `router.push({ query })`.
2. `:47-51` — `router.hasRoute(target)` → `router.push({ name: target, query })`.
3. `:53-62` — `getRoute(target)` resolve uma URL do backend; se ela começar com `window.location.origin`, o origin é removido e sobra o path (com fallback para `'/'` quando o slice esvazia).
4. `:64-66` — nenhuma das anteriores → `router.push({ name: router.currentRoute.value?.name ?? '', query })`.

Além disso, a mesclagem `{ ...defaultData.value, ...(data ?? {}) }` (`:39`) — em que `data` sobrescreve `defaultData` — não tem asserção.

O ramo 3 é o mais delicado e o menos coberto: a normalização `url.slice(origin.length) || '/'` existe justamente para evitar um `router.push` com URL absoluta (que o Vue Router trata como path literal e quebra a navegação SPA).

## Impacto

Uma regressão na normalização de URL do ramo 3 faria a barra superior navegar para um path inválido (ex.: `/https://app.exemplo.com/pagina`), resultando em rota não encontrada. A ausência de teste também torna arriscada a futura migração para independência do PrimeVue, que tende a mexer nesses componentes de shell.

## Plano de correção

Criar `tests/stores/useTopToolbar.Store.test.ts` com mock de `vue-router` e de `getRoute`:

```ts
vi.mock('vue-router', () => ({ useRouter: () => routerMock }));
vi.mock('@maxvue/max-use', async (orig) => ({ ...(await orig()), getRoute: getRouteMock }));
```

Casos:
1. Estado inicial: `items === []`, `show === false`, `defaultRoute === null`, `defaultData === {}`.
2. Sem `target` → `push` chamado com `{ query }` apenas, e retorno `true`.
3. `defaultRoute` definido e `hasRoute` verdadeiro → `push({ name: defaultRoute, query })`.
4. `routeName` explícito tem precedência sobre `defaultRoute`.
5. `routeName === false` cai no `defaultRoute` (a condição `routeName !== false` em `:38`).
6. `hasRoute` falso + `getRoute` devolvendo URL absoluta com o mesmo `window.location.origin` → `push({ path: '/pagina', query })` (origin removido).
7. `getRoute` devolvendo exatamente o origin (sem path) → `push({ path: '/', query })` (o `|| '/'`).
8. `getRoute` devolvendo URL de outro origin → `path` mantido integral.
9. `hasRoute` falso + `getRoute` devolvendo falsy → fallback para `router.currentRoute.value.name`.
10. Mesclagem: `defaultData = { a: 1, b: 2 }` e `route({ b: 3 })` → query `{ a: 1, b: 3 }`.

## Verificação

```bash
npx vitest run tests/stores/useTopToolbar.Store.test.ts
npm run test:coverage
```

Meta: elevar `useTopToolbar.Store.ts` de 41,6% para 100% de branches.
