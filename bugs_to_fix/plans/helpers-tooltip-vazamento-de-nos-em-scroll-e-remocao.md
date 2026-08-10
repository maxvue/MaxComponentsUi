# Diretiva `v-tooltip`: nó órfão no `document.body` quando o gatilho é removido ou a página rola

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/directives/tooltip.ts:104-125`, `:139-155`, `:207-214`
- **Domínio:** helpers-composables

## Problema

O tooltip é criado como filho direto de `document.body` (linha 119) e posicionado uma única vez, no momento da criação (linha 124):

```ts
// src/directives/tooltip.ts:119-124
document.body.appendChild(tooltipEl);
state.tooltipEl = tooltipEl;
el.setAttribute('aria-describedby', state.tooltipId);
renderText(tooltipEl, state.options);
position(el, tooltipEl, state.position);
```

Três problemas confirmados na leitura:

1. **Nenhum listener de `scroll`/`resize`.** `position()` (linhas 42-89) lê `getBoundingClientRect()` do gatilho e soma `window.scrollY`/`scrollX` (linhas 85-86). Como não há recálculo, qualquer rolagem ou redimensionamento com o tooltip visível deixa o balão parado numa posição absoluta obsoleta, descolado do elemento. O `hook` `updated` (linhas 192-206) reposiciona, mas só é chamado quando o binding muda — não em scroll.

2. **Remoção do gatilho sem `unmounted` deixa nó órfão.** O `unmounted` (linhas 207-214) é o único caminho de limpeza. Se o elemento sair do DOM por manipulação direta (ex.: `v-html` do pai reescrevendo a subárvore, ou remoção imperativa), o Vue não dispara o hook, e o `<div class="max-tooltip">` permanece no `body` indefinidamente. Como o `state` vive num `WeakMap` (linha 26) chaveado pelo elemento removido, ele se torna inalcançável — o nó órfão não tem mais dono e nunca será limpo.

3. **Timer pendente cria tooltip para elemento já desconectado.** Em `show()` (linhas 142-145), o `setTimeout` captura `el`. Se o `showDelay` for longo e o elemento for removido do DOM antes do disparo, `createTooltip` (linha 144) roda mesmo assim, chamando `getBoundingClientRect()` num elemento desconectado (retorna zeros) e anexando um balão ao body em posição arbitrária. Não há checagem de `el.isConnected` — compare com `useFocusTrap.ts:60`, que faz exatamente essa verificação (`if (previous?.isConnected)`).

O teste existente (`tests/directives/tooltip.test.ts:191`, `'unmounted limpa tudo: nenhum no orfao no body, nenhum timer pendente'`) cobre apenas o caminho feliz do `unmounted`, não os três cenários acima.

## Impacto

Acúmulo de nós `.max-tooltip` no `body` em SPAs de vida longa (vazamento de DOM), e balões visualmente descolados do elemento após qualquer rolagem — o defeito mais visível para o usuário final, já que a lib usa tooltip em ícones de tabela e barras de ação, que vivem em containers roláveis.

## Plano de correção

1. Em `createTooltip` (linha 99), registrar listeners de `scroll` (com `capture: true`, para pegar containers roláveis internos) e `resize` que chamem `position(el, tooltipEl, state.position)`; guardá-los no `state` e removê-los em `destroyTooltip` (linha 127).
2. Em `createTooltip`, adicionar guard inicial `if (! el.isConnected) return;`.
3. No callback do `setTimeout` de `show()` (linha 142), revalidar `el.isConnected` antes de chamar `createTooltip`.
4. Avaliar um `MutationObserver` ou o hook `beforeUnmount` como rede adicional para o caso de remoção fora do ciclo do Vue; alternativamente, documentar a limitação.

## Verificação

- Testes a criar/ajustar: `tests/directives/tooltip.test.ts` — adicionar: tooltip visível reposiciona ao disparar `window.dispatchEvent(new Event('scroll'))`; `showDelay` pendente com elemento removido não cria nó; `destroyTooltip` remove os listeners registrados (assertar via `removeEventListener` espionado).
- Comandos: `npx vitest run tests/directives/tooltip.test.ts`, `npm run type-check`, `npm run lint`
