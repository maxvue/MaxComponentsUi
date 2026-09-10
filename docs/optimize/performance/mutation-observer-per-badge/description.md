# Instanciação Redundante de MutationObserver em Cada Instância de MaxBadge

## Categoria
Performance de Renderização / Observer Overhead / Listas Longas

## Severidade
Alta

## Componentes Envolvidos
- [MaxBadge.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBadge.vue#L96-L128)

## Descrição do Problema
O componente `MaxBadge.vue` instancia um `MutationObserver` próprio para monitorar se a classe `.dark` foi adicionada ou removida de `document.documentElement`:

```typescript
// MaxBadge.vue L96-L123
const attrs = useAttrs();
const isHtmlDark = ref(false);
let htmlObserver: MutationObserver | null = null;

const checkHtmlDark = () => {
    if (typeof document !== 'undefined') isHtmlDark.value = document.documentElement.classList.contains('dark');
};

onMounted(() => {
    checkHtmlDark();
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
        htmlObserver = new MutationObserver(() => {
            checkHtmlDark();
        });
        htmlObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
});

onBeforeUnmount(() => {
    if (htmlObserver) {
        htmlObserver.disconnect();
        htmlObserver = null;
    }
});
```

## Causa Raiz
Badges são componentes atômicos de apresentação, frequentemente renderizados em grande escala:
- Em tabelas com dezenas ou centenas de linhas (`MaxTable.vue`, `MaxTableFields.vue`), cada linha pode exibir de 1 a 4 badges (status, categorias, tags).
- Em listas ou selects virtuais (`MaxListBox.vue`), badges aparecem em quase todos os itens.

Em uma tela com 200 badges visíveis, o código atual cria **200 instâncias distintas de `MutationObserver`**, todas apontando para o mesmo elemento DOM raiz (`document.documentElement`).

## Impacto na Performance
1. **Consumo Excessivo de Memória**: Cada `MutationObserver` consome memória no motor C++ do navegador e mantém referências reativas de cada instância do componente.
2. **Microtask Thrashing em Trocas de Classe**: Sempre que qualquer classe no elemento `<html>` for alterada (por exemplo, ao alternar entre tema claro e escuro ou ao manipular classes globais como `.max-scroll-locked`), a fila de microtasks do navegador recebe centenas de callbacks que executam simultaneamente, disparando reatividade e re-render em massa de todos os badges.
3. **Overhead de Montagem e Desmonte**: Em tabelas com paginação ou filtros dinâmicos, montar e desmontar dezenas de `MutationObserver` consecutivamente degrada o tempo de resposta e o FPS de transição.

## Solução Recomendada
Há duas soluções arquiteturais recomendadas:

### Opção A (Ideal - CSS Nativo)
Tratar as variações de tema via CSS (`:root.dark .max-badge` ou estilos com seletor ancestral), eliminando completamente a necessidade de observação via JavaScript para estilização padrão.

### Opção B (Estado Reativo Centralizado / Composable Compartilhado)
Criar um composable singleton ou utilizar a store do sistema (`useSystemStore` / `useTheme`) com um **único** observer global compartilhado por toda a aplicação:

```typescript
// sharedTheme.ts (Singleton)
import { ref } from 'vue';

const isDarkMode = ref(typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false);

if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    const observer = new MutationObserver(() => {
        isDarkMode.value = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

export const useSharedDarkMode = () => isDarkMode;
```

No `MaxBadge.vue`:
```typescript
const isHtmlDark = useSharedDarkMode();
```
Isso reduz o número de observers de $N$ para $1$ para toda a aplicação.
