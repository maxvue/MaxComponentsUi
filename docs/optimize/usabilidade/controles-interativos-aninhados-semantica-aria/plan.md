# Plano de Implementação: Eliminação de Controles Interativos Aninhados e Padronização Semântica WAI-ARIA

## 1. Objetivo da Refatoração

Eliminar as violações críticas da especificação HTML5 e dos padrões WAI-ARIA decorrentes do aninhamento ilegal de controles interativos (*nested interactive controls*) e da omissão de atributos semânticos fundamentais (`aria-sort` e `aria-pressed`) nos componentes `MaxPopoverMenu`, `MaxUserSection`, `MaxTable`, `MaxInputMarkdownToolbar` e `MaxBottomMenu`.

Problemas estruturais a solucionar:
1. **Aninhamento Ilegal de Botões**:
   - Em `MaxPopoverMenu.vue`, a tag `<div class="botao" role="button" tabindex="0">` envolve um `<MaxButton>` que renderiza `<button type="button">`. A especificação HTML5 proíbe expressamente que elementos de conteúdo interativo contenham descendentes interativos. No leitor de tela, isso gera anúncios duplicados e confusos ("botão, botão de ação, recolhido") e cliques duplos em telas sensíveis ao toque.
   - Em `MaxUserSection.vue`, o nó raiz é declarado como `<div class="max-user-section" role="button" tabindex="0">` e abriga dentro de sua estrutura outro controle clicável independente (`.impersonated-btn`).
2. **Invisibilidade de Ordenação em Tabelas (`MaxTable`)**:
   - Cabeçalhos ordenáveis (`col.sortable`) são disparados apenas com `@click` no mouse, não possuem `tabindex="0"`, não respondem a `Enter`/`Space` e nunca declaram `aria-sort="ascending" | "descending" | "none"`. Usuários de tecnologia assistiva desconhecem que as colunas são ordenáveis e não são informados sobre a direção da ordenação ativa.
3. **Omissão de `aria-pressed` na Toolbar de Markdown**:
   - Botões de alternância de estilo (negrito, itálico, etc.) utilizam apenas classes CSS visuais (`active`), sem comunicar o estado ativo/inativo ao leitor de tela via `aria-pressed`.

Este plano estabelece o desacoplamento dos nós DOM e a introdução da semântica ARIA canônica.

---

## 2. Arquivos Afetados

### Componentes com Controles Aninhados
- [`src/components/MaxPopoverMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverMenu.vue)
- [`src/components/MaxUserSection.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserSection.vue)
- [`src/components/MaxBottomMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxBottomMenu.vue)

### Componentes com Semântica ARIA Omitida
- [`src/components/MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTable.vue)
- [`src/components/MaxInputMarkdownToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputMarkdownToolbar.vue)

### Testes
- [`tests/components/AriaSemanticsAndNestedControls.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/AriaSemanticsAndNestedControls.test.ts) (Novo arquivo de validação semântica ARIA e de aninhamento)
- Testes existentes: `tests/components/MaxPopoverMenu.test.ts`, `tests/components/MaxTable.test.ts`.

---

## 3. Passo a Passo Detalhado da Implementação

### Passo 1: Desaninhamento do Gatilho em `MaxPopoverMenu.vue`
1. **Eliminação do Papel de Botão no Wrapper Intermediário**:
   A tag `.botao` deve atuar exclusivamente como container estrutural de posicionamento, transferindo toda a semântica, acessibilidade e listeners diretamente para o elemento interativo único.
   ```vue
   <!-- ANTES (Violação): -->
   <!-- <div class="botao" role="button" tabindex="0" aria-haspopup="menu" ...> -->
   <!--     <slot name="button"><MaxButton ... /></slot> -->
   <!-- </div> -->

   <!-- DEPOIS (Semântico e Conforme): -->
   <div class="max-popover-menu" ref="btn_el" :style="{ width: size_icon, height: size_icon }">
       <div class="botao" ref="triggerButtonRef">
           <slot
               name="button"
               :toggle="toggle"
               :is-open="isOpen"
               :menu-id="menuId"
           >
               <MaxButton
                   v-bind="props"
                   :size="props.size ?? props.sizeIcon"
                   class="max-popover-menu-btn"
                   aria-haspopup="menu"
                   :aria-expanded="isOpen"
                   :aria-controls="menuId"
                   @click.stop="toggle"
                   @keydown.enter.prevent="toggle"
                   @keydown.space.prevent="toggle"
                   @keydown.down.prevent="openAndFocusFirst"
                   @keydown.up.prevent="openAndFocusLast"
               />
           </slot>
       </div>
       ...
   </div>
   ```
