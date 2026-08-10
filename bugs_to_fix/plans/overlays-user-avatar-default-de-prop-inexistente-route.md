# MaxUserAvatar declara `withDefaults` para uma prop `route` que não existe

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxUserAvatar.vue:35-38`, `src/components/MaxUserAvatar.vue:19-34`
- **Domínio:** overlays-navegacao

## Problema

O `withDefaults` do componente é:

```
}>(), {
    showTooltip: true,
    route: null
});
```

Mas a interface de props declarada nas linhas 19-34 contém `imageUrl`, `name`, `showTooltip`, `routeImage`, `requestImageData`, `remove` e `labelRemove` — **não existe nenhuma prop `route`**. As props que se parecem são `routeImage` (linha 27) e `requestImageData` (linha 29), ambas sem default.

Consequências:
- O default `route: null` é ignorado em runtime (não corresponde a nenhuma prop declarada).
- Em `vue-tsc` estrito, `withDefaults` tipa o segundo argumento como `Partial` das props declaradas; a chave `route` é uma chave excedente, o que deveria ser um erro de tipo. Que o `npm run type-check` passe hoje sugere que a checagem está mais frouxa do que deveria nesse ponto, ou que a inferência do `withDefaults` está permissiva — vale investigar.
- Sinaliza uma prop renomeada (`route` → `routeImage`) cujo default não foi atualizado junto, deixando `routeImage` sem o default pretendido.

Adicionalmente, as props `routeImage` e `requestImageData` são **declaradas mas nunca usadas** em nenhum lugar do componente (o template das linhas 2-3 usa apenas `imageUrl`, `name`, `showTooltip`, `remove`, `labelRemove`), e ambas têm o mesmo texto de JSDoc duplicado ("Define a rota que deve ser chamada para carregar a imagem") — o que reforça a hipótese de props mortas de uma refatoração incompleta.

## Impacto

Baixo em runtime, mas é ruído de API pública: consumidores veem `routeImage`/`requestImageData` na tipagem e podem passá-las esperando efeito, sem que nada aconteça. O default órfão mascara a intenção original.

## Plano de correção

1. Decidir o destino das props não usadas:
   - Se `routeImage`/`requestImageData` forem funcionalidade planejada e não implementada, marcá-las como `@deprecated` no JSDoc ou implementá-las.
   - Se forem resíduo, **removê-las** da interface (linhas 26-29), simplificando a API pública.
2. Remover a chave `route: null` do `withDefaults` (linha 37), deixando apenas `showTooltip: true`.
3. Corrigir os JSDoc duplicados caso as props sejam mantidas.
4. Rodar `npx tsx src/scripts/generateResolver.ts` não é necessário (não há novo componente), mas verificar se a API pública documentada em algum README precisa de atualização.

## Verificação

- `npm run type-check` — deve continuar passando, e idealmente passar a acusar erro caso a chave órfã seja reintroduzida.
- `npx vitest run tests/components/MaxUserAvatar.test.ts`.
- Busca de uso: `grep -rn "routeImage\|requestImageData" src/ tests/` deve retornar apenas a declaração antes da remoção, e nada depois.
