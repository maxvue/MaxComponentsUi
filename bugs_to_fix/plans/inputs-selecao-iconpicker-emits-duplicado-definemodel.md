# `defineEmits` de `update:modelValue` redundante e mal posicionado no MaxInputIconPicker

- **Categoria:** melhoria
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxInputIconPicker.vue:303-305`, `src/components/MaxInputIconPicker.vue:97`
- **Domínio:** inputs-selecao-arquivo

## Problema

O componente usa `defineModel` na linha 97:

```ts
const modelValue = defineModel<string>({ default: '' });
```

`defineModel` já declara internamente a prop `modelValue` **e** o emit `update:modelValue`. Mesmo assim, no final do `<script setup>` (linhas 303-305) há:

```ts
defineEmits<{
    'update:modelValue': [value: string];
}>();
```

Dois problemas:

1. **Redundância com risco de conflito.** Declarar manualmente um emit que `defineModel` já declara é, no mínimo, ruído; dependendo da versão do compilador é uma duplicata que pode gerar aviso. O retorno da chamada é descartado (não é atribuído a nada), confirmando que o autor não pretendia usá-lo — é declaração puramente decorativa.

2. **Posicionamento fora de convenção.** É a última instrução do `<script setup>`, depois de todos os watchers (linhas 291-301). Todas as macros de compilação da biblioteca aparecem no topo do bloco, logo após os imports — ver `MaxInputSelect.vue:117`, `MaxListBox.vue:176`, `MaxTagsList.vue:33`. Uma macro escondida no rodapé é fácil de não ver ao ler o componente.

## Impacto

Baixo em runtime — o componente funciona. O custo é de manutenibilidade: o leitor precisa decidir se `defineModel` ou `defineEmits` é a fonte de verdade do contrato de emits, e a posição incomum aumenta a chance de alguém adicionar um segundo `defineEmits` sem perceber o primeiro (o que seria um erro de compilação). Também é um ponto de atrito na migração do PrimeVue, que revisará a API pública de cada componente.

## Plano de correção

1. Remover o bloco `defineEmits` das linhas 303-305 — `defineModel<string>({ default: '' })` já garante que `update:modelValue` faz parte do contrato do componente e é tipado corretamente.
2. Caso o componente venha a emitir outros eventos no futuro (ex.: um `change` com o nome do ícone escolhido), declará-los num `defineEmits` posicionado junto às demais macros, logo após `defineProps` (linha 139), seguindo o padrão dos componentes irmãos.

## Verificação

- `npm run type-check` (`vue-tsc`) passa sem erros após a remoção.
- Teste em `tests/components/MaxInputIconPicker.test.ts`: selecionar um ícone via `selectIcon` continua emitindo `update:modelValue` com o nome correto — comprova que `defineModel` sozinho preserva o contrato.
- Nenhum aviso de emit duplicado no console durante `npm run test`.
- `npx vitest run tests/components/MaxInputIconPicker.test.ts`.
