# MaxModal com `noButton` injeta um elemento `position: fixed` de tamanho zero no canto superior esquerdo da tela

- **Categoria:** melhoria
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxModal.vue:2-7`, `src/components/MaxModal.vue:263-271`
- **Domínio:** overlays-navegacao

## Problema

Quando o `MaxModal` é usado apenas como overlay controlado programaticamente (`noButton: true`, prop declarada na linha 87), o elemento raiz continua existindo:

```
<div ref="btn_el" pointer :class="['max-modal-item', { 'no-button': props.noButton }, props.class]">
    <div v-tooltip="null" @click.stop="toggle" flex v-if="! props.noButton">
```

E recebe o seguinte CSS (linhas 263-271):

```
.max-modal-item {
    &.no-button {
        position: fixed !important;
        width: 0  !important;
        height: 0 !important;
        top: 0 !important;
        left: 0 !important;
    }
}
```

Ou seja: um elemento `position: fixed` de 0×0 ancorado em (0,0) da viewport, com a classe `pointer` (cursor de mão) aplicada incondicionalmente na linha 2.

Observações:

1. **Solução por força bruta.** Cinco `!important` para neutralizar um elemento que não deveria existir. O modal já teleporta seu conteúdo para o `<body>` (linha 8), então a raiz não precisa estar no fluxo — o ideal seria não renderizar nada quando `noButton` for verdadeiro, usando um `<template>` ou um fragmento vazio.
2. **`pointer` sem gatilho.** A classe `pointer` (linha 2) aplica `cursor: pointer` mesmo quando não há botão para clicar. Com 0×0 o efeito é invisível, mas é estado inconsistente.
3. **Ancoragem em (0,0).** Se algum consumidor sobrescrever `width`/`height` (por `props.class`, que também vai para a raiz na linha 2), o elemento aparece fixo no canto superior esquerdo por cima de tudo.
4. **`props.class` vai para dois lugares.** A mesma `props.class` é aplicada na raiz (linha 2) **e** no painel do modal (linha 10). Uma classe de layout passada pelo consumidor afeta os dois, o que provavelmente não é a intenção e interage mal com o `no-button`.
5. **Espaçamento inconsistente** em `width: 0  !important;` (linha 266, dois espaços) — detalhe de lint.

## Impacto

Baixo em uso normal. É dívida de design que pode produzir um artefato visual fixo no canto da tela se combinado com `props.class`, e torna o CSS difícil de sobrescrever pelo consumidor por causa dos `!important`.

## Plano de correção

1. Quando `props.noButton` for verdadeiro, não renderizar a raiz: extrair o teleport para fora do wrapper e envolver o gatilho num `v-if`:
   ```
   <div v-if="! props.noButton" ref="btn_el" pointer :class="['max-modal-item', props.class]">
       <div v-tooltip="null" @click.stop="toggle" flex>
           <slot name="button" v-bind="props">...</slot>
       </div>
   </div>
   <teleport to="body">
       ...
   </teleport>
   ```
   Isso elimina a necessidade inteira do bloco `.no-button` (linhas 264-270) e dos cinco `!important`.
2. Verificar se `btn_el` (linha 2) é usado em algum lugar — no `MaxModal` ele **não** é consumido por nenhum `useElementBounding` (diferente do `MaxPopover`, que o usa em `MaxPopover.vue:103`). Se for realmente inútil, remover o ref.
3. Decidir se `props.class` deve ir para a raiz, para o painel, ou para ambos — e documentar. Recomendo apenas para o painel (linha 10), que é o que o consumidor quer estilizar.
4. Corrigir o espaçamento duplo da linha 266 (ou remover a regra inteira conforme o passo 1).

## Verificação

- Teste em `tests/components/MaxModal.test.ts`: montar com `noButton: true` e afirmar que `wrapper.find('.max-modal-item').exists() === false`, e que `open()` ainda abre o modal normalmente.
- Teste de `props.class`: montar com `class="minha-classe"` e afirmar em quantos elementos ela aparece, fixando a decisão do passo 3.
- Teste de não regressão: os casos existentes com botão (`tests/components/MaxModal.test.ts:71`) devem continuar passando.
- `npm run lint` (Stylelint) após a remoção da regra.
- `npx vitest run tests/components/MaxModal.test.ts`
