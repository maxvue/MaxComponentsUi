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

Esta seção registra a identidade **observada no código**, não uma proposta estética nova. Em caso de divergência, confronte `src/styles/style.ts` (paletas semânticas tipadas), `src/themes/tokens.scss` (variáveis de componente e foco efetivamente materializadas), `src/themes/colors.scss` (rampas amplas e tema escuro), `src/themes/font.scss`/`app.scss` (tipografia) e o componente em questão. Essas fontes ainda possuem diferenças entre si; nenhuma deve ser presumida “sincronizada” sem verificação. O playground é apenas uma vitrine parcial de integração: atualmente aplica gradiente roxo e fonte de sistema próprios, cobre uma fração dos componentes e não possui cenário escuro, portanto não é referência visual canônica.

### 1. Direção visual real

A assinatura da Max Components UI é **operacional, compacta e azul-petróleo**: controles de baixa altura, superfícies claras azuladas, texto em azul-acinzentado e teal profundo nas ações. A biblioteca prioriza leitura rápida em formulários, tabelas, menus e dashboards; ornamento é secundário à hierarquia e ao estado do controle.

- A cor de marca é `--max-primary-500: #00768E`; hover/ênfase usa `--max-primary-600: #005F77` e o modo escuro usa com frequência `--max-primary-400: #178DA5` (`src/styles/style.ts`).
- O shell escuro usa `--layout-shell-bg: #003048`; cabeçalhos de tabela usam `#003B53` com texto `#8AD6E8` (`src/themes/colors.scss`). Esse contraste azul-petróleo/ciano é mais característico da biblioteca do que a rampa genérica chamada `--primary-*`, que é neutra e **não** deve substituir `--max-primary-*` em ações da marca.
- A densidade é parte da identidade: `InputBase` usa campo de `36px`, label de `12px` e mensagem de `12px`; existem variantes compactas de `20px` para edição inline (`src/components/InputBase.vue`). Não existe, porém, uma altura universal de `36px` para todos os botões e controles.
- Cantos discretamente arredondados predominam: `4px`, `6px` e `8px` são os valores recorrentes. O campo padrão de `InputBase` usa `8px`, `MaxButton` usa `6px` e o float label usa `2px`. Formas circulares/pílulas são reservadas a avatares, ícones, badges e seleções equivalentes.

### 2. Cores e superfícies

#### Paleta de marca e semântica

As rampas semânticas completas estão tipadas em `MaxStyle`, em `src/styles/style.ts`. `src/themes/tokens.scss` materializa em CSS apenas parte delas; antes de consumir um shade, confirme que a variável existe ou forneça um fallback compatível:

| Papel | Token central | Valor | Uso predominante |
|---|---|---:|---|
| Marca/ação | `--max-primary-500` | `#00768E` | ação primária, seleção e foco |
| Sucesso | `--max-success-500` | `#10B981` | conclusão e confirmação |
| Informação | `--max-info-500` | `#0EA5E9` | informação contextual |
| Atenção | `--max-warning-500` | `#F59E0B` | cautela e pendência |
| Perigo | `--max-danger-500` | `#EF4444` | erro e ação destrutiva |
| WhatsApp | `--max-whatsapp-500` | `#25D366` | ação específica do canal |

Para hover, prefira o shade `600` da mesma família. Os estados não devem depender apenas de cor: texto, ícone, rótulo ARIA ou outra indicação perceptível deve acompanhar a diferença semântica.

#### Neutros e modo escuro

`src/themes/colors.scss` define a rampa azul-acinzentada `--background-0` a `--background-900`. No tema claro, `--background-0` é branco e `--background-900` é azul quase preto; sob `:root.dark`/`.dark`, os níveis `0–850` são remapeados em ordem inversa. Os níveis `875` e `900` não são redeclarados no bloco escuro e continuam herdados da raiz; não presuma uma inversão integral. Na prática:

