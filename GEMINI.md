# GEMINI.md

Este arquivo fornece as diretrizes canônicas e obrigatórias para o Gemini CLI, Claude, e assistentes de IA ao trabalhar com o código deste repositório.

## Visão Geral do Projeto

`@maxvue/max-components-ui` é a biblioteca de componentes e design system oficial do ecossistema Max / Engeapp, desenvolvida em **Vue 3** (Composition API, TypeScript) e distribuída como módulo ES via npm. Ela fornece uma suíte completa de componentes de formulário, layout, modais, navegação e tabelas, orientados por consistência visual, acessibilidade, alta performance e usabilidade.

Ela depende do pacote local irmão `@maxvue/max-use` (referenciado como `file:../MaxUse`), que reside no mesmo diretório pai.

## Migração do PrimeVue: status e Fase 2

A partir do PrimeVue 5 a biblioteca deixará de ser open source. Todos os **37 componentes** dependentes do PrimeVue listados em `status-primevue.migration.yaml` foram 100% migrados e estão com status `done`. Nenhum arquivo em `src/components/` importa mais nada do PrimeVue. A fase ativa atual é a **Fase 2 (Infraestrutura e Desacoplamento Total)**, que remove `app.use(PrimeVue)` de `src/index.ts`, desacopla `src/styles/style.ts` de `@primeuix/themes`, elimina o entry `./prime` e executa o sweep de nomenclatura.

Arquivos de controle (todos na raiz do repositório):

| Arquivo | Papel |
|---|---|
| [`migration_plan.md`](migration_plan.md) | Brief original do orquestrador — como os planos por componente foram gerados. |
| [`status-primevue.migration.yaml`](status-primevue.migration.yaml) | Fonte de verdade do progresso: lista os 37 componentes com status `done`. |
| [`migration_plans/`](migration_plans/) | Planos de migração autossuficientes por componente (`migration_plans/[NomeComponente].md`), 37 no total. |
| [`migration_executor.md`](migration_executor.md) | Painel de controle e registro de conclusão dos 37 componentes. |
| [`docs/superpowers/specs/2026-08-13-primevue-infra-independencia-design.md`](docs/superpowers/specs/2026-08-13-primevue-infra-independencia-design.md) | Especificação de infraestrutura da Fase 1 e Fase 2 de independência do PrimeVue. |

---

## PADRÕES DE IDENTIDADE VISUAL DO DESIGN SYSTEM

A identidade visual da biblioteca segue uma linguagem moderna, limpa e funcional, focada em alta densidade e produtividade operacional para sistemas web empresariais.

### 1. Sistema de Cores e Superfícies

Todas as cores devem ser consumidas **obrigatoriamente** através das variáveis CSS do design system declaradas em `src/themes/` (`colors.scss` e `tokens.scss`) e sincronizadas com `src/styles/style.ts`. **É terminantemente proibido o uso de valores hexadecimais, RGB ou HSL literais hardcoded nos arquivos Vue.**

#### A. Superfícies e Backgrounds (Modo Claro e Modo Escuro)
As superfícies operam através da escala neutra `--background-*` com suporte nativo a inversão automática no modo escuro via classe `.dark`:
- `--background-0`: Superfície base primária / fundo de cartões, modais, painéis e inputs no modo claro (`#ffffff`). No modo escuro inverte para a base mais profunda.
- `--background-25` a `--background-75`: Fundo neutro suave para áreas de fundo geral da aplicação (`#f8fafc` / `#f2f4f7`) e estado desabilitado de inputs e botões.
- `--background-100` a `--background-200`: Fundos de áreas secundárias, toolbars, divisórias, bordas sutis (`--surface-border`) e hover neutro.
- `--background-300` a `--background-400`: Bordas neutras de cartões, divisórias de maior contraste e estados inativos de controles.
- `--background-500` a `--background-650`: Textos secundários, legendas, placeholders e ícones desabilitados.
- `--background-700` a `--background-775`: Textos principais, rótulos de campos de formulário, títulos de seções e ícones ativos no modo claro.
- `--background-800` a `--background-900`: Superfície de alto contraste, tooltips flutuantes (`.max-tooltip`) e fundos de backdrops / overlays modais.

