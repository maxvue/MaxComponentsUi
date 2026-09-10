# Ausência de Tipagem Estrita em `defineEmits` em Componentes de Formulário

## 1. Contexto e Diagnóstico Técnico
O Vue 3 provê suporte nativo à tipagem estrita de eventos emitidos através da macro genérica `defineEmits<{ (e: 'event', payload: T): void }>()` ou da notação de tupla introduzida no Vue 3.3+ `defineEmits<{ 'update:modelValue': [value: T] }>()`.

A auditoria identificou que **21 componentes essenciais de formulário e entrada de dados** utilizam a sintaxe de array em tempo de execução sem parâmetros de tipo:
`const emit = defineEmits(['update:modelValue', ...]);`

Essa abordagem resulta em `(...args: any[]) => void`, anulando a segurança de tipos do TypeScript para todos os consumidores que utilizam `v-model` ou escutam eventos emitidos por esses componentes.

## 2. Lista de Componentes Afetados e Evidências

| Componente | Linha | Declaração Atual | Tipagem Esperada |
|---|---|---|---|
| `MaxInputText.vue` | L103 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string \| number \| undefined] }>()` |
| `MaxInputTextArea.vue` | L65 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string \| undefined] }>()` |
| `MaxInputNumber.vue` | L129 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: number \| null \| undefined] }>()` |
| `MaxInputSelect.vue` | L220 | `defineEmits(['update:modelValue', 'before-show'])` | `defineEmits<{ 'update:modelValue': [value: any]; 'before-show': [] }>()` |
| `MaxTagSelect.vue` | L229 | `defineEmits(['update:modelValue', 'before-show'])` | `defineEmits<{ 'update:modelValue': [value: any]; 'before-show': [] }>()` |
| `MaxInputCheckbox.vue` | L30 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: boolean \| any[]] }>()` |
| `MaxInputRadio.vue` | L30 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: any] }>()` |
| `MaxInputSwitch.vue` | L60 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: boolean] }>()` |
| `MaxInputToggle.vue` | L50 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: boolean] }>()` |
| `MaxInputCep.vue` | L32 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string] }>()` |
| `MaxInputCpfCnpj.vue` | L48 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string] }>()` |
| `MaxInputCoordinateDecimalLat.vue` | L40 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: number \| string] }>()` |
| `MaxInputCoordinateDecimalLng.vue` | L40 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: number \| string] }>()` |
| `MaxInputSearch.vue` | L35 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string] }>()` |
| `MaxInputPhoneMail.vue` | L55 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: string] }>()` |
| `MaxInputTypeAddress.vue` | L32 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: any] }>()` |
| `MaxInputAutoComplete.vue` | L110 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: any] }>()` |
| `MaxInputAutoCompleteApi.vue` | L95 | `defineEmits(['update:modelValue'])` | `defineEmits<{ 'update:modelValue': [value: any] }>()` |
| `MaxInputFileUpload.vue` | L120 | `defineEmits(['update:modelValue', 'upload', 'select'])` | `defineEmits<{ ... }>()` |
| `MaxInputFileUploadButton.vue` | L45 | `defineEmits(['update:modelValue', 'upload'])` | `defineEmits<{ ... }>()` |
| `MaxMaps.vue` | L78 | `defineEmits(['update:modelValue', 'marker-click'])` | `defineEmits<{ ... }>()` |

## 3. Impacto Técnico
- **Ausência de Type Safety no Consumo:** Ao utilizar `<MaxInputText v-model="minhaVariavel" />`, o compilador `vue-tsc` não valida se o tipo de `minhaVariavel` é compatível com o valor emitido pelo componente.
- **Incompatibilidade com Ferramental IDE (Volar / Vue Language Tools):** O desenvolvedor não recebe sugestões de autocompletação ao digitar `@update:model-value="($event) => ..."` (o tipo inferido de `$event` é `any`).
- **Inconsistência Arquitetural Interna:** Componentes mais recentes (como `MaxInputCodeToolbar.vue`, `MaxDividers.vue`, `MaxBottomMenu.vue`, `MaxButton.vue`) já adotam tipagem genérica em `defineEmits`, gerando uma disparidade de qualidade técnica entre o core de formulários e os módulos novos.

## 4. Recomendações de Resolução
1. **Refatorar todas as ocorrências para sintaxe de tupla Vue 3.3+:**
   ```typescript
   // Exemplo para MaxInputText.vue:
   const emit = defineEmits<{
       'update:modelValue': [value: string | number | undefined];
       'blur': [event: FocusEvent];
       'focus': [event: FocusEvent];
   }>();
   ```
2. **Definir Payloads Precisos em Emits Customizados:**
   - Em `MaxInputSelect.vue` e `MaxTagSelect.vue`:
   ```typescript
   const emit = defineEmits<{
       'update:modelValue': [value: any];
       'before-show': [];
       'change': [value: any];
   }>();
   ```
3. **Adicionar Testes Unitários de Emissão de Eventos:**
   - Garantir testes Vitest verificando o tipo e o valor exato emitido nos eventos com `wrapper.emitted('update:modelValue')`.
