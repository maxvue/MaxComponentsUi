# Diretrizes Canônicas do Projeto (AGENTS.md)

Este documento fornece as diretrizes canônicas e mandatórias para todos os assistentes de IA (Gemini, Claude, Antigravity, Cursor, Codex, OpenCode, Aider) atuando no repositório `@maxvue/max-components-ui`.

---

## 1. Visão Geral do Projeto

- **Pacote**: `@maxvue/max-components-ui` é a biblioteca oficial de componentes e design system do ecossistema Max / Engeapp.
- **Stack**: Vue 3 (Composition API exclusiva), TypeScript estrito, Vite 8, UnoCSS (`presetMaxUno`) e SCSS scoped.
- **Dependência `@maxvue/max-use`**: Pacote irmão distribuído e consumido via npm (`^1.1.x`). **Nunca** utilize caminhos locais ou referências `file:../MaxUse` (proibido pela arquitetura e verificação de lockfile).
- **Idioma**: Toda interação, comentários, documentações e mensagens de commit devem ser estritamente em Português do Brasil (pt-BR).

---

## 2. Regras Operacionais Mandatórias (Worktrees e Execução)

1. **Uso Obrigatório de Git Worktrees**:
   - **Toda e qualquer alteração de código ou arquivos** DEVE ser realizada obrigatoriamente dentro de um **git worktree separado**, isolado da branch principal (`dev`/`main`).
   - No MaxCode, use a worktree pré-alocada sem criar outra ou trocar sua branch. Fora do MaxCode, use worktree dedicada em `.worktrees/wt-<nome-da-tarefa>`.
   - É **terminantemente proibido** alterar arquivos diretamente na working tree principal / raiz do repositório.
   - **Outros Worktrees**: Se houver outros worktrees em `.worktrees/`, não os investigue ou altere: pertencem a sessões ou agentes paralelos.
   - **Limpeza**: Preserve worktree com alterações ou integração pendentes. No MaxCode, limpeza é do painel/usuário; fora dele, remova após integração e autorização, sem perder trabalho.
2. **Plano Prévio Obrigatório**:
   - Não execute modificações sem autorização. Apresente plano para o escopo quando necessário; reutilize plano e autorização já concedidos sem nova aprovação a cada alteração.
   - Workflows de Commit, Push, Deploy e NPM Update só devem ser executados quando explicitamente solicitados pelo usuário.

---

## 3. Independência do PrimeVue e Retrocompatibilidade

- **Independência 100% Concluída**: A migração e o desacoplamento de infraestrutura (Fases 1 e 2) foram totalmente finalizados. Nenhum componente ou arquivo de estilo importa pacotes PrimeVue (`primevue`, `@primeuix/themes`, `@primevue/auto-import-resolver`).
- **Proibição de Reintrodução**: É terminantemente proibido reintroduzir dependências ou imports do PrimeVue.
- **Retrocompatibilidade de Classes Legadas**: A biblioteca preserva intencionalmente certas classes `.p-*` e seletores herdados nos componentes para manter a compatibilidade com aplicações consumidoras existentes. **Não remova** classes `.p-*` consolidadas sem análise de impacto e testes cobrindo consumidores. Código novo deve sempre utilizar prefixos semânticos `.max-*`.

---

## 4. Identidade Visual e Design System

A assinatura visual do Max Components UI é **operacional, compacta e azul-petróleo (teal)**, priorizando legibilidade e alta densidade de dados para formulários, tabelas e dashboards.

### 4.1. Cores e Tokens Semânticos
- As cores de interface devem partir de variáveis CSS semânticas:
  - **Marca / Ação Primária**: `--max-primary-500: #00768E` (hover: `--max-primary-600: #005F77`, dark: `--max-primary-400: #178DA5`).
  - **Sucesso**: `--max-success-500: #10B981` (hover: `#059669`).
  - **Atenção / Aviso**: `--max-warning-500: #F59E0B` (hover: `#D97706`).
  - **Perigo / Destrutivo**: `--max-danger-500: #EF4444` (hover: `#DC2626`).
  - **Informação**: `--max-info-500: #0EA5E9` (hover: `#0284C7`).
  - **WhatsApp**: `--max-whatsapp-500: #25D366` (hover: `#1EBE5D`).
- **Neutros e Escala Escura**: Rampa azul-acinzentada `--background-0` (branco) até `--background-900` (azul quase preto). No modo dark (`:root.dark` ou `.dark`), os níveis `0–850` são remapeados inversamente.
- **Namespaces Históricos**: `--max-primary-*` é o namespace canônico da marca teal. `--blue-*` e `--primary-*` são legados/neutros e não devem ser usados como sinônimos da marca em código novo.

### 4.2. Tipografia, Dimensões e Foco
- **Tipografia**: `Quicksand, sans-serif` globalmente (`src/themes/font.scss`). Títulos usam escala compacta (`MaxTitle1`, `MaxTitle2`) frequentemente em caixa alta leve.
- **Densidade**: `InputBase` padrão usa campo de `36px`, label de `12px` e mensagem de `12px` (com variante compacta de `20px`). Botões usam raios discretos (`4px`, `6px`, `8px`).
- **Anéis de Foco**: Consumir tokens canônicos `--max-focus-ring`, `--max-focus-outline`, `--max-focus-ring-color` e `--max-focus-ring-offset-color`. Nunca remover outline sem substituição acessível.
- **Anatomia `InputBase`**: Principal anatomia de entrada. Conecte explicitamente `inputId`, `aria-describedby`, `aria-invalid` e `aria-required` ao elemento nativo correspondente.