- `0–100`: superfícies principais, repouso e hover suave;
- `200–400`: bordas, divisores e controles inativos;
- `500–650`: conteúdo secundário e placeholder;
- `700–775`: texto e ícones principais;
- `800–900`: alto contraste, shell e tooltip.

Essas faixas descrevem o uso predominante, não uma equivalência rígida. Valide contraste no contexto, especialmente no modo escuro.

Há três namespaces cromáticos históricos: `--max-primary-*` é a marca teal; `--blue-*` contém a mesma família com numeração deslocada (`--blue-700` equivale a `--max-primary-500`); e `--primary-*` é uma rampa neutra cinza. Em código novo, use `--max-primary-*` para a marca e trate os outros dois como compatibilidade, não como sinônimos.

#### Regra de consumo e exceções existentes

Em código novo, cores de interface devem partir de variáveis CSS semânticas. Literais são aceitáveis somente como fallback do próprio token (`var(--token, #valor)`), conteúdo intrínseco de assets/SVG, valor manipulado por um seletor de cor ou caso documentado que ainda não possua token. O repositório contém literais e fallbacks legados; portanto, a antiga afirmação de proibição absoluta não descrevia o estado real. Não replique esses casos sem necessidade.

### 3. Tipografia e hierarquia

- A família efetivamente aplicada globalmente é `Quicksand, sans-serif` (`src/themes/font.scss`). `src/themes/app.scss` também expõe `--font-sans` com fallback para `'Instrument Sans'`, fontes de sistema e emojis; isso é fallback/configuração, não evidência de uma segunda fonte carregada. `MaxTable` e `MaxInputToggle` ainda declaram `Jost` localmente e devem ser tratados como exceções legadas, não como uma terceira fonte canônica.
- A escala SCSS histórica registra `21/18/16/14px` para H1–H4 e `12px` para labels/inputs, mas os componentes de título possuem sua própria escala compacta: `MaxTitle1` usa `1.125rem`/`0.875rem` e `MaxTitle2` usa `0.9rem`/`0.85rem`, com títulos em caixa alta e pesos entre 300 e 500.
- Preserve a hierarquia compacta e o contraste entre título, subtítulo, label e mensagem. Não trate as variáveis `$size-h*` como garantia de que todo componente já as consome.
- Texto de interface deve ser direto, em português do Brasil e coerente entre ação e feedback. Caixa alta é um recurso de títulos/ênfase existente, não um padrão obrigatório para toda ação.

### 4. Anatomia e estados de componentes

`InputBase` é a principal anatomia compartilhada dos inputs de dados: organiza label, ícones laterais, slot do controle, indicadores `done`/`caution`/`error`/`required` e mensagem com `aria-live="polite"`. Ele é amplamente utilizado, mas **não é universal**: controles binários, componentes de arquivo/código e outras anatomias especializadas podem implementar estrutura própria.

O padrão desejável ao criar ou revisar controles é:

- manter label, controle, ajuda e erro visualmente próximos e programaticamente associados;
- usar estado neutro, hover/active, `:focus-visible`, disabled, loading, erro e sucesso de forma previsível;
- preservar a reserva de espaço de mensagens apenas quando isso fizer sentido para o layout; não truncar informação necessária sem alternativa acessível;
- usar elemento HTML nativo sempre que ele oferecer a semântica necessária; overlays devem controlar foco, Escape, retorno do foco e scroll, como já ocorre em `MaxModal`.

O `InputBase` ainda não garante sozinho a associação acessível completa: o próprio componente registra que o `for` do label só funciona quando o filho aplica o `inputId`, e hoje `aria-invalid` fica no wrapper. Cada input concreto deve conectar `id`, `aria-describedby`, `aria-invalid` e `aria-required` ao controle nativo quando aplicáveis.

### 5. Foco, movimento, elevação e camadas