2. **Suporte a Botão Customizado no Slot `#button`**:
   - Caso o consumidor forneça seu próprio botão no slot `#button`, os dados e atalhos (`:toggle`, `:is-open`, `:menu-id`) são passados via slot props para que o botão consumidor assuma a responsabilidade sem conflito com o container.

### Passo 2: Desacoplamento Estrutural em `MaxUserSection.vue`
1. **Separação em Controles Irmãos Independentes**:
   O nó raiz `div.max-user-section` torna-se um contêiner neutro de layout, eliminando `role="button"` e `tabindex="0"`.
2. **Divisão em Dois Botões Distintos**:
   ```vue
   <template>
       <div
           class="max-user-section user-section"
           :class="{ 'only-avatar': isCompact }"
           :screen="props.screen"
           ref="root_el"
       >
           <!-- Botão 1: Abertura do Perfil e Menu do Usuário -->
           <button
               type="button"
               class="user-profile-trigger-btn"
               aria-haspopup="menu"
               :aria-expanded="isOpen"
               :aria-controls="userMenuId"
               aria-label="Perfil do usuário"
               @click.stop="toggle"
               @keydown.enter.prevent="toggle"
               @keydown.space.prevent="toggle"
               @keydown.down.prevent="openAndFocusFirst"
               @keydown.up.prevent="openAndFocusLast"
           >
               <div v-if="!isCompact" class="user-text-div">
                   <div v-if="props.companyName" class="solar-company-text">
                       {{ props.companyName }}
                   </div>
                   <div class="user-name-text">
                       {{ props.name }}
                   </div>
               </div>
               <div class="button-avatar" :class="{ 'mobile-user-avatar': isCompact }">
                   <MaxUserAvatar
                       v-if="props.userId || props.avatarUrl"
                       :image-url="props.avatarUrl"
                       :name="props.name"
                       :show-tooltip="false"
                   />
                   <MaxIcon v-else icon="clarity:avatar-solid" size="1.2" light />
               </div>
           </button>

           <!-- Botão 2: Encerrar Personificação (Irmão independente, não aninhado) -->
           <button
               v-if="props.isImpersonated && !isCompact"
               type="button"
               class="impersonated-btn"
               :aria-label="`${props.labelEndImpersonate} - ${props.labelEndImpersonateSub}`"
               @click.stop="onEndImpersonate"
           >
               <div class="impersonated-btn-grid">
                   <MaxIcon i="ci:user-close" icon-blue size="1.3" />
                   <div class="impersonated-btn-label">
                       <div class="a">{{ props.labelEndImpersonate }}</div>
                       <div class="b">{{ props.labelEndImpersonateSub }}</div>
                   </div>
               </div>
           </button>
           ...
       </div>
   </template>
   ```
3. **Ajuste de Estilo SCSS**:
   - Adicionar a classe `.user-profile-trigger-btn` com `background: none; border: none; padding: 0; display: flex; align-items: center; cursor: pointer;` garantindo fidelidade visual idêntica ao design pré-existente.

