# Guia de Contribuição

Contribuições são fundamentais para manter esta biblioteca robusta e útil. Siga estas diretrizes ao adicionar ou modificar componentes.

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- A biblioteca irmã [`@maxvue/max-use`](https://github.com/maxvue/MaxUse) clonada no mesmo diretório pai (é referenciada via `file:../MaxUse`)

---

## Processo de Desenvolvimento

```bash
# 1. Instalar dependências
npm install

# 2. Rodar o playground para testar componentes
npm run dev:playground

# 3. Verificar tipagem
npm run type-check

# 4. Lint (ESLint + Stylelint)
npm run lint

# 5. Build final
npm run build
```

---

## Adicionando Novos Componentes

1. **Crie o arquivo** `.vue` na pasta `src/components/`
2. **Use `InputBase` como wrapper** sempre que possível para garantir consistência visual (labels, erros, ícones)
3. **TypeScript obrigatório** — Use `<script setup lang="ts">` e defina props com interfaces tipadas
4. **Exporte o componente** no arquivo `src/index.ts`
5. **Regenere o manifesto** — Execute o script para atualizar aliases e auto-import:

```bash
npx tsx src/scripts/generateResolver.ts
```

6. **Estilos** — Utilize UnoCSS (`virtual:uno.css`) ou SCSS. Siga o padrão de variáveis CSS do tema Max (ex: `var(--background-600)`, `var(--blue-700)`)

---

## Padrão de Código

### Props

Use interfaces com TSDoc para documentar cada propriedade:

```typescript
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Valor do campo (v-model) */
    modelValue: string
    /** Rótulo exibido acima do campo */
    label?: string
    /** Indica se o campo é obrigatório */
    required?: boolean
  }>(),
  { required: false }
)
</script>
```

### Eventos

Use `defineEmits` com tipagem:

```typescript
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'complete': [value: string]
}>()
```

### Aliases de Exportação

Se o componente deve ter aliases (ex: `MaxInputText` → `InputText`, `InputField`), adicione-os no `src/index.ts`:

```typescript
export { default as MaxInputText } from './components/MaxInputText.vue'
export { default as InputText } from './components/MaxInputText.vue'
export { default as InputField } from './components/MaxInputText.vue'
```

---

## Estrutura de Estilos

- Use `lang="scss"` nos blocos `<style>`
- Prefira variáveis CSS do tema: `var(--background-300)`, `var(--blue-600)`, `var(--max-primary-500)`
- Evite `scoped` em componentes de biblioteca quando os estilos precisam afetar componentes filhos do PrimeVue
- Para classes utilitárias, use o preset UnoCSS (`presetMaxUno`)

---

## Checklist de PR

- [ ] Componente criado em `src/components/`
- [ ] Exportado em `src/index.ts`
- [ ] Manifesto regenerado (`npx tsx src/scripts/generateResolver.ts`)
- [ ] Props documentadas com TSDoc
- [ ] Tipagem verificada (`npm run type-check`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] Build com sucesso (`npm run build`)
- [ ] Documentação atualizada em `COMPONENTS.md`

---

## Publicação

A publicação no npm é feita via script `release`:

```bash
npm run release
```

Este comando executa:
1. `npm run build` — Build de produção
2. `npm version patch` — Incrementa a versão
3. `git push origin main --follow-tags` — Push com tag
4. `npm publish --access public` — Publica no npm

> Certifique-se de que todas as alterações foram testadas e a tipagem está correta antes de executar.
