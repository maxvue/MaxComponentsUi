# Overhead de useElementHover em Todas as Instâncias do MaxIcon

## Categoria
Reatividade / Event Listener Proliferation / Overhead em Listas Longas

## Severidade
Alta

## Componentes Envolvidos
- [MaxIcon.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIcon.vue#L27-L30)

## Descrição do Problema
No script setup do `MaxIcon.vue`, todo e qualquer ícone instanciado executa incondicionalmente o composable `useElementHover`:

```typescript
// MaxIcon.vue L27-L30
const icon_store = useIconStore();
const icon_ref = ref<HTMLElement | null>(null);
const isHovered = useElementHover(icon_ref as any);
```

Posteriormente, `isHovered` só é consultado para definir `colorStyle`:

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

## Causa Raiz
O `MaxIcon` é o componente mais utilizado em toda a biblioteca. Ele é renderizado dentro de:
- Botões (`MaxButton.vue`, `MaxIconButton.vue`)
- Badges (`MaxBadge.vue`)
- Itens de menu e navegação (`MaxSideMenu.vue`, `MaxTopMenu.vue`, `MaxBottomMenu.vue`)
- Entradas de formulário (`InputBase.vue`, `MaxInputSelect.vue`, `MaxInputAutoComplete.vue`)
- Linhas de tabelas (`MaxTable.vue`, `MaxTableFields.vue`) e listas (`MaxListBox.vue`)

Em uma interface moderna, uma página com tabelas ou dashboards contém facilmente entre **300 e 1.500 instâncias de `MaxIcon`**.

O composable `useElementHover` (vindo do `@vueuse/core` via `@maxvue/max-use`) registra listeners de `mouseenter` e `mouseleave` no elemento DOM em tempo de montagem, associados a uma `Ref<boolean>` reativa.

No entanto, em mais de **99% dos casos de uso**, o ícone não possui `hoverColor` configurado nem o atributo `pointer` ativo! O valor retornado por `hover_color` é idêntico a `color.value`.

## Impacto na Performance
1. **Proliferação de Listeners de Evento**: Milhares de ouvintes DOM de mouse (`mouseenter`/`mouseleave`) são criados e anexados à árvore do navegador para elementos estáticos.
2. **Pressão no Garbage Collector**: Cada chamada a `useElementHover` aloca objetos de monitoramento de eventos e refs de controle reativo.
3. **Overhead durante Scroll e Movimentação do Cursor**: Mover o mouse rapidamente sobre uma tabela ou lista ativa múltiplos disparos em cascata de listeners de hover no motor JS, gerando computação inútil para checar estados reativos que não produzem nenhuma mudança visual.

## Solução Recomendada
1. **Priorizar CSS `:hover`**: Cores de hover em ícones podem ser aplicadas preferencialmente via classes CSS ou variáveis CSS (`--icon-color`, `--icon-hover-color`), transferindo o trabalho do motor JavaScript para a GPU/compositor do navegador.
2. **Ativação Condicional (Lazy Hover)**: Caso o comportamento em JS dinâmico seja indispensável (para manipulação de saturação com `getColorFromVar`), só inicializar `useElementHover` se `props.hoverColor !== undefined` ou `attrs.pointer !== undefined`. Para ícones estáticos, definir `isHovered` como `ref(false)` fixo sem ouvintes DOM.