---

## 5. Diretrizes de Código, ESLint e Stylelint

### 5.1. Estrutura de SFC Vue
- **Ordem Estrutural Obrigatória**:
  1. `<template>`
  2. `<script setup lang="ts">`
  3. `<style lang="scss" scoped>`
- Use exclusivamente **Composition API** com `<script setup lang="ts">`. Options API é proibida.
- Tipagem estrita em `defineProps<Interface>()` e `defineEmits<{...}>()`.

### 5.2. Regras Críticas do ESLint (evitam falhas no CI)
- **Indentação em arquivos `.vue`**: O ESLint impõe `vue/script-indent` com `baseIndent: 1`. Todo código dentro da tag `<script setup>` **deve ter recuo base de 4 espaços** (1 nível de tabulação). Em arquivos `.ts` e `.js` puros, usa-se 4 espaços via `@stylistic/indent`.
- **Controle de Fluxo (`curly: multi` e nonblock beside)**:
  - Instruções `if` de linha única devem ficar na mesma linha sem chaves: `if (condicao) return;`.
  - Blocos multilinhas exigem chaves `{ ... }`.
- **Imports e Declarações**:
  - Aspas simples obrigatórias (`'single'`), sem vírgula final (`comma-dangle: 'never'`), ponto e vírgula obrigatório.
  - `@stylistic/padding-line-between-statements`: linha em branco obrigatória após os imports antes do próximo statement, e nenhuma linha em branco entre imports.
- **Variáveis não utilizadas**: Devem ser prefixadas com `_` (`ignorePattern: '^_'`).

### 5.3. Estilização e Stylelint
- Prefira classes semânticas locais (`.max-*`, estados `is-*`) em `<style lang="scss" scoped>` para componentes da biblioteca.
- UnoCSS e `presetMaxUno` são parte da API pública para consumidores; evite empilhar utilitários no template de componentes internos da biblioteca.
- Use `:style` apenas para propriedades dinâmicas de runtime (posicionamento, dimensões calculadas).
- Seletores pseudo Vue aceitos: `:deep(...)`, `:global(...)`, `:slotted(...)`.

---

## 6. Stores e Recursos Globais

O entry `./stores` (`src/stores/index.ts`) exporta 12 stores de apoio:
- `useIconStore`
- `useLoadingStore`
- `useUserStore`
- `useSystemStore`
- `useLoginStore`
- `useSearchBarStore`
- `useListMenusStore`
- `useTopToolbarStore`
- `usePopoverStore`
- `useToastStore`
- `useConfirmStore`
- `useModalStore`

Helpers de boot da aplicação (App Shell): `configureMaxApp`, `getMaxAppConfig`, `clearMaxCache`, `Toast`, `useScrollLock`, `useHtmlFontSize`, `useHtmlDark`.

---

## 7. Comandos do Projeto e Gates de Qualidade

```bash
# Gates e Verificação de Qualidade
npm run verify            # Executa a esteira completa de validação (gatekeeper pré-release)
npm run type-check        # Checagem de tipos estritos com vue-tsc
npm run type-check:test   # Checagem de tipos da suite de testes (tsconfig.test.json)
npm run lint              # Checagem estática (ESLint + Stylelint via lint:check)
npm run build             # Build de distribuição (vue-tsc + vite build)

# Testes Automatizados
npm run test              # Executa todos os testes unitários (vitest run)
npm run test:watch        # Executa testes em modo watch
npm run test:coverage     # Executa testes com cobertura de código (v8)
npm run test:browser      # Executa testes de componentes no navegador real (Playwright)
npm run test:benchmark    # Executa benchmarks de performance de componentes

# Executar arquivo específico de teste:
npx vitest run tests/components/MaxButton.test.ts

# Playground e Utilitários
npm run dev:playground    # Inicia o playground Vite para teste manual de componentes
npx tsx src/scripts/generateResolver.ts # Regenera manifesto de componentes e auto-imports
```


## Execução e validação em lote

- Implemente todo o bloco autorizado e seus testes antes de executar validações. Depois, valide o conjunto, corrija falhas em lote e revalide após concluir as correções. Não execute testes, tipos ou builds após cada microedição.
- Leia diretrizes na primeira admissão e consulte trechos necessários nas retomadas. Preserve decisões e autorização já concedidas; peça nova decisão somente para ampliação de escopo ou ambiguidade relevante.
- Comandos agregados já executam suas etapas: não repita testes, tipos, lint ou build sobre a mesma revisão sem mudança relevante, falha ou dúvida concreta.
- Preserve asserções, regressões, revisão final e gates de segurança/release. Falhas persistentes exigem diagnóstico; não amplie o escopo para corrigir baseline sem estabelecer causalidade e autorização.
- Informe progresso e limitações, sem segredos ou conclusão verde com verificações falhando/pendentes. Este fluxo não autoriza publicação, deploy ou integração Git.

`npm run verify` é o gate completo de pré-release, não rotina por microedição. Preserve consumidores, navegador, benchmarks, integridade e segurança quando a entrega exigir esse gate. Ele agrega tipos/build e runtime/cobertura; não repita seus componentes isolados sobre o mesmo conteúdo. Dimensione o fechamento do lote aos contratos afetados, sem substituir gate de release por validação parcial.