- Os tokens canônicos de foco são `--max-focus-ring`, `--max-focus-outline`, `--max-focus-ring-color` e `--max-focus-ring-offset-color`, com valores próprios para `.dark` (`src/themes/tokens.scss`). Componentes existentes ainda variam entre outline e box-shadow; código novo deve consumir esses tokens e nunca remover o foco sem substituição visível.
- A linguagem de movimento é curta e funcional: transições de cor/borda/fundo em torno de `0.15s–0.2s`; animações mais longas pertencem a abertura/fechamento ou feedback explícito. Prefira propriedades específicas a `transition: all` e implemente `prefers-reduced-motion` quando houver movimento não essencial. Hoje essa proteção aparece em poucos componentes e deve ser validada, não presumida.
- Não há uma escala única e canônica de sombras. Overlays e popovers usam predominantemente sombras compactas próximas de `0 4px 12px rgb(0 0 0 / 15%)`; modais, imagens, drawers e tooltips variam conforme o contexto. Reutilize o padrão do componente-base mais próximo antes de criar uma nova elevação.
- O único z-index global explicitamente estável na camada de tema é o tooltip `.max-tooltip` em `99999` (`src/themes/params.scss`). Os demais valores estão distribuídos entre componentes; não assuma a antiga escala `100/1000/1100` como contrato global.

### 6. Compatibilidade e dívida visual em transição

A biblioteca não importa atualmente pacotes PrimeVue nos componentes, mas ainda preserva muitas classes `.p-*`, seletores de compatibilidade e nomes de tokens herdados para não quebrar consumidores. Logo, “zero referências PrimeVue” ainda não é uma descrição verdadeira. Em trabalho novo, use nomes semânticos `.max-*`; remova aliases legados somente com análise de compatibilidade e testes.

O preset UnoCSS e o modo Attributify também fazem parte da API distribuída (`src/presetMaxUno.ts`, `uno.config.ts`). Dentro dos SFCs da biblioteca, o padrão predominante é estilo semântico local em `<style lang="scss" scoped>`; utilitários públicos continuam válidos para consumidores e não devem ser declarados inexistentes. Diferencie API pública, compatibilidade legada e convenção interna antes de classificar uma ocorrência como inconsistência.

A biblioteca também não embute uma marca gráfica Max canônica: `MaxLogo` renderiza uma origem fornecida pela aplicação consumidora. Os SVGs em `src/assets/credit-card/` são recursos funcionais de bandeiras, não elementos da identidade institucional.

---

## DIRETRIZES DE ESTILIZAÇÃO FRONT-END

### 1. Convenção interna e API pública

- Nos componentes da biblioteca, prefira classes semânticas (`.max-*`, nomes de parte/estado) e estilos locais a sequências de utilitários no template. Isso torna a anatomia inspecionável e desacopla o componente da configuração UnoCSS do consumidor.
- UnoCSS, `presetMaxUno` e Attributify são APIs públicas mantidas para aplicações consumidoras. Sua presença não é uma inconsistência por si só.
- Use `:style` apenas para valores realmente dinâmicos calculados em runtime, como posição, dimensão configurável, progresso ou cor escolhida pelo usuário. Regras estáticas pertencem ao bloco de estilo.

### 2. Escopo dos estilos

- Para novos SFCs, siga o padrão predominante `<style lang="scss" scoped>`.
- Use `:deep(...)` somente quando for necessário alcançar a anatomia de um componente filho e `:global(...)` para elementos fora da raiz/teleport ou estado global documentado.
- Estilos globais, tokens e preflights pertencem a `src/themes/`, ao preset ou a outro ponto de entrada explicitamente global, não a um SFC arbitrário.

### 3. Seletores e estrutura

- Nomeie classes pelo papel do elemento, não pela aparência momentânea. Estados devem usar convenções consistentes como `is-*`, atributos semânticos ou pseudo-classes.
- Aninhe SCSS apenas até o ponto em que a relação estrutural fique clara; não espelhe obrigatoriamente toda a árvore DOM, pois isso aumenta especificidade e acoplamento.
- Evite `!important` em código novo. Quando compatibilidade legada exigir seu uso, mantenha o seletor restrito e documente a razão.
- Não remova classes `.p-*`, aliases ou seletores legados apenas por estética: confirme o contrato público e cubra a migração com testes.

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
