# Plano de Implementação: Otimização com RAF no Reposicionamento em Eventos de Scroll no MaxBaseOverlay

## 1. Diagnóstico e Objetivo

No componente `MaxBaseOverlay.vue`, quando o painel suspenso é aberto, ouvintes globais de redimensionamento e rolagem são anexados ao `window`:

```typescript
// MaxBaseOverlay.vue L106-L120
const onReposition = () => position();

const attachListeners = () => {
    document.addEventListener('click', onClickOutside);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
};
```

E a função `position()` realiza leituras e escritas diretas no DOM em cada invocação:

```typescript
// MaxBaseOverlay.vue L69-L91
const position = () => {
    if (!props.target || !panelRef.value) return;

    const t = props.target.getBoundingClientRect(); // LEITURA DO DOM (Reflow)
    const p = panelRef.value.getBoundingClientRect(); // LEITURA DO DOM (Reflow)
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    const spaceBelow = vh - t.bottom;
    const openUp = spaceBelow < p.height && t.top > spaceBelow;
    const top = openUp ? t.top - p.height - props.offset : t.bottom + props.offset;

    let left = props.align === 'right' ? t.right - p.width : t.left;
    left = Math.max(8, Math.min(left, vw - p.width - 8));

    panelStyle.value = { // ESCRITA REATIVA
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        minWidth: props.matchTargetWidth ? `${t.width}px` : undefined,
        zIndex: String(nextZIndex())
    };
};
```

**Problemas identificados:**
1. **Disparo em Alta Frequência com Captura:** O ouvinte de scroll utiliza captura (`capture: true`), capturando eventos de rolagem de **qualquer** elemento scrollável da interface (containers, listas, divs com overflow, tabelas virtuais).
2. **Layout Thrashing (Reflow Síncrono Forçado):** A cada evento de scroll disparado pelo trackpad ou mouse wheel (dezenas ou centenas de vezes por segundo), a chamada imediata e síncrona a `getBoundingClientRect()` força o motor de renderização do navegador a interromper seu pipeline para recalcular a geometria da página de forma síncrona.
3. **Jank e Perda de Fluidez (60fps/120fps):** A atualização imediata de `panelStyle.value` a cada evento re-executa a reatividade do Vue e incrementa `zIndexCounter` repetidamente, causando engasgos visuais durante a rolagem.

**Objetivo:**
Agrupar e sincronizar os recálculos geométricos com a taxa de atualização da tela através de `requestAnimationFrame` (RAF), garantindo que no máximo um reposicionamento ocorra por frame de renderização, sem reflows forçados redundantes e com cancelamento limpo ao fechar ou desmontar o componente.

---

## 2. Arquivos a Modificar

- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/base/MaxBaseOverlay.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/base/MaxBaseOverlay.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/base/MaxBaseOverlay.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/base/MaxBaseOverlay.test.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Modificações em `src/components/base/MaxBaseOverlay.vue`

1. **Declarar a variável `rafId`:**
Armazena o identificador de animação agendado.

2. **Refatorar `onReposition` com throttle via `requestAnimationFrame`:**
Se já houver um quadro agendado (`rafId !== null`), ignora eventos subsequentes no mesmo ciclo. Quando o frame dispara, limpa a flag `rafId = null` e chama `position()`.

3. **Cancelar quadros pendentes em `detachListeners`:**
Evita chamadas órfãs após o fechamento ou desmonte do overlay:

```typescript
// Implementação cirúrgica em src/components/base/MaxBaseOverlay.vue

let rafId: number | null = null;

const onReposition = () => {
    if (rafId !== null) return;

    if (typeof requestAnimationFrame !== 'undefined') {
        rafId = requestAnimationFrame(() => {
            rafId = null;
            position();
        });
    } else {
        position();
    }
};

const detachListeners = () => {
    if (rafId !== null) {
        if (typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(rafId);
        }
        rafId = null;
    }
    document.removeEventListener('click', onClickOutside);
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('scroll', onReposition, true);
    window.removeEventListener('resize', onReposition);
};
```

Template e estilos SCSS scoped mantêm-se estritamente intactos:

```html
<template>
    <Teleport to="body">
        <Transition name="max-base-overlay">
            <div
                v-if="visible"
                ref="panelRef"
                class="max-base-overlay"
                :style="panelStyle"
                :role="role"
                tabindex="-1"
            >
                <slot />
            </div>
        </Transition>
    </Teleport>
</template>
```

```scss
<style lang="scss" scoped>
    .max-base-overlay {
        background: var(--background-0);
        border: 1px solid var(--surface-border);
        border-radius: 0.75rem;
        box-shadow: 0 4px 8px rgb(0 0 0 / 20%);
    }

    .max-base-overlay-enter-active,
    .max-base-overlay-leave-active {
        transition: opacity 0.15s ease, transform 0.15s ease;
    }

    .max-base-overlay-enter-from,
    .max-base-overlay-leave-to {
        opacity: 0;
        transform: translateY(-4px);
    }
</style>
```

---

### 3.2. Validação nos Testes Unitários em `tests/components/base/MaxBaseOverlay.test.ts`

Adicionar teste validando que múltiplos eventos consecutivos de scroll disparam apenas uma execução por frame:

```typescript
it('coalesce múltiplos eventos de scroll consecutivos via requestAnimationFrame', async () => {
    wrapper = mount(MaxBaseOverlay, { props: { visible: true, target } });
    await settle();

    const initialZIndex = Number(getPanel().style.zIndex);

    // Dispara 10 eventos de scroll em sequência no mesmo frame
    for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('scroll'));
    }

    await settle();

    // Com o throttle de RAF, o reposicionamento só deve ter sido executado uma vez
    const finalZIndex = Number(getPanel().style.zIndex);
    expect(finalZIndex - initialZIndex).toBeLessThanOrEqual(1);
});
```

A simetria de registro e remoção de listeners em `window` (com `capture: true` para scroll) permanece 100% preservada, garantindo aprovação no teste existente de simetria de listeners.

---

## 4. Garantia de Retrocompatibilidade

- **Contrato de Props e Eventos:** Nenhuma prop (`visible`, `target`, `align`, `offset`, `matchTargetWidth`, `dismissable`, `closeOnEscape`, `role`) ou evento (`update:visible`, `show`, `hide`, `before-show`, `before-hide`) é modificado.
- **Posicionamento e Alinhamento:** Todas as regras geométricas (detecção de espaço abaixo vs acima, clamp horizontal de viewport, alinhamento à esquerda/direita) permanecem intactas.
- **Ambientes Headless / SSR / Testes:** A verificação `typeof requestAnimationFrame !== 'undefined'` assegura que ambientes sem API de animação continuem executando o reposicionamento de forma transparente.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. Durante a rolagem de tela com um overlay aberto, a função `position()` deve ser executada no máximo uma vez por quadro de animação (RAF).
2. Não deve haver descompasso visual na posição do painel em relação ao alvo ao rolar a página.
3. Ao fechar o overlay, qualquer RAF pendente deve ser cancelado imediatamente.
4. Verificação estrita de tipagem TypeScript:
   ```bash
   npm run type-check
   ```
5. Execução completa dos testes do MaxBaseOverlay:
   ```bash
   npx vitest run tests/components/base/MaxBaseOverlay.test.ts
   ```
