# MaxLoadScreenTarget usa o índice como :key da lista de itens de carregamento

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxLoadScreenTarget.vue:7`
- **Domínio:** tabela-layout-exibicao

## Problema

```vue
<div v-for="(item, index) in props.target.items" :key="index" class="load-screen-message-item" :index="index">
```

A lista de itens de carregamento é, por natureza, **dinâmica e mutável**: itens são adicionados quando uma operação começa e removidos quando termina, em ordem arbitrária. Usar o índice como chave faz o Vue reaproveitar o nó da posição N quando a lista muda.

O problema é agravado pelo conteúdo de cada item: um `DotLottieVue` (linha 8), que é um componente **assíncrono e com estado** (player WASM com animação em curso). Quando um item é removido do meio da lista, o Vue patcheia os nós subsequentes em vez de removê-los — o player Lottie da posição N passa a exibir a animação do item N+1 sem reiniciar, e o estado de reprodução fica associado ao item errado.

O mesmo vale para a troca de ícone de status (linhas 10-14): a transição `loading` → `done` → `error` de um item pode ser aplicada visualmente ao item vizinho.

Note que `props.target.items` pode ser um objeto (o código usa `size()` de `@maxvue/max-use` nas linhas 2 e 4, que trata ambos), então `index` pode ser tanto um número quanto uma chave de string — no segundo caso a chave já é estável, mas o primeiro é o problemático.

Existe também um `:index="index"` (linha 7) aplicado como atributo de DOM arbitrário, sem propósito aparente — não é um atributo HTML válido nem é usado por seletor no SCSS (linhas 87-93).

O mesmo padrão aparece em `MaxLoadScreen.vue:4` (`v-for="(target, key) in loading.targets" :key="key"`), mas ali a chave é a do objeto, portanto estável — não é um achado.

## Impacto

- Animações Lottie associadas ao item errado após remoções no meio da lista.
- Ícone de status exibindo o estado de outra operação.
- Instâncias de componente assíncrono pesado (~1,2 MB) reaproveitadas indevidamente em vez de descartadas.

## Plano de correção

1. Derivar uma chave estável do próprio item. A `LoadingTarget`/`items` deve expor um identificador; se já houver (ex.: `item.id` ou a chave do registro), usá-lo:
   ```vue
   <div v-for="(item, key) in props.target.items" :key="item.id ?? key" ...>
   ```
2. Se `items` for sempre um `Record`, iterar preservando a chave do objeto, que já é estável — verificar o tipo `LoadingTarget` em `src/types/app.ts` e ajustar a assinatura se necessário.
3. Remover o atributo `:index="index"` da linha 7, sem uso.

## Verificação

- Teste: montar com três itens, remover o do meio e asserir que os itens restantes preservam suas mensagens e status corretos.
- Teste asserindo que o atributo `index` não vaza para o DOM.
- `npx vitest run tests/components/MaxLoadScreen.test.ts` (cobertura de funções atual do componente: 60%).
