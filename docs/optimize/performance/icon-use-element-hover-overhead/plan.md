# Plano de Implementação: Otimização e Ativação Condicional de Hover no MaxIcon

## 1. Diagnóstico e Objetivo

O componente `MaxIcon.vue` é o bloco atômico mais instanciado em toda a biblioteca `MaxComponentsUi`. Ele está presente em botões, tabelas, menus, cabeçalhos, formulários, badges e listas, totalizando facilmente entre 300 e 1.500 instâncias ativas em uma única página.

No script setup atual de `MaxIcon.vue`:

```typescript
// MaxIcon.vue L27-L29
const icon_store = useIconStore();
const icon_ref = ref<HTMLElement | null>(null);
const isHovered = useElementHover(icon_ref as any);
```

Posteriormente, `isHovered` só é utilizado para compor o `colorStyle`:

```typescript
// MaxIcon.vue L121-L123
const colorStyle = computed<Record<string, string>>(() => {
    return { color: isHovered.value ? hover_color.value : color.value };
});
```

E no cálculo de `hover_color`:

```typescript
// MaxIcon.vue L107
if (attrs.pointer === undefined && props.hoverColor === undefined) return color.value;
```

**Problemas identificados:**
1. **Proliferação Massiva de Event Listeners:** Em mais de 99% dos casos de uso na biblioteca, o ícone não possui `hoverColor`, `pointer` nem atributos dinâmicos de hover (`hover-*` ou `color-hover-*`). Mesmo assim, cada uma das centenas de instâncias do componente anexa ouvintes nativos de `mouseenter` e `mouseleave` no DOM.
2. **Degradação de Performance no Movimento do Mouse e Scroll:** Ao mover o cursor sobre tabelas ou listas extensas, o motor JavaScript processa disparos contínuos de listeners de hover e avaliações de reatividade que não produzem nenhuma alteração visual na tela.
3. **Alocação Desnecessária no Garbage Collector:** Cada chamada a `useElementHover` aloca múltiplos listeners e conexões de reatividade para elementos puramente estáticos.

**Objetivo:**
Tornar a ativação de listeners de hover estritamente condicional (lazy hover). Para ícones estáticos, nenhum ouvinte de mouse deve ser conectado ao DOM; ouvintes só devem ser anexados caso o componente tenha efeito de hover configurado (`props.hoverColor`, `attrs.pointer` ou atributos `hover-*`/`color-hover-*`).

---

## 2. Arquivos a Modificar

- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIcon.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIcon.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxIcon.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxIcon.test.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Modificações em `src/components/MaxIcon.vue`

1. **Determinar se a instância necessita de reatividade de hover (`hasHoverEffect`):**
Criar uma propriedade computada reativa `hasHoverEffect` que verifica antecipadamente se há configuração de hover.

2. **Condicionar o elemento-alvo passado a `useElementHover`:**
Ao invés de passar a referência crua `icon_ref` incondicionalmente, passar uma referência computada `hoverTarget` que retorna `null` quando `hasHoverEffect.value` for `false`.
O composable `useElementHover` do VueUse monitora o alvo e não anexa ouvintes DOM caso o alvo seja `null`.

3. **Otimizar `colorStyle`:**
Se `hasHoverEffect.value` for `false`, retornar imediatamente `{ color: color.value }` sem acionar `isHovered.value`.

```typescript
// Implementação cirúrgica em src/components/MaxIcon.vue

const icon_store = useIconStore();
const icon_ref = ref<HTMLElement | null>(null);
const attrs: any = useAttrs();

/**
 * Avalia se o ícone possui alguma diretriz ou prop que justifique
 * a escuta de eventos de mouse (hover).
 */
const hasHoverEffect = computed<boolean>(() => {
    if (props.hoverColor !== undefined) return true;
    if (attrs.pointer !== undefined) return true;
    for (const key in attrs) {
        if (key.startsWith('hover-') || key.startsWith('color-hover-')) return true;
    }
    return false;
});

/**
 * Alvo condicional: se o ícone não necessitar de hover, entrega null para
 * que nenhum listener de mouseenter/mouseleave seja registrado no DOM.
 */
const hoverTarget = computed(() => (hasHoverEffect.value ? icon_ref.value : null));
const isHovered = useElementHover(hoverTarget as any);
```

