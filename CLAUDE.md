# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## Diretrizes de Idioma

1. **Usar Português do Brasil (pt-BR) para:**
   - Comunicação entre Usuário <=> Agente de IA
   - Comentários no Código (comentários em inglês devem ser substituídos por comentários em português do Brasil)

2. **Usar Inglês (en-US) para:**
   - Nomes de funções
   - Nomes de variáveis
   - Nomes de tabelas do banco de dados
   - Nomes de colunas do banco de dados

## Visão geral do projeto

`@maxvue/max-components-ui` é uma biblioteca de componentes Vue 3 construída sobre o PrimeVue 4, distribuída como um módulo ES via npm. Ela encapsula e estende o PrimeVue com um tema customizado (`MaxStyle`), locale (pt-BR), preset do UnoCSS e um conjunto de componentes de formulário/layout/exibição.

Ela depende de um pacote local irmão `@maxvue/max-use` (referenciado como `file:../MaxUse`), que precisa ser clonado ao lado deste repositório, no mesmo diretório pai.

## Migração em andamento: independência do PrimeVue

A partir do PrimeVue 5 a biblioteca deixará de ser open source. Existe um esforço ativo para tornar a `@maxvue/max-components-ui` **independente do PrimeVue**, reimplementando ou substituindo cada componente dependente do PrimeVue enquanto preserva a API pública, os estilos e o comportamento atuais.

**Parte do trabalho já foi feita.** Estes componentes **já são PrimeVue-free** e servem de referência do padrão da casa: `InputBase` (o wrapper central de todos os inputs), `MaxInputSwitch`, `MaxInputRadio`, `MaxInputTextList`, `MaxInputTextArea`, `MaxModal`, `MaxPopover`, `MaxToast`, `MaxTableFields`, `MaxInputFileUploadBig`, `MaxInputFileUploadButton` e `MaxInputFileProject`. Os **34 arquivos restantes** ainda dependem do PrimeVue.

Arquivos de controle (em [`prime_vue_migration/`](prime_vue_migration/)):

| Arquivo | Papel |
|---------|-------|
| [`prime_vue_migration/README.md`](prime_vue_migration/README.md) | Visão geral: mapa das fases, restrições de ordem e critério de saída. |
| [`prime_vue_migration/status.yaml`](prime_vue_migration/status.yaml) | Fonte de verdade do progresso: 38 itens com `execucao` e `verificacao` (`Aguardando`/`Realizando`/`Concluído`). |
| [`prime_vue_migration/execution.md`](prime_vue_migration/execution.md) | Protocolo do **agente executor**: loop contínuo, portões de qualidade e verificação por subagente. |
| [`prime_vue_migration/plans/`](prime_vue_migration/plans/) | Um plano de implementação detalhado por item (29 planos). |

**Se pedirem para avançar a migração**, siga o `prime_vue_migration/execution.md`. Ele roda em **loop** até concluir todos os itens: pega o próximo item pendente cujas dependências estejam satisfeitas, implementa, testa, dispara um subagente verificador (Opus 5) e só avança quando aprovado. Todo o trabalho ocorre num **git worktree separado** (ver seção "Execução de Agentes em Worktree" abaixo).

Restrições de ordem principais: `MaxBaseInput` primeiro (destrava 10 inputs); `MaxInputSelect` antes dos dropdowns que o reutilizam; conjuntos indivisíveis (mesma passada): {`MaxInputCoordinateDecimalLat`, `Lng`}, {os três de cartão de crédito}, {`MaxTable`, `MaxTableColumn`}; `src/index.ts` por último (é ele que desinstala as dependências).

⚠️ O item **36** (`src/prime/index.ts`, ~110 re-exports publicados como entry point `./prime`) exige **decisão de produto do usuário** — o executor levanta os dados, apresenta as opções e segue para os demais itens sem bloquear.

**Critério de saída** — quando este comando retornar vazio, a migração está completa:
```bash
grep -rn "primevue\|@primeuix\|@primevue" src/ --include='*.vue' --include='*.ts'
```

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
|---------|-------------------|--------|
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

### Estilização

- **UnoCSS** (`virtual:uno.css`) — preset customizado exportado de `src/presetMaxUno.ts`. Classes utilitárias como `pt-4`, `gap-2`, `color-blue-500`, `bg-background-300`, `hover-primary-600` são todas regras customizadas definidas ali.
- **SCSS** — blocos `<style lang="scss">` com escopo de componente. Use variáveis CSS do tema Max: `var(--background-300)`, `var(--blue-600)`, `var(--max-primary-500)`.
- **Tema do PrimeVue** — definido em `src/styles/style.ts` como `MaxStyle` (um `definePreset` de `@primeuix/themes`). Aplicado globalmente via `install()`.

### Stores (Pinia)

Três stores exportadas em `src/stores/`:
- `useIconStore` — faz cache dos fetches de ícones SVG do Iconify
- `usePopoverStore` — controla o estado de abrir/fechar do `MaxPopover`
- `useToastStore` — controla a fila do `MaxToast`

### Auto-import de componentes

`src/components-manifest.json` é gerado por `src/scripts/generateResolver.ts`. Ele lista todos os nomes de componentes e seus aliases (snake_case, kebab-case, sem o prefixo Max). O resolver (`MaxComponentsUiResolver`) lê esse arquivo para resolver os imports nas apps consumidoras.

Quando um novo arquivo `.vue` é adicionado a `src/components/`, rode `generateResolver.ts` para atualizar o manifesto e os aliases.

### Configuração de testes

Os testes ficam em `tests/` e usam Vitest + `@vue/test-utils` + `happy-dom`. A configuração global em `tests/setup.ts` faz mock de:
- `localStorage`
- `getComputedStyle` (com valores de variáveis CSS pré-definidos)
- `fetch`
- `indexedDB`
- módulo `virtual:uno.css`
- Fornece PrimeVue + Pinia globalmente a todos os componentes montados
- Faz stub das diretivas `v-tooltip` e `v-maska`

### Convenções de código

- `<script setup lang="ts">` com `defineProps<Interface>()` e `defineEmits<{...}>()` tipados
- Indentação de 4 espaços (imposta pelo ESLint `@stylistic/indent`)
- Aspas simples, sem vírgula final, ponto e vírgula obrigatório
- Ordem dos blocos Template → Script → Style nos arquivos `.vue`
- Múltiplos aliases de export para o mesmo componente são definidos em `src/index.ts` (ex.: `MaxInputText`, `InputText`, `InputField` apontam todos para o mesmo arquivo)
- `src/prime/index.ts` re-exporta componentes crus do PrimeVue que não têm wrapper Max, para que as apps consumidoras possam importar tudo de uma única fonte

## Execução de Agentes em Worktree

- Toda execução de agentes/subagentes que proponha modificações de código neste repositório deve ocorrer em um **git worktree separado**, criado especificamente para as alterações propostas (`git worktree add ../MaxComponentsUi-wt-<slug> -b <slug>`) — nunca diretamente no working tree principal.
- Valide as mudanças no worktree isolado e só então integre (merge) ao branch principal.
