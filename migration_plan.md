# Plano de Migração — Independência do PrimeVue

## Contexto

A partir do PrimeVue 5, a biblioteca deixará de ser open source. O objetivo é tornar a
`@maxvue/max-components-ui` **independente do PrimeVue**, reimplementando ou substituindo cada
componente que hoje depende dele — preservando a API pública, os estilos e o comportamento atuais.

Este arquivo é a **instrução para o agente de IA orquestrador**. Ele NÃO executa a migração dos
componentes; ele apenas gera os planos de migração individuais que serão executados por outra IA
futuramente.

## Fonte de dados

O arquivo [`status-primevue.migration.yaml`](status-primevue.migration.yaml) na raiz do projeto
lista **todos os componentes que precisam de migração** (apenas os dependentes do PrimeVue).
Cada item contém:

- `name` — nome do componente
- `level` — dificuldade (`baixa` | `media` | `alta` | `muito_alta`)
- `description_migration` — orientação resumida sobre o que trocar e o que preservar
- `status` — estado atual (`waiting` | `in_progress` | `done` | `blocked`)

## Tarefa do agente orquestrador

1. **Ler** o arquivo `status-primevue.migration.yaml` e obter a lista de componentes em
   `components`.

2. **Disparar 1 (um) sub-agente para cada item** do arquivo YAML. Os sub-agentes podem rodar em
   paralelo, pois cada plano é independente. Passe a cada sub-agente o objeto completo do item
   (`name`, `level`, `description_migration`).

3. Cada **sub-agente** deve:
   - Analisar o código-fonte real do componente em `src/components/[NomeComponente].vue`
     (e dependências relevantes, como `InputBase.vue`, stores, helpers e `@maxvue/max-use`).
   - **Selecionar, na pasta [`.claude/skills`](.claude/skills), as skills necessárias** para
     executar a migração daquele componente específico (ver seção "Skills disponíveis" abaixo).
     O sub-agente deve escolher apenas as skills realmente pertinentes ao componente e **incluir a
     lista das skills selecionadas dentro do plano gerado** (`migration_plans/[NomeComponente].md`),
     em uma seção própria chamada "Skills necessárias", com o caminho de cada skill e uma linha
     justificando por que ela é relevante.
   - Criar **um arquivo Markdown** em `migration_plans/[NomeComponente].md` contendo um
     **plano de migração completo e autossuficiente**, pronto para ser executado por outra IA no
     futuro, sem precisar de contexto adicional.

4. O nome do arquivo gerado deve seguir o padrão `migration_plans/[NomeComponente].md`
   (ex.: `migration_plans/MaxInputText.md`), usando exatamente o `name` do item no YAML.

## Estrutura obrigatória de cada `[NomeComponente].md`

Cada plano gerado pelo sub-agente deve conter, no mínimo, as seguintes seções:

1. **Componente** — nome, caminho do arquivo, nível de dificuldade.
2. **Dependências do PrimeVue** — quais componentes PrimeVue são importados/usados e onde.
3. **Dependências internas** — outros componentes Max, stores, helpers e utilitários de
   `@maxvue/max-use` que precisam ser preservados.
4. **API pública a preservar** — props, emits, slots, v-model e comportamento observável que NÃO
   podem mudar (a migração deve ser transparente para quem consome a lib).
5. **Estratégia de substituição** — o que trocar por HTML nativo/CSS, e o que exige biblioteca
   headless (indicar candidatas quando aplicável, ex.: TanStack Table, calendário headless,
   `@tanstack/vue-virtual`).
6. **Passos de implementação** — lista ordenada e detalhada de passos executáveis.
7. **Estilos** — como reproduzir a aparência atual (variáveis CSS do tema Max, classes UnoCSS,
   blocos SCSS existentes).
8. **Testes / verificação** — como validar que a migração preservou o comportamento (arquivos de
   teste em `tests/`, casos de borda, checklist manual).
