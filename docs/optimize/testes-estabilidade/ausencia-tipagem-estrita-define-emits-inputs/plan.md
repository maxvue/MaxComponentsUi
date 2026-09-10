# Plano de Implementação: Tipagem Estrita em `defineEmits` nos Componentes de Formulário

## 1. Diagnóstico e Objetivo

O ecossistema Vue 3 com TypeScript oferece a macro genérica `defineEmits<{ (e: 'event', payload: T): void }>()` e a sintaxe de tuplas moderna introduzida no Vue 3.3+ `defineEmits<{ 'update:modelValue': [value: T] }>()`.

A auditoria técnica identificou que **21 componentes de formulário e entrada de dados** utilizam a sintaxe de array em runtime sem tipagem genérica:
```typescript
const emit = defineEmits(['update:modelValue']);
```
Essa abordagem enfraquece o sistema de tipos da aplicação consumidora:
1. O compilador TypeScript e o Volar inferem o emissor como `(...args: any[]) => void`.
2. Em aplicações consumidoras, o `v-model` perde a checagem estrita de compatibilidade de tipos.
3. Eventos customizados emitidos internamente (como `'before-show'`, `'search'`, `'upload'`) deixam de ser validados pelo compilador de templates.

**Objetivo:**
Refatorar cirurgicamente todos os 21 componentes de formulário afetados, migrando a declaração de `defineEmits` para a sintaxe de tuplas estrita do Vue 3.3+. Todos os eventos emitidos pelos componentes devem ser declarados com payloads estritamente tipados, preservando templates sem classes utilitárias e estilos `<style lang="scss" scoped>` aninhados.

---

## 2. Arquivos a Modificar

- [src/components/MaxInputText.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputText.vue)
- [src/components/MaxInputTextArea.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputTextArea.vue)
- [src/components/MaxInputNumber.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputNumber.vue)
- [src/components/MaxInputSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue)
- [src/components/MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue)
- [src/components/MaxInputCheckbox.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCheckbox.vue)
- [src/components/MaxInputRadio.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputRadio.vue)
- [src/components/MaxInputSwitch.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSwitch.vue)
- [src/components/MaxInputToggle.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputToggle.vue)
- [src/components/MaxInputCep.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCep.vue)
- [src/components/MaxInputCpfCnpj.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue)
- [src/components/MaxInputCoordinateDecimalLat.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCoordinateDecimalLat.vue)
- [src/components/MaxInputCoordinateDecimalLng.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCoordinateDecimalLng.vue)
- [src/components/MaxInputSearch.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue)
- [src/components/MaxInputPhoneMail.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputPhoneMail.vue)
- [src/components/MaxInputTypeAddress.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputTypeAddress.vue)
- [src/components/MaxInputAutoComplete.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoComplete.vue)
- [src/components/MaxInputAutoCompleteApi.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoCompleteApi.vue)
- [src/components/MaxInputFileUpload.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue)
- [src/components/MaxInputFileUploadButton.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadButton.vue)
- [src/components/MaxMaps.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxMaps.vue)

---

## 3. Especificação Técnica Cirúrgica

### A. Tabela de Tipagem Estrita de `defineEmits`

| Componente | Linha Original | Declaração Anterior | Nova Declaração Tipada |
|---|---|---|---|
| `MaxInputText.vue` | L103 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string \| number \| undefined] }>()` |
| `MaxInputTextArea.vue` | L65 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string \| undefined] }>()` |
| `MaxInputNumber.vue` | L129 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: number \| null \| undefined] }>()` |
| `MaxInputSelect.vue` | L220 | `defineEmits(['update:modelValue', 'before-show'])` | `defineEmits<{ 'update:modelValue': [value: any]; 'before-show': [event?: Event] }>()` |
| `MaxTagSelect.vue` | L229 | `defineEmits(['update:modelValue', 'before-show'])` | `defineEmits<{ 'update:modelValue': [value: any]; 'before-show': [event?: Event] }>()` |
| `MaxInputCheckbox.vue` | L30 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: boolean \| any[]] }>()` |
| `MaxInputRadio.vue` | L30 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: any] }>()` |
| `MaxInputSwitch.vue` | L60 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: boolean] }>()` |
| `MaxInputToggle.vue` | L50 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: boolean] }>()` |
| `MaxInputCep.vue` | L32 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string] }>()` |
| `MaxInputCpfCnpj.vue` | L48 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string] }>()` |
| `MaxInputCoordinateDecimalLat.vue` | L40 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: number \| string] }>()` |
| `MaxInputCoordinateDecimalLng.vue` | L40 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: number \| string] }>()` |
| `MaxInputSearch.vue` | L35 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string]; 'search': [query: string] }>()` |
| `MaxInputPhoneMail.vue` | L55 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string] }>()` |
| `MaxInputTypeAddress.vue` | L32 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: any] }>()` |
| `MaxInputAutoComplete.vue` | L110 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: any] }>()` |
| `MaxInputAutoCompleteApi.vue` | L95 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: any] }>()` |
| `MaxInputFileUpload.vue` | L120 | `defineEmits(['update:modelValue', 'upload', 'select'])` | `defineEmits<{ 'update:modelValue': [value: any]; 'upload': [event: any]; 'upload-error': [error: any]; 'select': [event: any]; 'file-click': [file: any] }>()` |
| `MaxInputFileUploadButton.vue` | L45 | `defineEmits(['update:modelValue', 'upload'])` | `defineEmits<{ 'update:modelValue': [value: any]; 'upload': [files: FileList \| File[]] }>()` |
| `MaxMaps.vue` | L78 | `defineEmits(['update:modelValue', 'marker-click'])` | `defineEmits<{ 'update:modelValue': [coords: { latitude: number; longitude: number }]; 'marker-click': [marker: any] }>()` |

