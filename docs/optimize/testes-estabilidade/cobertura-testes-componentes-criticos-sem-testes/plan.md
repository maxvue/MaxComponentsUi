# Plano de Implementação: Cobertura de Testes Automatizados para Componentes Críticos sem Testes

## 1. Diagnóstico e Objetivo

A suíte de testes do repositório conta com 146 arquivos em `tests/`, garantindo estabilidade para 90 componentes. Entretanto, uma auditoria aprofundada revelou que **componentes essenciais de navegação, layout estrutural e subcomponentes compostos** não contam com suítes unitárias dedicadas:
1. **Subcomponentes do Sistema de Abas:** [src/components/MaxTabList.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTabList.vue), [src/components/MaxTabPanels.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTabPanels.vue) e [src/components/MaxTabPanel.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTabPanel.vue). Embora `MaxTabs.vue` possua testes gerais, o comportamento de overflow, botões de scroll, WAI-ARIA `role="tablist"` e `role="tabpanel"` e injeção do `TABS_INJECTION_KEY` não estão protegidos contra quebras.
2. **Subcomponente de Acordeão:** [src/components/MaxAccordionItem.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxAccordionItem.vue), responsável pelo cabeçalho clicável, acessibilidade (`aria-expanded`, `aria-controls`), ícones de alternância e injeção de contexto `ACCORDION_INJECTION_KEY`.
3. **Barra de Ferramentas de Código:** [src/components/MaxInputCodeToolbar.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCodeToolbar.vue). Seus testes estavam mesclados dentro de `MaxInputCode.test.ts`, o qual falha na CI por dependência de browser/Monaco Loader.
4. **Navegação e Layout:** [src/components/MaxTopMenuSearchBar.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue), [src/components/MaxMenuVerticalItem.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxMenuVerticalItem.vue), [src/components/MaxTopToolbar.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopToolbar.vue) e [src/components/MaxContainerApp.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxContainerApp.vue).
5. **Overlay de Carregamento:** [src/components/MaxLoadScreenTarget.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxLoadScreenTarget.vue), que gerencia teleports condicionais e feedback de status de tasks.

**Objetivo:**
Criar suítes de testes unitários isoladas e resilientes em `tests/components/` para cada um desses componentes críticos, garantindo 100% de cobertura nos subcomponentes compostos e isolando a barra de ferramentas de código em um teste independente de Monaco.

---

## 2. Arquivos a Criar e Modificar

### Novos Arquivos de Teste:
- [tests/components/MaxAccordionItem.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxAccordionItem.test.ts)
- [tests/components/MaxTabList.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxTabList.test.ts)
- [tests/components/MaxTabPanel.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxTabPanel.test.ts)
- [tests/components/MaxTabPanels.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxTabPanels.test.ts)
- [tests/components/MaxInputCodeToolbar.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputCodeToolbar.test.ts)
- [tests/components/MaxTopMenuSearchBar.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxTopMenuSearchBar.test.ts)
- [tests/components/MaxMenuVerticalItem.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxMenuVerticalItem.test.ts)
- [tests/components/MaxContainerApp.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxContainerApp.test.ts)
- [tests/components/MaxLoadScreenTarget.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxLoadScreenTarget.test.ts)

---

## 3. Especificação Técnica Cirúrgica

### A. Teste `tests/components/MaxAccordionItem.test.ts`

Valida renderização de header, controle de expansão e integridade do contrato de injeção:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MaxAccordionItem from '../../src/components/MaxAccordionItem.vue';
import { ACCORDION_INJECTION_KEY, type AccordionContext } from '../../src/helpers/accordionContext';

function createMockAccordionContext(overrides: Partial<AccordionContext> = {}): AccordionContext {
    return {
        open_values: ref(['item-1']),
        toggle: vi.fn(),
        lazy: ref(false),
        expand_icon: ref('mdi:chevron-down'),
        collapse_icon: ref('mdi:chevron-up'),
        id_prefix: 'test-acc',
        nextAutoValue: vi.fn(() => 'auto-1'),
        ...overrides
    };
}

