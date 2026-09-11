# Fragilidade e Quebra em Tempo de Execução por Invocação de Métodos sem Programação Defensiva em Props

## Severidade: Crítica

## Componentes Impactados
- [`MaxInputTypeAddress.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTypeAddress.vue)
- [`MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserAvatar.vue)
- [`MaxBadgeButtonsGroup.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxBadgeButtonsGroup.vue)
- [`MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTable.vue)
- [`MaxTableFields.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTableFields.vue)
- [`MaxChips.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxChips.vue)

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
Aplicações cliente que consomem a biblioteca sofrem com travamentos fatais e tela branca (*White Screen of Death* / *Uncaught TypeError*) quando componentes são alimentados com dados assíncronos imperfeitos ou nulos vindos de respostas de APIs externas (Laravel/REST).
As mensagens típicas de erro em produção incluem:
- `TypeError: Cannot read properties of null (reading 'filter')`
- `TypeError: street.value.split is not a function`
- `TypeError: props.name.trim is not a function`
- `TypeError: props.columns.map is not a function`

### Causa Raiz Profunda
1. **Invocação Direta de Métodos de Protótipo sem Validação**: Os componentes confiam cegamente que valores presentes em props ou computed refs possuem os métodos do tipo ideal (`.split()`, `.filter()`, `.map()`, `.trim()`), sem verificar se o dado é efetivamente uma `string` ou um `Array`.
2. **Armadilha de Sobrescrita de Valores Padrão em Vue 3**: Em Vue 3, o mecanismo `withDefaults(defineProps<Props>(), { items: () => [] })` **só atribui o valor padrão se a prop recebida for estritamente `undefined`**. Se o componente pai passar `:items="null"` (comum em estados de carregamento onde `data.items = null` até a requisição finalizar), `props.items` torna-se `null`. Como os componentes executam chamadas diretas como `props.items.filter(...)` no ciclo de montagem ou no handler de eventos, o componente quebra imediatamente.
3. **Falta de Coerção e Fallbacks Pragmáticos**: Em campos de formulário e inputs compostos como [`MaxInputTypeAddress.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTypeAddress.vue), o valor de `street` pode ser alimentado a partir de atributos dinâmicos (`attrs.street ?? props.street`). Se o consumidor passar um valor numérico ou um objeto, a checagem `if (street.value)` avalia como verdadeira, mas a chamada `street.value.split(' ')` lança uma exceção fatal.

---

## Evidência Técnica

### 1. Quebra imediata em MaxBadgeButtonsGroup ao receber items nulos
Em [`src/components/MaxBadgeButtonsGroup.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxBadgeButtonsGroup.vue#L181-L183) e [`linhas 216-220`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxBadgeButtonsGroup.vue#L216-L220):
```typescript
function handleItemClick(item: MaxBadgeButtonsGroupItem, event: MouseEvent) {
    if (props.disabled || item.disabled) return;

    const currentlySelected = isItemSelected(item);
    const currentItems = props.items.filter((it) => isItemSelected(it));
    ...
}

onMounted(() => {
    if ((props.modelValue === undefined || props.modelValue.length === 0) && props.default !== undefined) {
        const defaults = Array.isArray(props.default) ? props.default : [props.default];

        const initialItems = props.items.filter((it) => {
            ...
        });
```
Se o consumidor montar `<MaxBadgeButtonsGroup :items="null" :default="'ativo'" />`, o hook `onMounted` executa `props.items.filter(...)` diretamente sobre `null`, lançando:
`TypeError: Cannot read properties of null (reading 'filter')`.

### 2. Exceção fatal em MaxInputTypeAddress ao receber valor não-string
Em [`src/components/MaxInputTypeAddress.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTypeAddress.vue#L43-L46):
```typescript
watch(street, () => {
    if (street.value) {
        const first_word = toSearchable(street.value.split(' ')[0]);
        ...
```
Onde `street` é:
```typescript
const street = computed(() => attrs.street ?? props.street);
```
Se `attrs.street` for preenchido com um número (ex.: código postal ou número de logradouro `1234`), a condição `if (street.value)` é satisfeita (`1234` é truthy), mas `street.value.split` não existe. O watcher quebra a aplicação silenciosamente durante o ciclo reativo do Vue.

### 3. Falha de tipo em MaxUserAvatar com dados mistos
Em [`src/components/MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserAvatar.vue#L113-L119):
```typescript
const userInitials = computed(() => {
    if (!props.name?.trim()) return '';
    const parts = props.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});
```
Embora a interface declare `name?: string`, se em tempo de execução `props.name` for um número (ex.: identificador numérico de usuário) ou um objeto retornado pelo backend (ex.: `{ id: 10, name: 'João' }` passado por engano na prop `:name="user"`), a verificação `props.name?.trim()` lança `TypeError: props.name.trim is not a function`. Deveria ser:
`typeof props.name === 'string' && props.name.trim()`.

### 4. Assunção de Array em colunas do MaxTable
Em [`src/components/MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTable.vue#L450-L456):
```typescript
const resolvedColumns = computed<ResolvedColumn[]>(() => {
    if (props.columns && props.columns.length > 0) return props.columns.map((col) => ({
        ...col,
        sortable: col.sortable !== undefined && col.sortable !== false,
        bodySlot: (slots as any)[col.slot ?? col.field ?? '']
    }));
```
Se `props.columns` for um objeto associativo em vez de um array (ex.: dicionário `{ id: {...}, name: {...} }` ou estrutura com campo `length`), `props.columns.map` falha por não validar `Array.isArray(props.columns)`.

---

## Impacto na Estabilidade e Manutenibilidade do Ecossistema

1. **Vulnerabilidade a Payloads Imperfeitos**: No mundo real, respostas HTTP e integrações externas sofrem alterações, retornam `null` em campos vazios ou formatos imprevistos. A falta de resiliência nos componentes do design system transfere a responsabilidade de sanitização inteiramente para cada tela consumidora.
2. **Custo Elevado de Depuração**: Exceções geradas dentro de `computed` ou `watch` no ciclo de vida do Vue muitas vezes interrompem toda a árvore de renderização do componente raiz, deixando poucas pistas para os desenvolvedores sobre qual componente da árvore disparou o colapso.
3. **Inconformidade com Padrões de Design System Corporativo**: Um design system robusto deve garantir falha graciosa (*graceful degradation*), renderizando estados neutros ou avisos informativos em vez de colapsar a interface do usuário.
