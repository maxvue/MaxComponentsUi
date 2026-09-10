# Resiliência a Valores Nulos e Risco de Quebra na Renderização (Crash por Null/Undefined)

## 1. Contexto e Diagnóstico Técnico
Componentes de interface em aplicações Vue 3 interagem frequentemente com dados assíncronos oriundos de APIs e stores (Pinia). Durante o ciclo de vida de carregamento inicial, transições de rota ou estados de erro, props que aceitam arrays ou objetos costumam receber `undefined` ou `null`.

A auditoria identificou padrões perigosos de desproteção de props, onde métodos e propriedades de protótipos de array (`slice`, `length`, `filter`) são invocados diretamente sobre `props` sem encadeamento opcional (`?.`) ou fallback para array vazio, resultando em exceções `TypeError` não tratadas que derrubam a renderização da árvore de componentes.

## 2. Evidências Críticas no Código-Fonte

### A. Quebra por Chamada de Método Insegura em `src/components/MaxBottomMenu.vue`
[src/components/MaxBottomMenu.vue:L160-L176](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBottomMenu.vue#L160-L176):
```typescript
const midIndex = computed<number>(() => Math.ceil((props.tabs?.length ?? 0) / 2));
const leftTabs = computed<BottomTab[]>(() => props.tabs.slice(0, midIndex.value));
const rightTabs = computed<BottomTab[]>(() => props.tabs.slice(midIndex.value));

const gridStyle = computed(() => {
    if (hasFab.value) {
        const leftCount = leftTabs.value.length;
        const rightCount = rightTabs.value.length;

        return {
            gridTemplateColumns: `repeat(${leftCount}, 1fr) 64px repeat(${rightCount}, 1fr)`
        };
    }

    return {
        gridTemplateColumns: `repeat(${props.tabs.length}, 1fr)`
    };
});
```
**Análise do Defeito:**
- Na linha 160, o desenvolvedor utilizou proteção segura: `props.tabs?.length ?? 0`.
- Imediatamente nas linhas 161 e 162, chamou diretamente `props.tabs.slice(...)`.
- Na linha 175, chamou diretamente `props.tabs.length`.
- Se o consumidor repassar uma prop reativa antes do carregamento (ex.: `<MaxBottomMenu :tabs="asyncTabs.data" />`), ou se passar explicitamente `:tabs="undefined"`, o Vue dispara:
  `TypeError: Cannot read properties of undefined (reading 'slice')`
  Como o `MaxBottomMenu` faz parte do shell principal da aplicação (`MaxApp` / `MaxPageMobileLayout`), a tela inteira quebra em branco.

### B. Inconsistência de Defaults e Colspan Crash em `src/components/MaxTableFields.vue`
[src/components/MaxTableFields.vue:L118](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTableFields.vue#L118), [src/components/MaxTableFields.vue:L133-L136](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTableFields.vue#L133-L136), [src/components/MaxTableFields.vue:L168](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTableFields.vue#L168):
```typescript
defineProps<{
    list?: any[] | Record<string, any>;
    columns: MaxTableColumn[];
    ...
}>(),
{
    list: () => ({}), // Inconsistência: tabela com default de lista como Objeto Vazio {} em vez de Array []
    columns: () => [],
    ...
}

const totalColspan: ComputedRef<number> = computed((): number => props.columns.length + (hasActionsColumn.value ? 1 : 0));
```
**Análise do Defeito:**
- A interface define `columns: MaxTableColumn[]` como obrigatória, mas o `withDefaults` fornece fallback. No entanto, se o consumidor passar `:columns="undefined"` ou `:columns="null as any"`, a computada `totalColspan` executa `props.columns.length`, causando crash fatal de renderização no corpo da tabela.
- O default de `list` é um objeto `{}` em vez de um array `[]`, forçando verificações adicionais e conversão com `Object.entries` mesmo quando o consumidor esperava trabalhar com arrays de registros padronizados.

## 3. Impacto Técnico
- **Crash de Aplicação em Produção:** Exceções do tipo `TypeError: Cannot read properties of undefined` não são recuperáveis pelo Vue a menos que haja um `onErrorCaptured` na raiz, resultando em perda de estado e frustração do usuário.
- **Dificuldade de Consumo Assíncrono:** Desenvolvedores de frontend são obrigados a adicionar `v-if="tabs && tabs.length"` em volta dos componentes da biblioteca para se protegerem contra crashes durante o carregamento de dados.

## 4. Recomendações de Resolução
1. **Padronizar Acesso Defensivo com Nullish Coalescing:**
   - Em `MaxBottomMenu.vue`:
     ```typescript
     const safeTabs = computed<BottomTab[]>(() => props.tabs ?? []);
     const midIndex = computed<number>(() => Math.ceil(safeTabs.value.length / 2));
     const leftTabs = computed<BottomTab[]>(() => safeTabs.value.slice(0, midIndex.value));
     const rightTabs = computed<BottomTab[]>(() => safeTabs.value.slice(midIndex.value));
     ```
2. **Defensiva em `MaxTableFields.vue`:**
   - Garantir `(props.columns?.length ?? 0)` na computada `totalColspan`.
   - Ajustar o default de `list` para `() => []` e normalizar com checagem de tipo `Array.isArray(props.list) ? props.list : (props.list ? Object.values(props.list) : [])`.
3. **Adicionar Testes Unitários de Props Nulas/Indefinidas:**
   - Criar testes específicos no Vitest montando o componente com `props: { tabs: undefined }` e `props: { columns: undefined }` para assegurar renderização graciosa sem erros de console.
