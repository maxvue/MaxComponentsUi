# 07 — Regressão completa de acessibilidade WAI-ARIA na reescrita de Tabs

- **Severidade:** Alto
- **Tipo:** Regressão de acessibilidade
- **Arquivos:** [src/components/MaxTabs.vue](../src/components/MaxTabs.vue), [src/components/MaxTabItem.vue](../src/components/MaxTabItem.vue)
- **Estado:** alteração **não commitada** no working tree

## Descrição

A implementação anterior de Tabs seguia o padrão
[WAI-ARIA Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) de forma
deliberada e documentada — os comentários em
[tabsContext.ts](../src/helpers/tabsContext.ts) citam explicitamente a norma
("WAI-ARIA exige exatamente um tab com tabindex 0"). A reescrita elimina esse
suporte por completo.

## Comparativo

| Requisito WAI-ARIA | Antes | Depois |
|---|---|---|
| `role="tablist"` no container | ✅ [MaxTabList.vue:13](../src/components/MaxTabList.vue#L13) | ❌ ausente |
| `role="tab"` nos headers | ✅ | ❌ ausente |
| `role="tabpanel"` nos painéis | ✅ | ❌ removido |
| `aria-selected` no tab ativo | ✅ | ❌ ausente |
| `aria-controls` tab→painel | ✅ | ❌ ausente |
| `aria-labelledby` painel→tab | ✅ | ❌ removido |
| `aria-disabled` em tabs desabilitados | ✅ | ❌ ausente |
| Roving tabindex (exatamente um `tabindex=0`) | ✅ | ❌ ausente |
| Navegação por setas ←/→ | ✅ `navigate()` | ❌ ausente |
| Home/End para primeiro/último | ✅ | ❌ ausente |
| Ativação por Enter/Espaço | ✅ | ❌ ausente |
| Elemento focável | `<button>`/tabindex | ❌ `<div>` sem tabindex |

## Header atual

```vue
<div class="max-tab-item-title" :active="is_active" @click="tabs_info?.selectTab(tab_id)">
```
[MaxTabItem.vue:3](../src/components/MaxTabItem.vue#L3)

Um `<div>` com `@click` e nada mais. Para tecnologia assistiva, isto é um bloco
de texto genérico, não um controle.

## Impacto concreto

**Usuários de teclado:** as abas ficam completamente **inalcançáveis**. Um `div`
sem `tabindex` não entra no fluxo de tabulação e não responde a Enter/Espaço.
Não existe nenhum caminho por teclado para trocar de aba — a funcionalidade fica
disponível exclusivamente para quem usa mouse.

**Usuários de leitor de tela:** sem `role="tab"`/`role="tablist"`, o leitor não
anuncia "aba 2 de 5, selecionada". Sem `aria-controls`/`aria-labelledby`, não há
relação anunciável entre a aba e seu conteúdo. Sem `aria-selected`, não há como
saber qual aba está ativa — o estado é comunicado apenas pelo atributo
não-padrão `active="true"`, que existe só para o seletor CSS
`&[active='true']` e não tem significado semântico algum.

**Indicação de estado só por cor:** o tab ativo é distinguido por
`background-color` e uma barra inferior. Sem `aria-selected`, isso viola
[WCAG 1.4.1 (Use of Color)](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html).

## Conformidade

A regressão descumpre, no mínimo:

- **WCAG 2.1 SC 2.1.1 (Keyboard, Nível A)** — toda funcionalidade deve ser
  operável por teclado.
- **WCAG 2.1 SC 4.1.2 (Name, Role, Value, Nível A)** — componentes de interface
  devem expor nome, papel e estado programaticamente.
- **WCAG 2.1 SC 1.4.1 (Use of Color, Nível A)**.

Para produtos sujeitos a exigências legais de acessibilidade (no Brasil, a
**LBI — Lei 13.146/2015**, art. 63, e o **eMAG** para o setor público), isso pode
representar um risco de conformidade e não apenas uma questão de qualidade.

## Correção recomendada

Se a nova arquitetura de `MaxTabItem` for mantida (Rota A do achado 01), o
suporte ARIA precisa ser reimplementado nela — não é opcional. Esboço mínimo:

```vue
<teleport :to="'#max-tab-' + tabs_id" v-if="tabs_id && is_mounted">
    <button type="button" class="max-tab-item-title" role="tab" :id="`${tabs_id}-tab-${tab_id}`"
            :aria-selected="is_active" :aria-controls="`${tabs_id}-panel-${tab_id}`"
            :tabindex="is_active ? 0 : -1" :aria-disabled="props.disabled || undefined"
            @click="select" @keydown="onKeydown">
        <MaxIcon :icon="props.icon ?? props.i" v-if="props.icon || props.i" size="1.2" />
        {{ props.title }}
    </button>
</teleport>
<div class="max-tab-item-content" role="tabpanel" :id="`${tabs_id}-panel-${tab_id}`"
     :aria-labelledby="`${tabs_id}-tab-${tab_id}`" v-if="is_active">
    <slot></slot>
</div>
```

E adicionar `role="tablist"` ao container `.max-tabs-title` em
[MaxTabs.vue:3](../src/components/MaxTabs.vue#L3), além de reimplementar a
navegação por setas/Home/End que existia em
[MaxTabList.vue:50-77](../src/components/MaxTabList.vue#L50-L77).

Nota: trocar `<div>` por `<button>` também resolve o foco e a ativação por
Enter/Espaço nativamente, sem código adicional.

A implementação anterior já resolvia tudo isso e tinha **cobertura de testes
dedicada** para cada requisito (roving tabindex, value órfão, tab removido
dinamicamente). Descartá-la sem reimplementar equivale a perder trabalho de
acessibilidade já validado.