---

### B. Exemplos de Implementação em Código

#### 1. `MaxInputText.vue`
```vue
<script setup lang="ts">
    import { toSearchableString, hasContent } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            type?: string;
            modelValue: string | number | undefined;
            icon?: string;
            label?: string;
            disabled?: boolean;
            required?: boolean;
            // ... demais props tipadas
        }>(),
        {
            type: 'text'
        }
    );

    // Tipagem estrita de emissão
    const emit = defineEmits<{
        'update:modelValue': [value: string | number | undefined];
    }>();

    const temp_value = ref<string | number | undefined>(props.modelValue);

    watch(temp_value, () => {
        isDone.value = testIsDone();
        emit('update:modelValue', temp_value.value);
    });

    watch(
        () => props.modelValue,
        (val) => (temp_value.value = val)
    );
</script>
```

#### 2. `MaxInputSearch.vue`
```vue
<script setup lang="ts">
    import { ref, watch } from 'vue';
    import InputBase from './InputBase.vue';

    const props = withDefaults(
        defineProps<{
            modelValue?: string;
            placeholder?: string;
            debounce?: number;
        }>(),
        {
            modelValue: '',
            placeholder: 'Pesquisar...',
            debounce: 300
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'search': [query: string];
    }>();

    const temp_value = ref<string>(props.modelValue);

    watch(temp_value, (val) => {
        emit('update:modelValue', val);
    });

    const triggerSearch = () => {
        emit('search', temp_value.value);
    };
</script>
```

#### 3. `MaxInputSelect.vue`
```vue
<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    // ... imports

    const emit = defineEmits<{
        'update:modelValue': [value: any];
        'before-show': [event?: Event];
    }>();

    const onShow = (event?: Event) => {
        emit('before-show', event);
    };

    watch(temp_value, (val) => {
        emit('update:modelValue', val);
    });
</script>
```

---

## 4. Garantia de Retrocompatibilidade

1. **Assinaturas e Nomes de Eventos:** Todos os nomes de eventos em kebab-case e camelCase permanecem inalterados (`update:modelValue`, `before-show`, `upload`).
2. **Payloads Suportados:** A tipagem nos emits abrange os tipos reais emitidos por cada componente (ex.: `string | number | undefined` em `MaxInputText`), garantindo que qualquer consumidor que já utilizava esses componentes continue compilando perfeitamente sem necessidade de alterações em chamadas existentes.
3. **Template e Estilo:** O markup HTML e o SCSS scoped permanecem preservados; a mudança é restrita à assinatura de `defineEmits` e às checagens do compilador.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. **Checagem de Tipos TypeScript:**
   ```bash
   npm run type-check
   ```
   *Critério:* O compilador `vue-tsc` deve validar todos os 21 arquivos `.vue` sem erros de emissão de eventos ou discordância de tuplas.

2. **Execução dos Testes Unitários de Formulário:**
   ```bash
   npx vitest run tests/components/MaxInputText.test.ts \
                   tests/components/MaxInputSelect.test.ts \
                   tests/components/MaxInputSearch.test.ts \
                   tests/components/MaxInputSwitch.test.ts \
                   tests/components/MaxInputCheckbox.test.ts
   ```
   *Critério:* Todos os testes que verificam a emissão de `update:modelValue` devem passar com sucesso.

3. **Verificação de Ausência de Arrays em `defineEmits`:**
   ```bash
   git grep -n "defineEmits(\[" src/components/
   ```
   *Critério:* Nenhuma ocorrência de `defineEmits([...])` deve restar nos 21 componentes de formulário refatorados.