#### B. Rampa Primária Institucional (Teal Max)
A rampa primária expressa a identidade institucional corporativa da Max / Engeapp:
- `--max-primary-50`: `#f0fdfa` (tint suave para seleções e badges leves)
- `--max-primary-100`: `#56C2D7` (realces secundários)
- `--max-primary-200`: `#46BCD4` (bordas de foco suaves)
- `--max-primary-400`: `#178DA5` (cor primária para foco e links em modo escuro)
- `--max-primary-500`: `#00768E` (cor primária canônica para ações principais, botões padrão e foco ativo)
- `--max-primary-600`: `#005F77` (hover primário e ênfase de interação)
- `--max-primary-700` a `--max-primary-950`: Variações profundas de contraste e modo escuro

#### C. Cores Semânticas de Estado
- **Sucesso / Done / Confirm**:
  - `--max-success-500`: `#10B981` (verde esmeralda canônico para badges, validações positivas e ícones de confirmação)
  - `--max-success-600` / `--emerald-700`: `#059669` / `#047857` (botões de confirmação e ações seguras)
- **Atenção / Alerta / Caution**:
  - `--max-warning-500`: `#F59E0B` (âmbar canônico para alertas e estados pendentes)
  - `--max-warning-600` / `--max-orange-500`: `#d97706` / `#f97316` (bordas, badges de caution e avisos críticos)
- **Erro / Danger / Exclusão**:
  - `--max-danger-500`: `#EF4444` (vermelho erro canônico para mensagens de erro, bordas de validação e alertas)
  - `--max-danger-600` / `--red-700`: `#dc2626` / `#b91c1c` (botões e ações destrutivas / deleção)
- **Informativo**:
  - `--max-info-500`: `#0EA5E9` (sky blue canônico para banners contextuais e dicas informativas)
  - `--max-info-600` / `--blue-600`: `#0284c7` / `#2563eb` (destaque informativo, badges e links)
- **Canais Especiais**:
  - `--max-whatsapp-500`: `#25d366` / `--max-whatsapp-600`: `#1da851` (interações oficiais do canal WhatsApp)

#### D. Estados Interativos e Acessibilidade (WCAG 2.4.7 / 2.4.11)
- **Hover**: Transição suave de cor/superfície (`transition: all 0.2s ease-in-out`), escurecendo botões para o shade 600 ou elevando o background para `var(--background-100)`.
- **Focus Visible**: Todo elemento interativo (inputs, botões, checkboxes, radios, abas) DEVE possuir foco visível estrito:
  - Modo Claro: `box-shadow: var(--max-focus-ring)` (`0 0 0 2px var(--background-0), 0 0 0 4px var(--max-primary-500)`).
  - Modo Escuro: `box-shadow: var(--max-focus-ring)` (`0 0 0 2px var(--background-900), 0 0 0 4px var(--max-primary-400)`).
  - Borda ativa de inputs: `var(--max-inputtext-focus-border-color)`.
- **Disabled**: Background em `var(--background-75)`, tipografia e ícones em `var(--background-650)`, borda em `var(--background-200)`, cursor `not-allowed`, `pointer-events: none` em gatilhos não-nativos.

---

### 2. Tipografia, Elevação e Escala Visual

- **Família Tipográfica**: `Quicksand, 'Instrument Sans', ui-sans-serif, sans-serif`.
- **Escala de Tamanhos**:
  - Rótulos de inputs e textos de formulário: `12px` (`0.75rem` / `$font-label-inputs` / `$size-text-input`).
  - Textos secundários, feedbacks de validação e tooltips: `10px` a `13px` (`0.8125rem`).
  - Títulos e Cabeçalhos:
    - H1: `21px` (`$size-h1`, font-weight 700)
    - H2: `18px` (`$size-h2`, font-weight 600)
    - H3: `16px` (`$size-h3`, font-weight 600)
    - H4: `14px` (`$size-h4`, font-weight 600)
- **Altura Padrão de Inputs e Botões**: `36px` (tamanho otimizado para alta densidade em dashboards operacionais).
- **Border Radius**:
  - Inputs, campos de formulário e botões: `4px`.
  - Cards, popovers, dropdowns e modais: `6px` a `8px`.
  - Badges e float labels: `2px`.
- **Elevação e Sombras**:
  - Nível 1 (Dropdowns, Menus, Popovers): `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`.
  - Nível 2 (Modais, Drawers flutuantes): `box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`.
  - Nível 3 (Tooltips): `box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2)`.
- **Camadas de Z-Index**:
  - Tooltips: `99999`
  - Modais e Dialogs: `1100`
  - Overlays e Popovers / Dropdowns: `1000`
  - Fixed Headers e Menus: `100`

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
