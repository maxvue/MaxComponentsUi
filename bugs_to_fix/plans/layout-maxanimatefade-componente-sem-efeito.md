# MaxAnimateFade não anima nada — é um passthrough de slot

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxAnimateFade.vue:1-9`
- **Domínio:** tabela-layout-exibicao

## Problema

O componente inteiro:

```vue
<template>
    <slot></slot>
</template>

<script setup lang="ts">
    import { useAttrs } from 'vue';

    const _attrs = useAttrs();
</script>
```

Não há `<Transition>`, não há classes de animação, não há bloco `<style>`. O componente renderiza o slot e nada mais — o nome promete um fade que não existe. O `useAttrs()` é atribuído a `_attrs` e descartado (o prefixo `_` indica que o próprio autor sabia estar sem uso).

Compare com os irmãos, que implementam o padrão corretamente:
- `TransitionFade.vue:1-5` — `<Transition name="fade">` + keyframes.
- `MaxTransitionFadeLight.vue:1-5` — `<Transition name="fadelight">` + keyframes.
- `MaxTransitionUp.vue:3-5` — `<Transition name="slide-vertical-animation">` + keyframes.

`MaxAnimateFade` é o único do grupo sem `<Transition>`. Ele é usado em `MaxPopover.vue` (confirmado por `tests/components/MaxPopover.test.ts`), onde a ausência da animação é silenciosa — o conteúdo simplesmente aparece e some sem transição.

O teste existente (`tests/components/LayoutComponents.test.ts:58-64`, "renderiza slot diretamente") **codifica o comportamento defeituoso como esperado**, sem verificar se há qualquer animação.

## Impacto

- Componente com nome enganoso: consumidores acreditam ter aplicado uma animação de fade que não ocorre.
- Popovers e demais consumidores aparecem/somem abruptamente.
- O teste atual impede que o defeito seja percebido — reforça o status quo.

## Plano de correção

1. Decidir a intenção do componente. Duas saídas coerentes:
   - **Implementar**: envolver o slot em `<Transition>` com as classes de fade, alinhando-se a `TransitionFade.vue`:
     ```vue
     <template>
         <Transition name="max-animate-fade" v-bind="attrs">
             <slot></slot>
         </Transition>
     </template>
     ```
     com o `<style>` correspondente. Nesse caso, repassar os attrs (`appear`, `mode`, `duration`) ao `Transition`, dando propósito ao `useAttrs()`.
   - **Remover**: se `TransitionFade` já cobre o caso, deprecar `MaxAnimateFade`, migrar os usos internos (`MaxPopover.vue`) e regenerar o manifesto do resolver (`npx tsx src/scripts/generateResolver.ts`).
2. Verificar antes se alguma aplicação consumidora depende do componente como passthrough puro.
3. Atualizar `tests/components/LayoutComponents.test.ts:58-64`, que hoje valida a ausência de animação.

## Verificação

- Teste asserindo a presença do `Transition` e das classes `*-enter-active` / `*-leave-to` ao alternar a visibilidade do slot.
- `npx vitest run tests/components/LayoutComponents.test.ts tests/components/MaxPopover.test.ts`.
- Conferência visual do fade de um popover no playground.