9. **Skills necessárias** — lista das skills de `.claude/skills` selecionadas para este
   componente, cada uma com seu caminho e uma justificativa de uma linha.
10. **Riscos e pontos de atenção** — armadilhas, dependências transitivas (ex.: inputs que
    dependem do `InputBase` já migrado) e ordem recomendada.

## Skills disponíveis (pasta `.claude/skills`)

O sub-agente deve **inspecionar a pasta `.claude/skills`** e escolher as skills relevantes ao
componente que está migrando. As skills abaixo são as candidatas mais prováveis para esta migração
(a lista não é exaustiva — o sub-agente pode selecionar outras se fizer sentido):

**Base (aplicáveis a quase todos os componentes):**

- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da própria lib.
- `.claude/skills/vue-max-use-development-best-practices` — utilitários de `@maxvue/max-use`.
- `.claude/skills/vue-unocss-styling-best-practices` — classes utilitárias/UnoCSS do tema Max.
- `.claude/skills/vue-typescript-best-practices` — tipagem em `<script setup lang="ts">`.
- `.claude/skills/vue-eslint-stylelint-quality-standards` — padrões de lint/estilo do projeto.
- `.claude/skills/vue-vitest-testing-best-practices` — testes com Vitest + test-utils.
- `.claude/skills/vue-auto-import-components-best-practices` — resolver/manifest de componentes.

**Por tipo de componente:**

- Inputs / máscaras / validação → `.claude/skills/vue-inputs-masks-validation-best-practices`
- Dropdowns, Select, Menu, popovers → `.claude/skills/vue-floating-vue-tooltips-popovers-best-practices`
- Navegação por teclado (Select/AutoComplete/Menu) → `.claude/skills/vue-keyboard-shortcuts-navigation-best-practices`
- Lista virtualizada (MaxInputIconPicker) → `.claude/skills/vue-virtual-scroller-best-practices`
- Datas (MaxInputDatePicker) → `.claude/skills/vue-dayjs-date-manipulation-best-practices`
- Upload de arquivos (MaxInputFileUpload) → `.claude/skills/vue-uppy-file-upload-best-practices`
- Visualização de PDF (MaxPdfView) → `.claude/skills/vue-pdf-viewer-best-practices`
- Stores/estado (componentes com Pinia) → `.claude/skills/vue-pinia-state-management-best-practices`
- Componentes dinâmicos (MaxTable/MaxTableColumn) → `.claude/skills/vue-3-dynamic-components-and-keep-alive-caching-best-practices`
- Design visual / fidelidade de aparência → `.claude/skills/frontend-design-best-practices`
- Depuração durante a migração → `.claude/skills/systematic-debugging-best-practices`

> Observação: a pasta `.claude/skills` contém muitas skills não relacionadas (AdonisJS, Laravel,
> Python, etc.). Priorizar as skills com prefixo `vue-` e as listadas acima.

## Ordem e dependências

- **`InputBase` deve ser migrado primeiro** — ~19 inputs dependem dele. Os planos dos componentes
  que usam `InputBase` devem referenciar essa dependência na seção de riscos/ordem.
- **`MaxTable`, `MaxTableColumn` e `MaxTableFields`** devem ser tratados como um conjunto.
- Componentes marcados como `muito_alta` devem priorizar bibliotecas headless em vez de
  reimplementação do zero.

## Regras

- **Não executar a migração** dos componentes neste momento — apenas gerar os arquivos de plano.
- **Não alterar** o código-fonte dos componentes.
- Cada plano deve ser **autossuficiente**: uma IA futura deve conseguir executá-lo lendo apenas o
  arquivo `[NomeComponente].md` e o código do componente referenciado.
- Preservar as convenções do projeto (ver `CLAUDE.md`): `<script setup lang="ts">`, indentação de
  4 espaços, aspas simples, ordem Template → Script → Style.
