# Layout Thrashing por Reposicionamento Síncrono em Eventos de Scroll no MaxBaseOverlay

## Categoria
Watchers e Reatividade / Layout Thrashing / Jank em Rolagem

## Severidade
Média-Alta

## Componentes Envolvidos
- [MaxBaseOverlay.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/base/MaxBaseOverlay.vue#L69-L120)

## Descrição do Problema
No componente `MaxBaseOverlay.vue`, quando o overlay se torna visível, listeners de redimensionamento e scroll global com captura (`capture: true`) são ativados:

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

E a função `position()` realiza leituras e escritas diretas no DOM e no estado reativo em cada disparo:

```typescript
// MaxBaseOverlay.vue L69-L91
const position = () => {
    if (!props.target || !panelRef.value) return;

    const t = props.target.getBoundingClientRect(); // LEITURA DO DOM
    const p = panelRef.value.getBoundingClientRect(); // LEITURA DO DOM
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

## Causa Raiz
1. O listener de scroll foi configurado com `capture: true` (`window.addEventListener('scroll', onReposition, true)`), o que significa que o evento é disparado não apenas pelo scroll da janela principal, mas por **qualquer elemento scrollável** dentro de containers, modais, divs ou listas da página.
2. Em cada pixel rolado na tela, o navegador dispara `onReposition()` dezenas ou centenas de vezes por segundo (podendo atingir 120Hz em telas de alta taxa de atualização).
3. A chamada imediata e síncrona a `getBoundingClientRect()` força o navegador a interromper o pipeline de renderização para calcular a geometria da página de forma síncrona (*forced synchronous layout / reflow*).
4. A atualização de `panelStyle.value` dispara o ciclo reativo do Vue a cada tick de scroll, além de incrementar ininterruptamente `zIndexCounter`.

## Impacto na Performance
- **Jank / Engasgos Visuais**: A rolagem de página com um overlay ou popover aberto perde a fluidez de 60fps, resultando em travamentos perceptíveis.
- **Sobrecarga de CPU**: Consumo contínuo de processamento e layout recalc a cada evento de scroll gerado pelo trackpad ou roda do mouse.

## Solução Recomendada
Utilizar `requestAnimationFrame` para agendar a medição geométrica e atualização do estilo apenas uma vez por frame de renderização do navegador, além de cancelar frames pendentes ao fechar ou desmontar:

```typescript
let rafId: number | null = null;

const onReposition = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
        rafId = null;
        position();
    });
};

const detachListeners = () => {
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    document.removeEventListener('click', onClickOutside);
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('scroll', onReposition, true);
    window.removeEventListener('resize', onReposition);
};
```
Isso garante que a posição seja recalculada exatamente no momento certo de sincronização com o display refresh rate, sem causar layout thrashing.