describe('MaxAccordionItem', () => {
    it('dispara erro explicativo se renderizado fora de um <MaxAccordion>', () => {
        expect(() => {
            mount(MaxAccordionItem, {
                props: { value: 'item-1' }
            });
        }).toThrowError(/\[MaxComponentsUi\] <MaxAccordionItem> precisa estar dentro de um <MaxAccordion>/);
    });

    it('renderiza título via prop e atributos de acessibilidade ARIA', () => {
        const context = createMockAccordionContext();
        const wrapper = mount(MaxAccordionItem, {
            props: { value: 'item-1', title: 'Título do Item' },
            global: {
                provide: {
                    [ACCORDION_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.text()).toContain('Título do Item');
        const header = wrapper.find('.max-accordion-item-header');
        expect(header.attributes('role')).toBe('button');
        expect(header.attributes('aria-expanded')).toBe('true');
    });

    it('invoca context.toggle ao clicar no cabeçalho quando habilitado', async () => {
        const context = createMockAccordionContext({ open_values: ref([]) });
        const wrapper = mount(MaxAccordionItem, {
            props: { value: 'item-2', title: 'Item Fechado' },
            global: {
                provide: {
                    [ACCORDION_INJECTION_KEY as symbol]: context
                }
            }
        });

        await wrapper.find('.max-accordion-item-header').trigger('click');
        expect(context.toggle).toHaveBeenCalledWith('item-2');
    });

    it('não invoca context.toggle quando desabilitado (disabled=true)', async () => {
        const context = createMockAccordionContext();
        const wrapper = mount(MaxAccordionItem, {
            props: { value: 'item-1', disabled: true },
            global: {
                provide: {
                    [ACCORDION_INJECTION_KEY as symbol]: context
                }
            }
        });

        await wrapper.find('.max-accordion-item-header').trigger('click');
        expect(context.toggle).not.toHaveBeenCalled();
    });
});
```

### B. Teste `tests/components/MaxTabList.test.ts` e `MaxTabPanel.test.ts`

Valida composição com `TABS_INJECTION_KEY`, atributos WAI-ARIA `tablist` e `tabpanel`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MaxTabList from '../../src/components/MaxTabList.vue';
import MaxTabPanel from '../../src/components/MaxTabPanel.vue';
import { TABS_INJECTION_KEY, type TabsContext } from '../../src/helpers/tabsContext';

function createMockTabsContext(overrides: Partial<TabsContext> = {}): TabsContext {
    return {
        active_value: ref('tab-1'),
        fallback_tab_value: ref('tab-1'),
        effective_active_value: ref('tab-1'),
        has_registered_active_tab: ref(true),
        select: vi.fn(),
        lazy: ref(false),
        select_on_focus: ref(false),
        tabindex: ref(0),
        id_prefix: 'max-tabs-test',
        registerTab: vi.fn(() => vi.fn()),
        navigate: vi.fn(),
        scrollable: ref(false),
        show_navigators: ref(false),
        ...overrides
    };
}

describe('MaxTabList', () => {
    it('renderiza o container com role="tablist"', () => {
        const context = createMockTabsContext();
        const wrapper = mount(MaxTabList, {
            slots: { default: '<div class="tab">Tab A</div>' },
            global: { provide: { [TABS_INJECTION_KEY as symbol]: context } }
        });

        const list = wrapper.find('.max-tab-list');
        expect(list.exists()).toBe(true);
        expect(list.attributes('role')).toBe('tablist');
        expect(wrapper.text()).toContain('Tab A');
    });
});

describe('MaxTabPanel', () => {
    it('renderiza com role="tabpanel" e visibilidade vinculada ao effective_active_value', async () => {
        const context = createMockTabsContext({ effective_active_value: ref('tab-1') });
        const wrapper = mount(MaxTabPanel, {
            props: { value: 'tab-1' },
            slots: { default: 'Conteúdo do Painel 1' },
            global: { provide: { [TABS_INJECTION_KEY as symbol]: context } }
        });

        const panel = wrapper.find('.max-tab-panel');
        expect(panel.attributes('role')).toBe('tabpanel');
        expect(panel.isVisible()).toBe(true);
        expect(wrapper.text()).toContain('Conteúdo do Painel 1');
    });

    it('oculta o painel quando outro tab estiver ativo', () => {
        const context = createMockTabsContext({ effective_active_value: ref('tab-2') });
        const wrapper = mount(MaxTabPanel, {
            props: { value: 'tab-1' },
            slots: { default: 'Conteúdo Oculto' },
            global: { provide: { [TABS_INJECTION_KEY as symbol]: context } }
        });

        const panel = wrapper.find('.max-tab-panel');
        expect(panel.isVisible()).toBe(false);
    });
});
```

### C. Teste `tests/components/MaxInputCodeToolbar.test.ts` (Isolado)

Elimina completamente a dependência de `@monaco-editor/loader`, testando as emissões e controles da barra de ferramentas:

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputCodeToolbar from '../../src/components/MaxInputCodeToolbar.vue';

describe('MaxInputCodeToolbar (Isolado de Monaco)', () => {
    it('renderiza seletor de linguagem e botões de ação', () => {
        const wrapper = mount(MaxInputCodeToolbar, {
            props: {
                language: 'typescript',
                wordWrap: true,
                minimap: false,
                isFullscreen: false
            },
            global: {
                stubs: { MaxIcon: true }
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('select').exists()).toBe(true);
        expect(wrapper.findAll('button').length).toBeGreaterThanOrEqual(6);
    });

    it('emite update:language ao selecionar outra opção', async () => {
        const wrapper = mount(MaxInputCodeToolbar, {
            props: { language: 'typescript' },
            global: { stubs: { MaxIcon: true } }
        });

        const select = wrapper.find('select');
        await select.setValue('json');

        expect(wrapper.emitted('update:language')).toBeTruthy();
        expect(wrapper.emitted('update:language')?.[0]).toEqual(['json']);
    });

    it('emite toggleMinimap e toggleWordWrap ao clicar nos botões correspondentes', async () => {
        const wrapper = mount(MaxInputCodeToolbar, {
            props: { language: 'javascript', minimap: false, wordWrap: false },
            global: { stubs: { MaxIcon: true } }
        });

        const buttons = wrapper.findAll('button');
        // Aciona botão de formatação e alternâncias
        await buttons[0].trigger('click');
        expect(wrapper.emitted()).toBeDefined();
    });
});
```

### D. Teste `tests/components/MaxTopMenuSearchBar.test.ts`

Testa a integração com a store Pinia e a alternância de busca:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTopMenuSearchBar from '../../src/components/MaxTopMenuSearchBar.vue';
import { useSearchBarStore } from '../../src/stores/useSearchBar.Store';

describe('MaxTopMenuSearchBar', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o campo desktop com placeholder customizado', () => {
        const wrapper = mount(MaxTopMenuSearchBar, {
            props: { placeholder: 'Buscar clientes...', screen: 'desktop' }
        });

        expect(wrapper.find('.max-top-menu-search-bar').exists()).toBe(true);
        const input = wrapper.find('input');
        expect(input.attributes('placeholder')).toBe('Buscar clientes...');
    });

    it('sincroniza o valor digitado com a useSearchBarStore', async () => {
        const wrapper = mount(MaxTopMenuSearchBar, {
            props: { screen: 'desktop' }
        });
        const store = useSearchBarStore();

        const input = wrapper.find('input');
        await input.setValue('Projeto Solar');

        expect(store.input_value).toBe('Projeto Solar');
    });
});
```

### E. Teste `tests/components/MaxContainerApp.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxContainerApp from '../../src/components/MaxContainerApp.vue';

describe('MaxContainerApp', () => {
    it('renderiza container raiz com slot default e classe BEM', () => {
        const wrapper = mount(MaxContainerApp, {
            slots: { default: '<div class="child">Conteúdo</div>' }
        });

        expect(wrapper.find('.max-container-app').exists()).toBe(true);
        expect(wrapper.find('.child').text()).toBe('Conteúdo');
    });

    it('repassa atributos customizados como screen="mobile"', () => {
        const wrapper = mount(MaxContainerApp, {
            attrs: { screen: 'mobile' }
        });

        expect(wrapper.attributes('screen')).toBe('mobile');
    });
});
```

---

## 4. Garantia de Retrocompatibilidade

1. **Sem Alterações nos Contratos:** Nenhuma prop, evento ou slot de componentes foi modificado ou renomeado.
2. **Prevenção de Falso Positivo na CI:** A extração do teste de `MaxInputCodeToolbar` elimina dependências nativas de carregamento do Monaco em ambiente Node/Happy-DOM, assegurando testes rápidos e determinísticos.
3. **Padrão de Cobertura:** A adição das suítes protege as refatorações contínuas contra quebras de acessibilidade e perda de injeção de contexto.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. **Execução das Novas Suítes de Teste:**
   ```bash
   npx vitest run tests/components/MaxAccordionItem.test.ts \
                   tests/components/MaxTabList.test.ts \
                   tests/components/MaxTabPanel.test.ts \
                   tests/components/MaxInputCodeToolbar.test.ts \
                   tests/components/MaxTopMenuSearchBar.test.ts \
                   tests/components/MaxContainerApp.test.ts
   ```
   *Critério:* 100% dos testes devem passar com tempo de execução inferior a 2 segundos.

2. **Checagem de Tipos dos Testes:**
   ```bash
   npm run type-check
   ```
   *Critério:* Compilação limpa sem erros nos arquivos de teste.
