# MaxTogglePopover envolve um `<MaxPopover>` que nunca é aberto — overlay inútil no DOM

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTogglePopover.vue:1-10`, `src/components/MaxTogglePopover.vue:93-104`
- **Domínio:** overlays-navegacao

## Problema

O template do `MaxTogglePopover` é:

```
<MaxPopover>
    <slot name="button" v-if="! props.label">
        <MaxIconButton ... @click.stop="onClickToggle" ref="btn_el" />
    </slot>
    <slot name="button" v-else>
        <MaxButton ... @click.stop="onClickToggle" ref="btn_el" />
    </slot>
</MaxPopover>
```

Mas `onClickToggle` (linha 93) **não interage com o `MaxPopover`** — ele apenas escreve no `useConfirmStore` (linhas 94-103), que é consumido pelo `MaxPopoverConfirm`, um componente completamente diferente.

Ou seja, o `<MaxPopover>` envolvente:

- Nunca é aberto (seu `popover_store.show_id` jamais recebe o id dele).
- Renderiza seu próprio gatilho padrão? Não — os botões vão para o slot default do `MaxPopover`, ou seja, para dentro do `.max-popover-content` (`src/components/MaxPopover.vue:19-22`), que só existe **dentro do painel teleportado**. Os botões passados como filhos aqui caem no slot default, que é renderizado apenas quando o popover está aberto (`v-if="isOpen"`, linha 11).
- Contribui com toda a maquinaria inútil do `MaxPopover`: `useElementBounding`, `useElementSize`, `useWindowSize`, um `useId`, uma assinatura no `usePopoverStore`, e o wrapper `.popover-item` com `position: fixed; z-index: 9999 !important` (ver `overlays-popover-teleport-desabilitado-deixa-wrapper-orfao-no-fluxo.md`).

Além disso, o `MaxPopover` renderiza seu **próprio** gatilho padrão (`MaxButton`, `src/components/MaxPopover.vue:5`) porque o slot `button` do `MaxPopover` não foi preenchido — o `MaxTogglePopover` declara `<slot name="button">` como um slot **próprio**, no slot default do `MaxPopover`, não como conteúdo do slot `button` do filho.

O teste existente (`tests/components/MaxTogglePopover.test.ts:23,51`) verifica apenas que `MaxIconButton`/`MaxButton` estão presentes na árvore de componentes (`findComponent`), o que passa mesmo com os botões dentro de um painel fechado, mascarando o problema.

## Impacto

- DOM e reatividade desperdiçados em cada `MaxTogglePopover` da aplicação.
- Um `MaxButton` fantasma do `MaxPopover` pode ser renderizado como gatilho, além do botão pretendido.
- A estrutura sugere ao leitor do código que o componente usa `MaxPopover` como overlay, quando na verdade usa `MaxPopoverConfirm` — divergência séria entre a estrutura e a intenção.

## Plano de correção

1. Confirmar a intenção com o time: o `MaxTogglePopover` deve exibir uma **confirmação** (via `useConfirmStore`) — nesse caso o `<MaxPopover>` é puro resíduo.
2. Remover o wrapper `<MaxPopover>` do template, deixando apenas o botão gatilho na raiz:
   ```
   <slot name="button" v-if="! props.label">
       <MaxIconButton :icon="props.i ?? props.icon" pointer @click.stop="onClickToggle" ref="btn_el" />
   </slot>
   <slot name="button" v-else>
       <MaxButton :label="props.label" :icon="props.i ?? props.icon" v-tooltip="null" pointer @click.stop="onClickToggle" ref="btn_el" />
   </slot>
   ```
3. Remover o import agora não utilizado de `MaxPopover` (linha 14).
4. Confirmar que `btn_el` + `useElementBounding` (linha 91) continuam medindo o botão real — com o wrapper removido, o ref passa a apontar para o componente na raiz, o que **melhora** a precisão das coordenadas passadas ao `useConfirmStore`.
5. Se a intenção real for outra (o `MaxPopover` deveria de fato abrir), então o `onClickToggle` precisa chamar o `toggle` exposto pelo `MaxPopover` via `ref`, e os botões precisam ir para o slot `button` do `MaxPopover` (`<template #button>`), não para o slot default.

## Verificação

- Atualizar `tests/components/MaxTogglePopover.test.ts` para afirmar, além da presença do componente, que o botão está **visível no DOM renderizado** (`wrapper.find('button').isVisible()`), não apenas presente na árvore.
- Teste de ausência: afirmar que `wrapper.findComponent(MaxPopover).exists() === false` após a correção.
- Teste de comportamento preservado: os testes existentes de `onClickToggle` atualizando o `confirm_store` (linhas 74, 99, 123) devem continuar passando sem alteração.
- `npx vitest run tests/components/MaxTogglePopover.test.ts`
