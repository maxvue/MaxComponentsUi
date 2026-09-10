# Plano de Implementação: Falha Crítica de Acessibilidade e Tamanho de Toque em MaxIconButton

## 1. Diagnóstico e Objetivo

### Diagnóstico
1. **[`MaxIconButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIconButton.vue#L1-L7):**
   - Renderiza uma tag raiz `<div>` com manipulador de clique `@click="onClick"`, sem `role="button"` e sem `tabindex="0"`.
   - **Inacessibilidade Crítica por Teclado (WCAG 2.1.1):** O componente é usado como base para botões de fechamento de modais (`MaxModal.vue`), gavetas (`MaxDrawer.vue`), botões da barra superior e confirmações (`MaxIconConfirm.vue`). Usuários navegando por teclado são incapazes de alcançar esses botões com a tecla `Tab` ou acioná-los com `Enter`/`Espaço`.
   - **Ausência de Nome Acessível (WCAG 4.1.2):** O botão não possui `aria-label` nem texto equivalente, tornando-o completamente invisível para usuários cegos que utilizam leitores de tela.
   - **Alvo de Toque Crítico (WCAG 2.5.8 e 2.5.5):** O script calcula `size` como `16px * fator` (padrão de apenas **16x16px**). Em dispositivos móveis e touchscreens, essa área é minúscula, gerando frequentes toques acidentais ou falhos.
   - **Sem Foco Visível (WCAG 2.4.7):** O componente não define regras `:focus-visible`.

### Objetivo
- Transformar `MaxIconButton` em um elemento semântico `<button type="button">` (ou elemento com `role="button"` e teclado completo).
- Adicionar suporte a `aria-label` inteligente (extraído de `aria-label`, `label`, `tooltip` ou fallback contextual).
- Garantir área de toque acessível (mínimo de 36px a 44px) através de área clicável expandida via pseudo-elemento `::after`, preservando a escala visual do ícone interno.
- Adicionar indicador de foco visível nítido com `:focus-visible`.

---

## 2. Arquivos a Modificar

- [`src/components/MaxIconButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIconButton.vue)
- [`src/types/index.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/types/index.ts)
- [`tests/unit/MaxIconButton.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxIconButton.spec.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. `MaxIconButton.vue`

#### Alterações no Template
Substituir a tag `<div>` por `<button type="button">` semântico, com atributos ARIA e ouvintes de teclado:
```html
<template>
    <button
        type="button"
        ref="icon_ref"
        :class="`max-icon-button icon-div ico-btn ${hover ? 'hover' : ''} ${props.disabled ? 'is-disabled' : ''}`"
        :style="{
            width: size,
            height: size,
            transform: 'scale(' + (hover && !props.disabled ? props.hoverScale : 1) + ')'
        }"
        :disabled="props.disabled"
        :aria-label="ariaLabelComputed"
        :aria-disabled="props.disabled ? 'true' : undefined"
        @click="onClick"
        @mouseenter="!props.disabled && (hover = true)"
        @mouseleave="hover = false"
    >
        <slot>
            <MaxIcon
                pointer
                :icon="props.icon"
                :i="props.i"
                :dark="props.dark"
                :light="props.light"
                :checked="props.checked"
                :plus="props.plus"
                :rotate="props.rotate"
                :flip="props.flip"
                :size="size"
                :color="props.color ?? props.iconColor"
            />
        </slot>
    </button>
</template>
```

#### Alterações no `<script setup lang="ts">`
Computar o rótulo acessível e assegurar que cliques desabilitados sejam bloqueados:
```typescript
const ariaLabelComputed = computed(() => {
    if (props['aria-label']) return props['aria-label'] as string;
    if (props.label && typeof props.label === 'string' && props.label.trim()) return props.label.trim();
    if (props.title && typeof props.title === 'string' && props.title.trim()) return props.title.trim();
    // Fallbacks contextuais baseados no nome do ícone
    const iconName = props.icon || props.i || '';
    if (iconName.includes('close') || iconName.includes('xmark')) return 'Fechar';
    if (iconName.includes('chevron-down') || iconName.includes('angle-down')) return 'Expandir opções';
    if (iconName.includes('chevron-up') || iconName.includes('angle-up')) return 'Recolher opções';
    if (iconName.includes('search')) return 'Buscar';
    if (iconName.includes('trash') || iconName.includes('delete')) return 'Excluir';
    if (iconName.includes('edit')) return 'Editar';
    if (iconName.includes('plus') || iconName.includes('add')) return 'Adicionar';
    return 'Botão de ação';
});

const onClick = async (event: MouseEvent) => {
    if (props.disabled || executing.value) return;
    executing.value = true;
    try {
        if (props.route) {
            goToRoute(props.route, data.value);
            return;
        }

        if (props.action) {
            await props.action({ event, data: data.value });
            return;
        }

        emit('action', true);
    } finally {
        executing.value = false;
    }
};
```

#### Alterações no SCSS Scoped
```scss
<style lang="scss" scoped>
    .icon-div {
        display: inline-grid;
        place-items: center;
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        transition: transform 0.3s ease, color 0.2s ease-in-out;
        position: relative;
        font-family: inherit;
        line-height: 1;

        // Expansão da área de toque acessível (mínimo 36px) sem deformar o tamanho visual do ícone
        &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            min-width: 36px;
            min-height: 36px;
            width: 100%;
            height: 100%;
        }

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768E);
            outline-offset: 2px;
            border-radius: 4px;
        }

        &.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }
    }
</style>
```

---

## 4. Garantia de Retrocompatibilidade

1. **Tag `<button>` Transparente:**
   - O reset de botão (`background: transparent; border: none; padding: 0;`) preserva exatamente o comportamento visual anterior de `<div>`.
   - Propriedades de centralização, cores de ícone e slots customizados continuam funcionando identicamente.
2. **Propriedades e Tipagem:**
   - Todas as props de `MaxButtonsType` são respeitadas, com inclusão formal de `aria-label?: string`.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação
- [ ] O componente renderiza uma tag semântica `<button type="button">`.
- [ ] Usuários conseguem focar o botão utilizando a tecla `Tab`.
- [ ] Pressionar `Enter` ou `Espaço` com foco no botão aciona o método `onClick` e dispara `@action` ou executa `props.action`/`goToRoute`.
- [ ] Leitores de tela anunciam o nome acessível calculado (ex: "Fechar", "Editar", ou o `aria-label` customizado fornecido).
- [ ] O anel de foco visível `:focus-visible` é renderizado ao receber foco de teclado.
- [ ] A área de toque do elemento cobre no mínimo 36x36px através do pseudo-elemento `::after`.

### Comandos de Validação
```bash
npm run type-check
npx vitest run tests/unit/MaxIconButton.spec.ts
```
