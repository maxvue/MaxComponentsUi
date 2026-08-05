# Plano 05 — `v-tooltip` (substitui `primevue/tooltip`)

| | |
|---|---|
| **id** | 5 |
| **Arquivo a criar** | `src/directives/tooltip.ts` |
| **Primitiva eliminada** | `Tooltip` (diretiva) |
| **Depende de** | — |
| **Consumidores** | toda app que usa a lib — a diretiva é registrada globalmente |

⚠️ **Alto risco de regressão invisível.** Esta diretiva é registrada em
`src/index.ts:147` (`app.directive('tooltip', Tooltip)`) e usada em **apps
consumidoras**, não neste repositório. Um `grep` local vai parecer indicar "ninguém
usa" — isso é falso. Trate a compatibilidade como sagrada.

---

## 1. A API da diretiva do PrimeVue

### Formas de uso (todas precisam continuar funcionando)

```html
<!-- string simples -->
<button v-tooltip="'Texto'">

<!-- objeto com opções -->
<button v-tooltip="{ value: 'Texto', showDelay: 300, hideDelay: 100 }">

<!-- modificadores de posição -->
<button v-tooltip.top="'Acima'">
<button v-tooltip.right="'À direita'">
<button v-tooltip.bottom="'Abaixo'">
<button v-tooltip.left="'À esquerda'">

<!-- modificador de foco -->
<button v-tooltip.focus="'Só no foco'">
```

### Opções do objeto

| Opção | Tipo | Default | Efeito |
|---|---|---|---|
| `value` | `string` | — | texto (aceita HTML se `escape: false`) |
| `disabled` | `boolean` | `false` | desativa o tooltip |
| `escape` | `boolean` | `true` | `false` permite HTML |
| `showDelay` | `number` | `0` | ms antes de mostrar |
| `hideDelay` | `number` | `0` | ms antes de esconder |
| `autoHide` | `boolean` | `true` | esconde ao sair do elemento |
| `fitContent` | `boolean` | `true` | largura ajustada ao conteúdo |
| `class` | `string` | — | classe extra no tooltip |

### Markup gerado

```html
<div class="p-tooltip p-component p-tooltip-top" role="tooltip">
    <div class="p-tooltip-arrow"></div>
    <div class="p-tooltip-text">Texto</div>
</div>
```

Anexado a `document.body`, posicionado com `position: absolute`.

---

## 2. Implementação

```ts
// src/directives/tooltip.ts
import type { Directive, DirectiveBinding } from 'vue';

interface TooltipOptions {
    value?: string;
    disabled?: boolean;
    escape?: boolean;
    showDelay?: number;
    hideDelay?: number;
    autoHide?: boolean;
    fitContent?: boolean;
    class?: string;
}

type Position = 'top' | 'right' | 'bottom' | 'left';

interface TooltipState {
    el: HTMLElement | null;
    showTimer: number | null;
    hideTimer: number | null;
    options: TooltipOptions;
    position: Position;
    listeners: Array<[string, EventListener]>;
}

const states = new WeakMap<HTMLElement, TooltipState>();

const parseOptions = (binding: DirectiveBinding): TooltipOptions =>
    typeof binding.value === 'string' ? { value: binding.value } : (binding.value ?? {});

const parsePosition = (binding: DirectiveBinding): Position => {
    if (binding.modifiers.top) return 'top';
    if (binding.modifiers.right) return 'right';
    if (binding.modifiers.bottom) return 'bottom';
    if (binding.modifiers.left) return 'left';
    return 'right';   // default do PrimeVue
};
```

### Regras de comportamento

- **Default de posição é `right`** — é o default do PrimeVue. Trocar para `top`
  (mais comum em outras libs) mudaria o layout de apps existentes silenciosamente.
- **`escape: true` por padrão** → use `textContent`. Só use `innerHTML` quando
  `escape === false`. Inverter isso abre XSS em conteúdo vindo de API.
