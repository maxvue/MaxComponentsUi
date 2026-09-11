# Achado UX-02: "Dead Clicks", Saltos Visuais e Desancoragem Sistêmica em Menus, Dropdowns e Overlays Flutuantes

## Severidade: Crítica

### Componentes Impactados
- [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue)
- [`MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputDatePicker.vue)
- [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue)
- [`MaxPopover.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopover.vue)
- [`MaxPopoverConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverConfirm.vue)
- [`MaxPopoverMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverMenu.vue)
- [`MaxInputAutoComplete.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoComplete.vue)
- [`MaxInputAutoCompleteApi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoCompleteApi.vue)
- [`MaxUserSection.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserSection.vue)
- [`base/MaxBaseOverlay.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/base/MaxBaseOverlay.vue)

---

## 1. Sintoma Observado vs Causa Raiz Profunda

### Sintomas Observados
1. **O Fenômeno do "Clique Morto" (Dead Click) ao Fechar Menus**:
   Quando o usuário tem um menu suspenso aberto (como a seleção de um estado/cidade em `MaxInputSelect` ou a seleção de uma data em `MaxInputDatePicker`) e tenta clicar no próximo campo de entrada, no botão "Salvar" ou em qualquer outro item da interface, o clique **não atinge o botão/campo pretendido**. O clique é inteiramente absorvido por um elemento invisível de tela inteira (`backdrop`). O usuário é obrigado a clicar uma segunda vez para que a ação real seja executada.
2. **Flickering e Saltos Visuais (Layout Jumps) na Abertura**:
   Ao abrir popovers, seletores ou caixas de confirmação próximos à extremidade inferior da janela do navegador, o painel é renderizado inicialmente apontando para baixo (fora dos limites visíveis da tela) e, subitamente, após alguns milissegundos, salta para cima do botão de disparo. Em outros casos, o overlay surge inicialmente em `0, 0` ou sem estilo computado antes de ser reposicionado.
3. **Deslocamento e Desancoragem durante Rolagem (Scroll Drift)**:
   Em componentes de confirmação rápida como `MaxPopoverConfirm` (acionados por botões de exclusão ou ação crítica), as coordenadas de disparo (`x`, `y`) são gravadas como uma "fotografia estática" na store global no momento do clique. Se o usuário rolar a página com a roda do mouse, o balão de confirmação permanece fixo no espaço da viewport, apontando para o vazio ou para outro elemento completamente diferente daquele que disparou a ação, desorientando o usuário sobre o que está confirmando.
4. **Anarquia de Camadas (`z-index`) e Oclusão Incorreta**:
   Existem conflitos diretos de z-index entre componentes sobrepostos:
   - `MaxModal.vue` usa `z-index: 59;`
   - `MaxDrawer.vue` usa `z-index: 60;`
   - `MaxPopover.vue` e `MaxPopoverConfirm.vue` usam `z-index: 99;`
   - `MaxBaseOverlay.vue` usa `z-index: 1000+` (gerado incrementalmente por render);
   - `MaxInputSelect.vue` usa `z-index: 1100;`
   - `.max-tooltip` usa `z-index: 99999;`
   Se um usuário abrir um `MaxInputSelect` dentro de um `MaxModal` ou tentar disparar uma confirmação com um tooltip ativo, as camadas entram em colisão visual.

### Causa Raiz Profunda
A causa raiz é a **ausência de um motor unificado de ancoragem e posicionamento flutuante (Floating UI Engine)** e o **uso incorreto de backdrops de tela cheia para simular detecção de clique externo**:
- **Backdrop Invisível vs Click Outside Não-Bloqueante**: Modernos design systems (Radix UI, Floating UI, PrimeVue v4+, Tailwind UI) implementam *Click-Outside* ouvindo eventos de clique no `document`/`window` em fase de captura ou borbulhamento. Isso permite descartar o overlay flutuante enquanto deixa o evento de clique passar diretamente para o elemento clicado pelo usuário (pass-through). No `@maxvue/max-components-ui`, pelo menos 10 componentes renderizam manualmente um elemento `<div class="...backdrop" @click="hide">` fixado em `inset: 0` / `100vh 100vw`. Esse backdrop atua como uma barreira física opaca aos eventos do mouse.
- **Medição Prematura de Geometria Pré-Render**: O cálculo de inversão de direção (flip top/bottom) depende da altura do painel (`height_el`). Como o elemento é montado via `v-if` dentro de um `<Teleport>`, no momento do primeiro ciclo de cálculo do `computed`, a altura do elemento no DOM é `0px`. Vários componentes tentam contornar isso com valores mágicos arbitrários (como `height_el.value || 200` em `MaxInputSelect`), o que causa discrepâncias grotescas quando a lista tem 1 item (50px) ou 15 itens (300px).
- **Desconexão do Ciclo de Scroll da Janela**: O componente `MaxPopoverConfirm` depende de valores escalares numéricos estáticos guardados na store (`confirm_store.x`, `confirm_store.y`), sem qualquer ouvinte de rolagem do elemento pai ou da janela para recalcular o `getBoundingClientRect()`.

---

## 2. Evidência Técnica