### Passo 3: Implementação de Semântica e Ordenação por Teclado em `MaxTable.vue`
1. **Enriquecimento do Elemento `<th>` Ordenável**:
   No loop de colunas (`resolvedColumns`), aplicar atributos de acessibilidade quando `col.sortable` for verdadeiro:
   ```vue
   <th
       v-for="col in resolvedColumns"
       :key="col.field || col.header || 'col'"
       :class="[
           'max-table-th',
           col.class,
           col.headerClass,
           { 'max-table-th-sortable': col.sortable }
       ]"
       :style="getColumnStyle(col)"
       :tabindex="col.sortable ? 0 : undefined"
       :aria-sort="getAriaSort(col)"
       :aria-label="col.sortable ? `Ordenar por ${col.header}` : undefined"
       @click="onHeaderClick(col)"
       @keydown.enter.prevent="col.sortable && onHeaderClick(col)"
       @keydown.space.prevent="col.sortable && onHeaderClick(col)"
   >
   ```
2. **Método Auxiliar `getAriaSort`**:
   ```typescript
   const getAriaSort = (col: any): 'ascending' | 'descending' | 'none' | undefined => {
       if (!col.sortable) return undefined;
       if (sortField.value !== col.field) return 'none';
       return sortOrder.value === 1 ? 'ascending' : 'descending';
   };
   ```
3. **Ocultação de SVGs Decorativos**:
   Adicionar `aria-hidden="true"` e `focusable="false"` em todas as tags `<svg>` de setas de ordenação:
   ```vue
   <svg class="sort-icon-svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
   ```

### Passo 4: Implementação de `aria-pressed` em `MaxInputMarkdownToolbar.vue`
Nos botões de formatação do tipo alternância (*toggle*):
1. **Negrito**:
   ```vue
   <button
       type="button"
       class="md-toolbar__btn"
       :class="{ active: editor?.isActive('bold') }"
       :aria-pressed="Boolean(editor?.isActive('bold')) ? 'true' : 'false'"
       aria-label="Negrito"
       title="Negrito (Ctrl+B)"
       ...
   ```
2. **Itálico, Sublinhado e Tachado**:
   Aplicar `:aria-pressed="Boolean(editor?.isActive('italic')) ? 'true' : 'false'"` e `aria-label="Itálico"`.
   Aplicar `:aria-pressed="Boolean(editor?.isActive('underline')) ? 'true' : 'false'"` e `aria-label="Sublinhado"`.
   Aplicar `:aria-pressed="Boolean(editor?.isActive('strike')) ? 'true' : 'false'"` e `aria-label="Tachado"`.
3. **Listas e Blocos de Código**:
   Aplicar `:aria-pressed="Boolean(editor?.isActive('bulletList')) ? 'true' : 'false'"` e `:aria-pressed="Boolean(editor?.isActive('orderedList')) ? 'true' : 'false'"`.

### Passo 5: Verificação de `MaxBottomMenu.vue`
Garantir que a inserção de `MaxPopoverMenu` dentro do slot `#fab` não crie elementos clicáveis sobrepostos:
- A remoção de `role="button"` e `tabindex="0"` do wrapper em `MaxPopoverMenu` garante que o botão `.fab` de `MaxBottomMenu` funcione como o único nó interativo no DOM.

---

## 4. Padrões WCAG 2.1/2.2 e Diretrizes do GEMINI.md

| Critério WCAG | Nível | Como a Implementação Cumpre o Padrão |
|---|---|---|
| **4.1.2 Name, Role, Value** | A | Elimina totalmente aninhamento ilegal de botões; expõe estados precisos de alternância (`aria-pressed`) e ordenação (`aria-sort`). |
| **2.1.1 Keyboard** | A | Ordenação de colunas em tabelas passa a ser totalmente executável via teclas `Enter` e `Space`. |
| **1.3.1 Info and Relationships** | A | O estado de ordenação ("crescente" ou "decrescente") é transmitido programaticamente às tecnologias assistivas via WAI-ARIA `aria-sort`. |
| **HTML5 Interactive Content** | N/A | Total conformidade com a regra de conteúdo interativo: nenhum controle interativo contém descendentes interativos. |

### Diretrizes de Estilização (GEMINI.md)
- Estilização estritamente em `<style lang="scss" scoped>`.
- Aninhamento SCSS espelhando a hierarquia do template.
- Zero classes utilitárias inline no template.

---

## 5. Critérios de Aceite e Verificação Técnica

