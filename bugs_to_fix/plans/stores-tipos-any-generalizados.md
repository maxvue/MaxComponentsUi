# Uso generalizado de `any` nas stores contorna a checagem de tipos

- **Categoria:** melhoria
- **Severidade:** média
- **Arquivo(s):** `src/stores/useIcon.Store.ts:12,14`; `src/stores/useTopToolbar.Store.ts:18,27,37`; `src/stores/useSystem.Store.ts:50,72,162`; `src/stores/useUser.Store.ts:46,51,60,77`; `src/stores/useConfirm.Store.ts:5`; `src/stores/useListMenus.Store.ts:11`; `src/stores/useSearchBar.Store.ts:23`
- **Domínio:** stores-barrel

## Problema

As stores usam `any` de forma sistemática, em três padrões distintos:

**1. `Ref` sem parâmetro de tipo** — `src/stores/useIcon.Store.ts:12,14`:
```ts
const icons_data: Ref = ref({});
const list_icons_waiting_request: Ref = computed(() => ...);
```
`Ref` sem argumento equivale a `Ref<any>`. `icons_data` tem forma conhecida e estável (`Record<string, string>`, onde o valor é um SVG sanitizado ou o sentinela `'waiting'`), e `list_icons_waiting_request` é declaradamente `string[]`. Nada aqui exige `any` — o efeito prático é que `icons_data.value[x].qualquerCoisa` compila sem erro em toda a biblioteca, inclusive em `src/components/MaxIcon.vue:142`, que consome a store.

**2. Coleções genuinamente não tipadas** — `src/stores/useTopToolbar.Store.ts:18,27,37`:
```ts
const items: Ref<any[]> = ref([]);
const defaultData: Ref<Record<string, any>> = ref({});
const route = (data: any = {}, routeName: any = null): boolean => { ... }
```
`items` são os itens renderizados por `MaxTopToolbar.vue` e têm forma definida na prática, mas não há interface. `routeName: any` é especialmente frouxo: a lógica de `:38` trata `null`, `false` e `string` de forma distinta — o tipo real é `string | false | null`, e escrevê-lo assim documentaria a intenção que hoje só existe no corpo da função.

**3. Casts para contornar injeção do `@maxvue/max-pinia`** — `src/stores/useSystem.Store.ts:50,162` e `src/stores/useUser.Store.ts:51,60,77`:
```ts
const is_logged = computed<boolean>(() => Boolean(user.data?.id && (user as any).status?.server?.get?.is_success));
const clearAll = (user as any).clearAll;
function getStatus(this: any) { return this?.status?.server ?? null; }
```
Aqui o `any` tem uma causa legítima: `status`, `clearAll` e o `this` das actions são **injetados em runtime pelo plugin `@maxvue/max-pinia`** e não fazem parte do tipo devolvido por `defineStore`. Os comentários em `src/stores/useUser.Store.ts:9-21` documentam bem essa dependência. Mas o contorno escolhido (`as any` espalhado por cinco pontos de dois arquivos) apaga a checagem em toda a cadeia `status.server.get.is_success`, que é justamente a flag que governa todo o branching de autenticação do `MaxApp`.

## Impacto

Erros de digitação ou mudanças de contrato nesses caminhos não são detectados por `npm run type-check`. O caso mais sensível é o (3): se o `@maxvue/max-pinia` renomear `is_success`, `is_logged` passa a ser permanentemente `false` e a aplicação trata todo usuário como deslogado — sem nenhum sinal em build. As diretrizes de TypeScript do projeto tratam `any` como exceção a ser justificada, não como padrão.

## Plano de correção

1. **`useIcon.Store`**: tipar `icons_data` como `Ref<Record<string, string>>` e `list_icons_waiting_request` como `ComputedRef<string[]>`. Corrigir o que o compilador acusar nos consumidores (`MaxIcon.vue`).
2. **`useTopToolbar.Store`**: criar uma interface `TopToolbarItem` em `src/types/app.ts` para `items`; trocar a assinatura de `route()` para `(data: Record<string, unknown> = {}, routeName: string | false | null = null)`.
3. **`useSystem.Store` / `useUser.Store`**: substituir os `as any` por uma **interface de augmentação** declarada uma única vez, descrevendo o contrato injetado pelo `@maxvue/max-pinia`:
   ```ts
   interface MaxPiniaServerStatus { get?: { is_success?: boolean }; save?: { is_success?: boolean } }
   interface MaxPiniaInjected { status?: { server?: MaxPiniaServerStatus }; clearAll?: () => Promise<void> | void }
   ```
   Aplicá-la nos pontos de acesso (`user as unknown as MaxPiniaInjected`, `this: MaxPiniaInjected`). Isso preserva a natureza opcional da injeção e restaura a checagem do caminho `status.server.get.is_success`.
4. **`useConfirm.Store:5`** (`action?: (event?: any) => void`): trocar `any` por `Event | undefined`, ou `unknown` se o payload puder não ser um evento DOM.
5. **`useSearchBar.Store:23`** (`refDebounced(input_value as any, 200)`): investigar por que o cast é necessário — provavelmente incompatibilidade de assinatura do `refDebounced` do `@maxvue/max-use`. Se for limitação da dependência, substituir por um `@ts-expect-error` com comentário explicando, que ao menos falha quando a dependência for corrigida.
6. **`useListMenus.Store:11`** (`[key: string]: any` na interface `ListMenu`): manter é aceitável (é um index signature de extensão deliberada), mas trocar `any` por `unknown` força o consumidor a estreitar.

## Verificação

```bash
npm run type-check
npm run lint
npm run test
```

Confirmar que o número de ocorrências de `any` em `src/stores/` cai substancialmente e que as restantes têm comentário justificando. Nenhum teste existente deve quebrar — a mudança é puramente de tipos.