### Evidência 1: O "Click Eater" em `MaxInputSelect.vue`
Localização: [`MaxInputSelect.vue#L52-L62`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue#L52-L62) e [`MaxInputSelect.vue#L743-L756`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue#L743-L756)

```html
        <Teleport to="body" v-if="isOpen">
            <div class="max-select-backdrop" @click="hide">
                <div
                    ref="overlayEl"
                    :id="listboxId"
                    class="max-select-overlay p-select-overlay"
                    role="listbox"
                    tabindex="-1"
                    :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width }"
                    @click.stop
                >
```

```scss
.max-select-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1100;
    background: transparent;
    ...
```

Qualquer clique na tela inteira fora da caixinha do select cai no `.max-select-backdrop`, disparando apenas `hide()`. O evento é consumido e descartado, sem jamais atingir o elemento sob o ponteiro do mouse.

### Evidência 2: Altura arbitrária e flip com pulo de render em `MaxInputSelect.vue`
Localização: [`MaxInputSelect.vue#L341-L358`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue#L341-L358)

```ts
    const position = computed(() => {
        const targetX = x.value;
        const targetY = y.value;
        const targetH = height_btn.value;

        const width = getOverlayWidth({ triggerWidth: width_btn.value, windowWidth: window_width.value });

        let top = targetY + targetH + 2;

        if (top + (height_el.value || 200) > window_height.value && targetY - (height_el.value || 200) > 0)
            top = targetY - (height_el.value || 200) - 2;

        return {
            top,
            left: getOverlayLeft(targetX, width, window_width.value),
            width: width + 'px'
        };
    });
```

Quando o dropdown abre, `height_el.value` é `0`. O código assume preventivamente `200`. Quando o DOM monta o conteúdo real, `height_el.value` muda para o valor real (ex: 280px). Se a condição de flip for satisfeita apenas pelo valor real, o menu é instantaneamente reposicionado, causando um "salto" perceptível na cara do usuário.

### Evidência 3: Balão de confirmação desancorado em `MaxPopoverConfirm.vue`
Localização: [`MaxPopoverConfirm.vue#L98-L114`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverConfirm.vue#L98-L114) e [`MaxIconConfirm.vue#L69-L81`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconConfirm.vue#L69-L81)

```ts
    // Em MaxIconConfirm.vue:
    const onClickToggle = () => {
        confirm_store.confirm({
            message: props.message,
            severity: props.severity,
            x: x.value,
            y: y.value,
            width: width.value,
            height: height.value
        });
    };

    // Em MaxPopoverConfirm.vue:
    const position = computed(() => {
        const data = {
            top: confirm_store.y + confirm_store.height + 15,
            left: confirm_store.x,
            isTop: false,
            isLeft: false
        };
        // ...
        return data;
    });
```

`confirm_store.y` e `confirm_store.x` são números primitivos estáticos. Se o usuário acionar o scroll do mouse ou touch gesture, a página de baixo se move, o botão que originou a confirmação viaja para fora da tela, mas o balão de confirmação permanece estacionado na tela em coordenadas fixas desatualizadas.

---

## 3. Impacto na Experiência do Usuário Final e no Produto

1. **Fadiga de Uso e Percepção de Lentidão ("Interface Que Não Responde")**: O usuário final tenta clicar num botão ou campo e "nada acontece" além do fechamento do menu anterior. A necessidade contínua de "clicar duas vezes" desgasta a confiança operacional do operador do sistema.
2. **Risco de Ações Destrutivas por Confusão Visual**: O descolamento do balão de confirmação (`MaxPopoverConfirm`) durante a rolagem pode fazer com que o usuário acredite que está confirmando a exclusão de um registro, quando o balão agora aponta para outro item completamente diferente.
3. **Degradação Estética e Amadorismo da UI**: Saltos visuais e overlays piscando ao abrir passam a nítida sensação de software incompleto e instável.

---

## 4. Recomendações de Solução Arquitetural de UX
1. **Padronizar Todos os Overlays no Padrão `Floating UI` (ou `MaxBaseOverlay`)**:
   - Centralizar toda e qualquer lógica de posicionamento flutuante em um único composable resiliente ou no `MaxBaseOverlay.vue`.
   - Adicionar listener reativo a `scroll` e `resize` (com `passive: true` e `requestAnimationFrame`) em todos os nós ancestrais roláveis.
2. **Eliminar Todos os Backdrops Transparentes de Tela Cheia**:
   - Remover `<div class="...backdrop">` de selects, datepickers, autocompletes e popovers não-modais.
   - Utilizar a diretiva ou composable `onClickOutside` do `@maxvue/max-use` com escuta no `document`, permitindo que o clique que fecha o menu acione imediatamente o elemento clicado (zero "dead clicks").
3. **Definir uma Escala Canônica de Z-Index para o Design System**:
   - Documentar e aplicar tokens semânticos:
     - `z-dropdown`: 1000
     - `z-sticky`: 1100
     - `z-modal-backdrop`: 1200
     - `z-modal`: 1210
     - `z-popover`: 1300
     - `z-tooltip`: 1400
     - `z-toast`: 1500