### Critérios de Aceite
1. **Validação Estrutural do DOM**:
   - Nenhum elemento com tag `<button>` ou atributo `role="button"` deve ser renderizado como descendente de outro elemento com `role="button"` ou `<button>` em `MaxPopoverMenu`, `MaxUserSection` e `MaxBottomMenu`.
2. **Operação e Anúncio de Ordenação em `MaxTable`**:
   - O cabeçalho de coluna ordenável deve receber foco via `Tab`.
   - Pressionar `Enter` ou `Space` alterna a ordenação entre crescente, decrescente e neutro.
   - O atributo `aria-sort` deve refletir fielmente o estado: `"ascending"`, `"descending"` ou `"none"`.
3. **Estado de Botões na Toolbar Markdown**:
   - Ao posicionar o cursor de texto sobre um trecho em negrito, o botão de Negrito na barra de ferramentas deve possuir `aria-pressed="true"`.
4. **Ausência de Erros de Tipos e Lint**:
   - `npm run type-check` e `npm run lint` devem passar com sucesso.

### Suíte de Testes Automatizados (`tests/components/AriaSemanticsAndNestedControls.test.ts`)
```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import MaxPopoverMenu from '../../src/components/MaxPopoverMenu.vue';
import MaxUserSection from '../../src/components/MaxUserSection.vue';
import MaxTable from '../../src/components/MaxTable.vue';

describe('Eliminação de Controles Aninhados e Validação de Semântica ARIA', () => {
    it('MaxPopoverMenu não deve aninhar um button dentro de outro role=button', () => {
        const wrapper = mount(MaxPopoverMenu, {
            props: { items: [{ label: 'Opção 1' }] }
        });
        // Não deve haver nenhum elemento com role="button" que tenha outro button ou role="button" como filho
        const buttonContainers = wrapper.findAll('[role="button"]');
        for (const container of buttonContainers) {
            expect(container.find('button').exists()).toBe(false);
        }
    });

    it('MaxUserSection não deve ter controles clicáveis aninhados na raiz', () => {
        const wrapper = mount(MaxUserSection, {
            props: { name: 'João Silva', isImpersonated: true }
        });
        expect(wrapper.element.getAttribute('role')).not.toBe('button');
        const buttons = wrapper.findAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2); // profile trigger + impersonated btn
    });

    it('MaxTable deve aplicar aria-sort e responder a teclas de ordenação', async () => {
        const wrapper = mount(MaxTable, {
            props: {
                columns: [{ field: 'name', header: 'Nome', sortable: true }],
                items: [{ name: 'Alfa' }, { name: 'Beta' }]
            }
        });
        const th = wrapper.find('.max-table-th-sortable');
        expect(th.attributes('tabindex')).toBe('0');
        expect(th.attributes('aria-sort')).toBe('none');

        await th.trigger('keydown', { key: 'Enter' });
        expect(th.attributes('aria-sort')).toBe('ascending');

        await th.trigger('keydown', { key: 'Enter' });
        expect(th.attributes('aria-sort')).toBe('descending');
    });
});
```

---

## 6. Mitigação de Riscos de Regressão

| Risco Potencial | Probabilidade | Impacto | Estratégia de Mitigação |
|---|---|---|---|
| **Quebra de layout ou alinhamento no `MaxUserSection`** | Média | Médio | A nova tag `<button type="button" class="user-profile-trigger-btn">` herdará exatamente as regras de flex/grid e dimensões do container anterior, mantendo 100% da fidelidade visual em desktops e dispositivos móveis. |
| **Consumidores que aplicavam eventos diretamente na div `botao` de `MaxPopoverMenu`** | Baixa | Baixo | A div `botao` continua existindo no DOM para fins de estilização, e o slot scoped repassa métodos de controle reativos (`toggle`, `isOpen`). |
| **Comportamento de ordenação em tabelas sem paginação remota** | Baixa | Baixo | Os eventos acionados por teclado invocam exatamente a mesma função interna `onHeaderClick(col)` acionada pelo clique do mouse. |