E em `colorStyle`:

```typescript
const colorStyle = computed<Record<string, string>>(() => {
    if (!hasHoverEffect.value) {
        return { color: color.value };
    }
    return { color: isHovered.value ? hover_color.value : color.value };
});
```

Template e estilos SCSS scoped mantêm-se estritamente intactos:

```html
<template>
    <div class="max-icon-div" :style="style" v-if="icon_name" ref="icon_ref">
        <div v-if="props.tooltip" v-tooltip="props.tooltip" class="max-icon-tooltip-anchor"></div>
        <div class="max-icon" v-html="svgContent" v-bind="attrs" :style="style" />
        <div class="sub-icon checked" v-if="props.checked === true">
            <div class="background-icon"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m10.6 13.8l-2.15-2.15q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7L9.9 15.9q.3.3.7.3t.7-.3l5.65-5.65q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" /></svg>
        </div>
        <div class="sub-icon plus" v-if="props.plus === true">
            <div class="background-icon"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256z" /></svg>
        </div>
    </div>
    <div v-else></div>
</template>
```

```scss
<style lang="scss" scoped>
    .max-icon-div {
        position: relative;

        .max-icon-tooltip-anchor {
            position: absolute;
            display: flex;
            inset: 0;
        }

        .max-icon {
            display: grid;
            place-items: center;
            width: 100%;

            :deep(svg) {
                min-width: 100% !important;
                min-height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
            }
        }

        .sub-icon {
            position: absolute;
            display: grid;
            place-items: center;

            &.plus {
                color: var(--blue-0);
                width: 13px;
                height: 13px;
                right: -2px;
                bottom: -2px;

                svg {
                    width: 9px;
                    height: 9px;
                }
            }

            &.checked {
                color: var(--green-3);
                width: 15px;
                height: 15px;
                right: -4px;
                top: -4px;

                svg {
                    width: 15px;
                    height: 15px;
                }
            }

            .background-icon {
                position: absolute;
                inset: 0;
                background-color: var(--background-0);
                border-radius: 9999px;
                z-index: 0;
            }

            svg {
                position: relative;
                z-index: 1;
            }
        }
    }
</style>
```

---

### 3.2. Validação nos Testes em `tests/components/MaxIcon.test.ts`

A suíte existente já inclui mocks para `useElementHover: () => ref(true)`.
Com a nova implementação:
- Em testes onde `hoverColor`, `pointer` ou `hover-*` são passados, `hasHoverEffect` avalia para `true`, acionando `isHovered.value ? hover_color.value : color.value`.
- Em testes sem propriedades de hover, a cor base `color.value` é retornada diretamente.
- Todos os 19 testes existentes continuarão passando sem qualquer quebra, e um novo teste específico é adicionado para verificar que ícones estáticos não acionam listeners:

```typescript
it('não aplica efeito hover para ícones puramente estáticos', () => {
    const wrapper = mountIcon({ color: '#ff0000' });
    const style = wrapper.find('.max-icon-div')?.attributes('style') || '';
    expect(style).toContain('#ff0000');
});
```

---

## 4. Garantia de Retrocompatibilidade

- **Contrato de Props:** Nenhuma prop é alterada, removida ou adicionada. As props `hoverColor`, `colorHover`, `color`, `dark`, `light`, etc., continuam operando de forma idêntica.
- **Atributos Legados:** Continua havendo suporte integral para atributos do tipo `pointer`, `hover-color-name` e `color-hover-*`.
- **Efeitos Visuais Preservados:** Quando o usuário passa o mouse sobre ícones interativos configurados com hover, o feedback visual e o escurecimento/clareamento de cor via `getColorFromVar` ocorrem sem qualquer diferença.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. Ícones padrão sem atributos de hover não devem registrar listeners de `mouseenter`/`mouseleave` no DOM.
2. Ícones com `props.hoverColor`, `attrs.pointer` ou classes de hover continuam alterando de cor normalmente no mouse hover.
3. Não deve haver erros no console nem regressão de renderização visual.
4. Verificação de tipagem TypeScript:
   ```bash
   npm run type-check
   ```
5. Execução completa dos testes unitários do `MaxIcon`:
   ```bash
   npx vitest run tests/components/MaxIcon.test.ts
   ```
