# GEMINI.md

Este arquivo fornece as diretrizes canônicas e obrigatórias para o Gemini CLI, Claude, e assistentes de IA ao trabalhar com o código deste repositório.

## Visão Geral do Projeto

`@maxvue/max-components-ui` é a biblioteca de componentes e design system oficial do ecossistema Max / Engeapp, desenvolvida em **Vue 3** (Composition API, TypeScript) e distribuída como módulo ES via npm. Ela fornece uma suíte completa de componentes de formulário, layout, modais, navegação e tabelas, orientados por consistência visual, acessibilidade, alta performance e usabilidade.

Ela depende do pacote local irmão `@maxvue/max-use` (referenciado como `file:../MaxUse`), que reside no mesmo diretório pai.

---

## PADRÕES DE IDENTIDADE VISUAL DO DESIGN SYSTEM

A identidade visual da biblioteca segue uma linguagem moderna, limpa e funcional, focada em produtividade operacional.

### 1. Sistema de Cores e Superfícies

Todas as cores devem ser consumidas obrigatoriamente através das variáveis CSS do design system declaradas em `src/themes/`:

#### A. Superfícies e Backgrounds (Modo Claro e Modo Escuro)
- `--background-0`: Superfície base mais clara / fundo de cards e inputs no modo claro (`#ffffff`).
- `--background-75`: Fundo neutro suave / estado desabilitado de inputs (`#f8fafc`).
- `--background-100` a `--background-200`: Fundos de áreas secundárias, bordas sutis e divisórias.
- `--background-300` a `--background-400`: Bordas neutras e estados inativos.
- `--background-600` a `--background-650`: Textos secundários, placeholders e ícones desabilitados.
- `--background-700` a `--background-775`: Textos principais, rótulos e títulos no modo claro.
- `--background-800` a `--background-900`: Superfície escura, tooltips e fundos de overlays.

#### B. Rampa Primária Institucional (Teal)
A rampa primária expressa a identidade Max:
- `--max-primary-50`: `#f0fdfa` (tint suave)
- `--max-primary-100`: `#56C2D7`
- `--max-primary-200`: `#46BCD4`
- `--max-primary-400`: `#178DA5`
- `--max-primary-500`: `#00768E` (cor primária canônica para ações de destaque e foco)
- `--max-primary-600`: `#005F77` (hover primário e ênfase)
- `--max-primary-700` a `--max-primary-900`: Variações profundas de contraste

#### C. Cores Semânticas de Estado
- **Sucesso / Done / Confirm**:
  - `--max-success-500`: `#10B981` (verde esmeralda canônico)
  - `--emerald-700`: `#047857` (botões de confirmação)
- **Atenção / Alerta / Caution**:
  - `--max-warning-500`: `#F59E0B`
  - `--max-orange-500`: `#f97316` (bordas e ícones de aviso)
- **Erro / Danger / Exclusão**:
  - `--max-danger-500`: `#EF4444` (vermelho erro)
  - `--red-700`: `#b91c1c` (botões e ações destrutivas)
- **Informativo**:
  - `--max-info-500`: `#0EA5E9`
  - `--blue-600`: `#2563eb` (destaque informativo e links)

#### D. Estados Interativos e Acessibilidade
- **Hover**: Transição suave de cor/superfície (ex.: `var(--max-primary-600)`, `var(--background-725)`).
- **Focus Visible**: Borda e anel de foco identificável via `var(--max-primary-500)` ou `--max-inputtext-focus-border-color`.
- **Disabled**: Background em `var(--background-75)`, tipografia e ícones em `var(--background-650)`, cursor `not-allowed`.

---

### 2. Tipografia e Escala Visual

- **Família Tipográfica**: `Quicksand, 'Instrument Sans', ui-sans-serif, sans-serif`.
- **Escala de Tamanhos**:
  - Rótulos de inputs e textos de formulário: `12px` (`0.75rem` / `$font-label-inputs` / `$size-text-input`).
  - Textos secundários, feedbacks de validação e tooltips: `10px` a `13px` (`0.8125rem`).
  - Títulos e Cabeçalhos:
    - H1: `21px` (`$size-h1`)
    - H2: `18px` (`$size-h2`)
    - H3: `16px` (`$size-h3`)
    - H4: `14px` (`$size-h4`)
- **Altura Padrão de Inputs e Botões**: `36px` (tamanho touch/desktop otimizado para densidade de dashboards operacionais).
- **Border Radius**:
  - Padrão para inputs, campos e botões: `4px`.
  - Padrão para cards, popovers e modais: `6px` a `8px`.
  - Padrão para badges e float labels: `2px`.

---

### 3. Padrão Arquitetural de Componentes de Formulário

- **`InputBase` (`src/components/InputBase.vue`) é o wrapper universal obrigatório** para todos os inputs de dados (texto, números, datas, CEP, CPF, telefones, markdown, seletores).
- Ele encapsula de forma padronizada:
  - Posicionamento de rótulos (modo padrão ou flutuante `float`).
  - Área para ícones laterais (`iconLeft`, `iconRight`, `iconPos`).
  - Indicadores visuais de estado semântico no canto do campo: `done` (check verde), `caution` (exclamação laranja), `error` (exclamação vermelha), `required` (asterisco).
  - Linha inferior de feedback (`input-message`) acessível via `aria-live="polite"`.
- **Exceções Legítimas**:
  - `MaxInputCheckbox`, `MaxInputRadio` e `MaxInputToggle` não usam `InputBase` por possuírem anatomia de controle binário/múltipla escolha (renderizados diretamente com raiz semântica própria).

---

### 4. Independência Total do PrimeVue (Zero Dependências Externas)

A biblioteca é **100% autônoma e independente do PrimeVue**:
- Nenhum componente do design system deve importar ou referenciar pacotes do ecossistema PrimeVue (`primevue/*`, `@primevue/*`, `@primeuix/*`).
- A estilização não deve fazer uso de classes utilitárias ou internas do PrimeVue (ex.: `.p-inputtext`, `.p-select`, `.p-floatlabel`).
- Todo componente deve possuir marcação HTML semântica própria e estilização isolada.
- Quaisquer imports residuais do PrimeVue encontrados no projeto devem ser tratados como inconformidade técnica e eliminados.

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
- Para estilizar nós ou elementos de subcomponentes filhos quando indispensável, utilize a pseudo-classe `:deep(...)` dentro do bloco com escopo.
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

---

## Convenções de Código e Arquitetura

- `<script setup lang="ts">` com `defineProps<Interface>()` e `defineEmits<{...}>()` estritamente tipados.
- Indentação de 4 espaços (imposta pelo ESLint `@stylistic/indent`).
- Aspas simples, sem vírgula final, ponto e vírgula obrigatório.
- Ordem obrigatória dos blocos SFC: 1º `<template>`, 2º `<script setup>`, 3º `<style lang="scss" scoped>`.
- Stores exportadas em `src/stores/index.ts`: `useIconStore`, `usePopoverStore`, `useToastStore`, `useConfirmStore`, `useModalStore`.
- Múltiplos aliases de export para o mesmo componente são definidos em `src/index.ts`.
- `MaxInputText` (e `MaxInputTextArea`) usa `v-bind="props"` no `InputBase`, repassando attrs adicionais para o elemento raiz do `InputBase`.

---

## Comandos do Projeto

```bash
npm install               # Instala as dependências
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

**Regenerar o manifesto de componentes:**
```bash
npx tsx src/scripts/generateResolver.ts
```
