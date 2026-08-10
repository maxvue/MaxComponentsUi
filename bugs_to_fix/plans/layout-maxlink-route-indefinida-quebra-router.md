# MaxLink monta um destino inválido quando nenhuma rota é fornecida

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxLink.vue:2`, `src/components/MaxLink.vue:8-13`
- **Domínio:** tabela-layout-exibicao

## Problema

```vue
<router-link :to="{ name: props.route_name ?? props.route }">
```

Ambas as props são opcionais:

```ts
interface Props {
    route_name?: string;
    route?: string;
}
```

Quando nenhuma é informada, o `to` resolve para `{ name: undefined }`. O Vue Router não consegue resolver uma rota nomeada sem nome e lança em runtime (`Cannot read properties of undefined` ou "No match for {name: undefined}", conforme a versão), **derrubando o render da árvore** em vez de degradar graciosamente.

O componente também só suporta rotas **nomeadas**: um caminho literal (`<MaxLink route="/sobre" />`) é interpretado como *nome* de rota, não como path, e falha silenciosamente ou lança. Não há suporte a `params`, `query` ou `hash` — ao contrário de `MaxButton`/`MaxIconButton`, que aceitam `params`, `data` e `query` (`MaxButton.vue:46`).

Não há teste cobrindo o caso sem props: `tests/components/DisplayAndTransitions.test.ts:79-102` cobre apenas os dois caminhos felizes (`route` e `route_name`).

## Impacto

- Exceção em runtime derrubando o componente pai quando `MaxLink` é usado sem rota — cenário plausível com rota vinda de dado opcional.
- API inconsistente com os demais componentes de navegação da biblioteca (sem `params`/`query`).
- Impossível usar um path literal.

## Plano de correção

1. Aceitar tanto nome quanto path, e repassar parâmetros:
   ```ts
   const props = defineProps<{
       route_name?: string;
       route?: string;
       to?: RouteLocationRaw;
       params?: Record<string, any>;
       query?: Record<string, any>;
   }>();

   const destination = computed<RouteLocationRaw | null>(() => {
       if (props.to) return props.to;
       const name = props.route_name ?? props.route;
       if (!name) return null;
       return name.startsWith('/')
           ? { path: name, query: props.query }
           : { name, params: props.params, query: props.query };
   });
   ```
2. Não renderizar o `router-link` quando `destination` é `null` — renderizar apenas o slot, ou nada:
   ```vue
   <router-link v-if="destination" :to="destination"><slot></slot></router-link>
   <span v-else><slot></slot></span>
   ```

## Verificação

- Teste montando `MaxLink` sem nenhuma prop, asserindo que não lança e que o slot ainda é renderizado.
- Teste com `route="/sobre"`, asserindo que o destino é um `path` e não um `name`.
- Teste com `params`, asserindo o repasse.
- `npx vitest run tests/components/DisplayAndTransitions.test.ts`.
