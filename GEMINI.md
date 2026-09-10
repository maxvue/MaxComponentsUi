# GEMINI.md

Este arquivo fornece orientações obrigatórias para o Gemini CLI e assistentes de IA baseados em modelos Gemini ao trabalhar com o código deste repositório.

## Visão geral do projeto

`@maxvue/max-components-ui` é uma biblioteca de componentes Vue 3 construída sobre o PrimeVue 4, distribuída como um módulo ES via npm. Ela encapsula e estende o PrimeVue com um tema customizado (`MaxStyle`), locale (pt-BR), preset do UnoCSS e um conjunto de componentes de formulário/layout/exibição.

Ela depende de um pacote local irmão `@maxvue/max-use` (referenciado como `file:../MaxUse`), que precisa ser clonado ao lado deste repositório, no mesmo diretório pai.

## Migração em andamento: independência do PrimeVue

A partir do PrimeVue 5 a biblioteca deixará de ser open source. Existe um esforço ativo para tornar a `@maxvue/max-components-ui` **independente do PrimeVue**, reimplementando ou substituindo cada componente dependente do PrimeVue enquanto preserva a API pública, os estilos e o comportamento atuais. **O código ainda depende do PrimeVue hoje** — a migração está planejada, mas ainda não foi executada.

Arquivos de controle (todos na raiz do repositório):

| Arquivo | Papel |
|---|---|
| [`migration_plan.md`](migration_plan.md) | Brief original do orquestrador — como os planos por componente foram gerados. |
| [`status-primevue.migration.yaml`](status-primevue.migration.yaml) | Fonte de verdade do progresso: lista cada componente dependente do PrimeVue com `level` e `status` (`waiting`/`in_progress`/`done`/`blocked`). |
| [`migration_plans/`](migration_plans/) | Um plano de migração autossuficiente por componente (`migration_plans/[NomeComponente].md`), 34 no total. |
| [`migration_executor.md`](migration_executor.md) | Painel de controle + protocolo do **agente executor**: uma fila ordenada e a regra de que cada invocação migra exatamente **um** componente, depois para e atualiza o status. |

**Se pedirem para avançar a migração**, siga o `migration_executor.md`: pegue o próximo item `waiting` de menor número, execute o plano dele, verifique, atualize o status **tanto no YAML quanto na fila do executor** e então pare. Não migre mais de um componente por invocação, não pule etapas e não reordene. Restrições de ordem principais: `InputBase` primeiro (destrava ~19 inputs); `MaxInputSelect` antes dos dropdowns que o reutilizam; o conjunto `MaxTable` → `MaxTableColumn` → `MaxTableFields` migra junto.

## Comandos

```bash
npm install               # Instala as dependências (requer que ../MaxUse exista)
npm run dev:playground    # Roda o playground para teste manual de componentes
npm run type-check        # Roda a checagem de tipos com vue-tsc
npm run lint              # Roda ESLint + Stylelint com correção automática
npm run build             # vue-tsc + build do vite + copia os temas para dist/
npm run test              # Roda todos os testes (vitest run)
npm run test:watch        # Roda os testes em modo watch
npm run test:coverage     # Roda os testes com relatório de cobertura v8
```

**Rodar um único arquivo de teste:**
```bash
npx vitest run tests/components/MaxButton.test.ts
```

**Após adicionar um novo componente, regenere o manifesto do resolver:**
```bash
npx tsx src/scripts/generateResolver.ts
```

## Arquitetura

### Saídas de build (multi-entrada)

A biblioteca gera quatro entradas ES separadas:

| Entrada | Caminho de export | Origem |
|---|---|---|
| `index.es.js` | `.` (padrão) | `src/index.ts` — todos os componentes Max + plugin `install()` |
| `preset.es.js` | `./preset` | `src/presetMaxUno.ts` — preset do UnoCSS para apps consumidoras |
| `resolver.es.js` | `./resolver` | `src/helpers/MaxComponentsUiResolver.ts` — resolver do unplugin |
| `prime.es.js` | `./prime` | `src/prime/index.ts` — re-exports crus do PrimeVue |

O CSS é injetado apenas no `index.es.js` (via `vite-plugin-css-injected-by-js`). Os temas (`src/themes/`) são copiados literalmente para `dist/themes/` após o build e não são empacotados.

### `InputBase` — o wrapper central

Todos os componentes de input de formulário devem ser encapsulados pelo `InputBase` (`src/components/InputBase.vue`). Ele fornece:
- Layout com `FloatLabel` + `IconField`/`InputIcon` do PrimeVue
- Estados visuais: `done`, `error`, `caution`, `required`, `noStatus`
- Modo de label inline, linha de mensagem/feedback abaixo do campo
- Slots de ícone à esquerda/direita (`icon`, `iconLeft`, `iconRight`, `iconPos`)

Qualquer novo componente de input deve usar `<InputBase>` como seu elemento mais externo.

**Exceção documentada:** `MaxInputCheckbox`, `MaxInputRadio` e `MaxInputToggle` não usam `InputBase` — têm `<div>` como raiz e layout próprio, por serem controles binários/múltipla escolha com necessidades visuais distintas dos inputs de texto/seleção (o próprio PrimeVue renderiza `Checkbox`/`RadioButton` de forma bem diferente de um input de texto). Essa distinção não é arbitrária: `MaxInputSwitch` (comparável a esses três) usa `InputBase` porque seu caso de uso e visual são mais próximos de um input tradicional.