- **Timers precisam ser limpos** em `unmounted` e ao esconder. Timer órfão que dispara
  depois do desmonte tenta ler um elemento nulo.
- **Listeners registrados no elemento devem ser removidos em `unmounted`.** Guarde-os
  no `state.listeners` para remover exatamente os mesmos.
- **`.focus`** troca os gatilhos de `mouseenter`/`mouseleave` para `focus`/`blur`.
  Sem esse modificador, registre **ambos** (mouse e foco) — tooltip que só responde a
  mouse é inacessível por teclado.
- **`role="tooltip"`** no elemento e **`aria-describedby`** no gatilho apontando para
  o id do tooltip. Isso é o que faz leitores de tela anunciarem o texto.

### Hooks da diretiva

```ts
export const Tooltip: Directive<HTMLElement, string | TooltipOptions> = {
    mounted(el, binding) { /* cria state, registra listeners */ },
    updated(el, binding) { /* atualiza options/position; se visível, re-renderiza texto */ },
    unmounted(el) { /* limpa timers, remove listeners, remove nó do body */ }
};

export default Tooltip;
```

> **`updated` importa.** Tooltips com texto reativo (`v-tooltip="labelComputada"`) são
> comuns. Sem o hook `updated`, o texto congela no valor inicial.

### Posicionamento

Reaproveite a lógica de flip/clamp do [plano 02](02-MaxBaseOverlay.md) — mesmo problema,
mesma solução. Se `MaxBaseOverlay` expuser uma função utilitária de posicionamento,
importe-a em vez de duplicar.

### Estilo

Bloco `<style>` global (não escopado, pois o nó vive no `body`). Deve produzir o mesmo
visual do tema atual: fundo escuro, texto claro, `border-radius`, seta apontando para o
gatilho via `::before`/`::after` ou um nó `.p-tooltip-arrow`.

Mantenha os nomes de classe `p-tooltip`, `p-tooltip-text`, `p-tooltip-arrow` e
`p-tooltip-{top,right,bottom,left}` — apps consumidoras podem estilizá-los.

---

## 3. Registro em `src/index.ts`

```ts
// antes
import Tooltip from 'primevue/tooltip';

// depois
import Tooltip from './directives/tooltip';
```

A linha `app.directive('tooltip', Tooltip)` **não muda**.

---

## 4. Teste — `tests/directives/tooltip.test.ts` (criar)

1. `mouseenter` cria um nó `.p-tooltip` no `document.body`;
2. `mouseleave` remove o nó;
3. o texto renderizado é o do binding;
4. `v-tooltip.top` aplica `p-tooltip-top`; idem para right/bottom/left;
5. **sem modificador → `p-tooltip-right`** (protege o default do PrimeVue);
6. `showDelay` adia a criação (use fake timers do Vitest);
7. `hideDelay` adia a remoção;
8. `disabled: true` → nada é criado;
9. `escape: true` (default) → HTML no valor aparece **escapado** como texto;
10. `escape: false` → HTML é interpretado;
11. `focus`/`blur` também disparam o tooltip (acessibilidade por teclado);
12. **`unmounted` limpa tudo**: nenhum nó órfão no body, nenhum timer pendente;
13. mudar o valor do binding atualiza o texto de um tooltip visível.

### Mutações que o teste precisa pegar

- trocar o default de posição para `top` → teste 5 falha;
- trocar `textContent` por `innerHTML` incondicional → teste 9 falha;
- remover a limpeza em `unmounted` → teste 12 falha.

---

## 5. Checklist de conclusão

- [ ] Todas as formas de uso da seção 1 funcionam
- [ ] Default de posição é `right` (não `top`)
- [ ] `escape` default `true`; XSS testado
- [ ] Foco/blur disparam o tooltip
- [ ] `role="tooltip"` + `aria-describedby`
- [ ] Zero vazamento de nós e timers (teste 12)
- [ ] `src/index.ts` importa da nova origem
- [ ] Validado manualmente no playground em todas as 4 posições