### Stores (Pinia)

Cinco stores exportadas pelo barrel `src/stores/index.ts`:
- `useIconStore` — faz cache dos fetches de ícones SVG do Iconify
- `usePopoverStore` — controla o estado de abrir/fechar do `MaxPopover`
- `useToastStore` — controla a fila do `MaxToast`
- `useConfirmStore` — controla o estado do popover de confirmação usado por `MaxButtonConfirm`/`MaxIconConfirm`/`MaxTogglePopover`
- `useModalStore` — controla qual `MaxModal` está aberto (por `id`)

### Auto-import de componentes

`src/components-manifest.json` é gerado por `src/scripts/generateResolver.ts`. Ele lista todos os nomes de componentes e seus aliases (snake_case, kebab-case, sem o prefixo Max). O resolver (`MaxComponentsUiResolver`) lê esse arquivo para resolver os imports nas apps consumidoras.

Quando um novo arquivo `.vue` é adicionado a `src/components/`, rode `generateResolver.ts` para atualizar o manifesto e os aliases.

---

## REGRAS ESTRITAS DE ESTILIZAÇÃO FRONT-END

### 1. Proibição Absoluta de Classes Utilitárias e Atributos de Estilo no Template
- **É ESTRITAMENTE PROIBIDO** utilizar classes utilitárias de estilo inline dentro dos atributos `class` ou `:class` nos templates dos componentes Vue (ex.: `class="flex p-30"`, `class="text-xs pt-1"`, `class="mb-2"`, `class="w-full flex"` são terminantemente proibidas).
- **É ESTRITAMENTE PROIBIDO** utilizar atributos de utilitários no modo UnoCSS Attributify diretamente nas tags do template (ex.: `<div flex>`, `<div s100>`, `<div w-full>`, `<div gap-4>`, `<div pb-15>`, `<MaxIcon ml-5 />` são terminantemente proibidos).
- Nenhum elemento deve carregar utilitários de margem, padding, tipografia, dimensionamento, posicionamento, alinhamento ou flexbox/grid através de classes utilitárias ou atributos no template. Todo o estilo deve ser semântico.

### 2. O Único Meio Permitido: Seção `<style lang="scss" scoped>`
- O único meio autorizado para aplicar estilização aos componentes Vue é através da tag de estilo do componente:
  ```html
  <style lang="scss" scoped>
  /* Regras SCSS aqui */
  </style>
  ```
- O bloco de estilo DEVE obrigatoriamente utilizar `lang="scss"` e conter o modificador `scoped` para garantir isolamento e encapsulamento dos estilos do componente.
- Para estilizar nós ou elementos internos do PrimeVue ou de subcomponentes filhos quando indispensável, utilize a pseudo-classe `:deep(...)` dentro do bloco com escopo.
- Para estilizar elementos fora da raiz do componente montados no documento/body (como transições de `<slot>` ou travas de scroll em `html`), utilize `:global(...)` dentro do bloco com escopo.

### 3. Aninhamento Obrigatório Conforme a Hierarquia do Template
- Toda estilização na seção `<style lang="scss" scoped>` deve ser estruturada com seletores semânticos descritivos (ex.: `.title-icon`, `.upload-loading-state`, `.t1-main-text`).
- Os blocos e regras no SCSS DEVEM obrigatoriamente ser **aninhados espelhando a árvore DOM e a hierarquia do template**:
  ```html
  <!-- Exemplo no Template -->
  <template>
      <div class="max-card">
          <div class="card-header">
              <span class="card-title">{{ title }}</span>
          </div>
          <div class="card-content">
              ...
          </div>
      </div>
  </template>

  <!-- Exemplo Correto no SCSS Aninhado -->
  <style lang="scss" scoped>
  .max-card {
      display: flex;
      flex-direction: column;

      .card-header {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;

          .card-title {
              font-size: 1.125rem;
              font-weight: 500;
              color: var(--background-775);
          }
      }

      .card-content {
          padding: 1rem 0;
      }
  }
  </style>
  ```

### 4. Variáveis de Tema
- Sempre utilize as variáveis CSS do design system para cores e superfícies:
  - Backgrounds: `var(--background-0)` até `var(--background-900)`
  - Primárias: `var(--max-primary-500)`, `var(--primary-600)`
  - Acentos: `var(--blue-600)`, `var(--red-600)`, etc.

---

## Convenções de Código

- `<script setup lang="ts">` com `defineProps<Interface>()` e `defineEmits<{...}>()` tipados
- Indentação de 4 espaços (imposta pelo ESLint `@stylistic/indent`)
- Aspas simples, sem vírgula final, ponto e vírgula obrigatório
- Ordem obrigatória dos blocos SFC: 1º `<template>`, 2º `<script setup>`, 3º `<style lang="scss" scoped>`
- Múltiplos aliases de export para o mesmo componente são definidos em `src/index.ts`
- `src/prime/index.ts` re-exporta componentes crus do PrimeVue que não têm wrapper Max
- `MaxInputText` (e, pelo mesmo padrão, `MaxInputTextArea`) usa `v-bind="props"` no `InputBase`, não repassa attrs extras para o `<input>`/`<textarea>` interno
