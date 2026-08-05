# MaxChart — Design

Data: 2026-08-05
Status: aprovado

## Objetivo

Adicionar um componente de gráfico à `@maxvue/max-components-ui`, replicando a API pública do `Chart` do PrimeVue 4, porém implementado **diretamente sobre `chart.js`**, sem importar `primevue/chart`.

Hoje a lib não expõe gráfico nenhum: `chart.js` não está nas dependências e o `Chart` do PrimeVue não está entre os re-exports de [`src/prime/index.ts`](../../../src/prime/index.ts) (que só traz `OrganizationChart`, componente diferente). Como há um esforço ativo de independência do PrimeVue (ver [`CLAUDE.md`](../../../CLAUDE.md)), o `MaxChart` nasce independente — implementar como wrapper hoje criaria uma dívida de migração amanhã.

O `Chart` do PrimeVue é, ele próprio, um passthrough fino sobre o `chart.js`. Reimplementá-lo não envolve reescrever lógica de gráfico: envolve reescrever ~80 linhas de ciclo de vida de componente.

## Decisões tomadas

| Questão | Decisão |
|---|---|
| Como o `chart.js` entra no pacote? | **`dependency` direta** + componente `defineAsyncComponent` |
| Superfície da API | **Paridade pura com o PrimeVue** — passthrough fiel, sem opinião de estilo |
| Registro dos módulos do Chart.js | **`chart.js/auto`** (registra tudo, igual ao PrimeVue) |
| Dark mode | **Resolvido pelo componente** (`MutationObserver` sobre a classe `.dark`) |
| Resize de container | **Resolvido pelo componente** (`ResizeObserver`) |
| Reatividade de `data` | **Update in-place** (`chart.update()`), animação preservada |
| Reatividade de `type` | **Recriação** (o Chart.js não troca de controller in-place) |
| Açúcar sintático (arrays crus, prop `palette`) | **Não implementar** (YAGNI; adicionável depois sem breaking change) |

### Sobre "paridade pura" e os dois comportamentos extras

Paridade pura vale para a **superfície de API e para a aparência**: nenhuma cor de série, fonte ou grid é imposta pelo componente. Dark mode e resize são **infraestrutura**, não estilo — não alteram nada que a app tenha especificado em `options`, apenas corrigem dois modos de falha que toda app consumidora encontraria e teria que resolver de novo. Ver a seção "Dark mode" para a delimitação exata do que é tocado.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/MaxChart.vue` | **Novo** — o componente |
| `tests/components/MaxChart.test.ts` | **Novo** — testes |
| `tests/setup.ts` | Adicionar stub de `ResizeObserver` (não existe hoje) |
| `package.json` | `chart.js` em `dependencies` |
| `src/index.ts` | Export async + aliases |
| `src/components-manifest.json` | Regenerado por script |
| Playground | Página de verificação manual |

## API pública

### Props

| Prop | Tipo | Default | Papel |
|---|---|---|---|
| `type` | `string` | `undefined` | `bar`, `line`, `pie`, `doughnut`, `radar`, `polarArea`, `bubble`, `scatter` |
| `data` | `object` | `undefined` | Objeto `data` do Chart.js (`labels` + `datasets`) |
| `options` | `object` | `undefined` | Objeto `options` do Chart.js |
| `plugins` | `array` | `undefined` | Plugins inline do Chart.js |
| `width` | `number` | `300` | Largura do canvas |
| `height` | `number` | `150` | Altura do canvas |
| `canvasProps` | `object` | `undefined` | Atributos extras aplicados ao `<canvas>` |

Tipagem via `defineProps<Interface>()` com os tipos do próprio `chart.js` (`ChartType`, `ChartData`, `ChartOptions`, `Plugin`) — sem `any`, conforme a convenção do projeto.

### Emits

| Evento | Payload |
|---|---|
| `select` | `{ originalEvent, dataset, element }` — clique sobre um elemento do gráfico |
| `loaded` | A instância do Chart.js, após o mount |

### Métodos expostos (`defineExpose`)

`refresh()`, `reinit()`, `generateLegend()`, `getChart()` — paridade com o PrimeVue.

### Template

Mínimo: uma `<div>` container (alvo do `ResizeObserver`) envolvendo o `<canvas>` com `ref`, `width`, `height` e `v-bind="canvasProps"`.

## Ciclo de vida

### Mount

`onMounted` cria a instância com `new Chart(canvasRef.value, { type, data, options, plugins })`.

O `options` entregue à instância é o da prop com `responsive: true` e `maintainAspectRatio: false` aplicados **por baixo** (a app sobrescreve se quiser) — necessários para o `ResizeObserver` funcionar; sem eles o canvas mantém o aspect ratio original e ignora o container.

Um listener de `click` no canvas traduz o evento em `select` via `chart.getElementsAtEventForMode()`. Emite `loaded` com a instância.

### Watchers

Três, com responsabilidades separadas:

- `watch(() => props.data, ..., { deep: true })` → atribui `chart.data`, chama `chart.update()`. Animação preservada.
- `watch(() => props.options, ..., { deep: true })` → atribui `chart.options` (reaplicando os defaults de responsividade), chama `chart.update()`.
- `watch(() => props.type)` → **único caso de recriação**: `chart.destroy()` seguido de nova instância.

### Unmount

`onBeforeUnmount` chama `chart.destroy()`, desconecta o `ResizeObserver` e o `MutationObserver` do tema. Sem isso o Chart.js vaza o canvas e mantém listeners globais vivos.

## Dark mode

O dark mode desta lib é **por classe**: `darkModeSelector: '.dark'` em [`src/index.ts:138`](../../../src/index.ts#L138), com as variáveis CSS redefinidas sob `.dark` em [`src/themes/colors.scss:1069`](../../../src/themes/colors.scss#L1069). Não há composable reativo de tema em uso na lib — a detecção é feita observando o DOM.

**Mecanismo:** um `MutationObserver` sobre `document.documentElement`, filtrado para `attributes` / `attributeFilter: ['class']`. Quando a classe muda, o componente relê as cores do tema via `getComputedStyle` e chama `chart.update()`.

Como as cores vêm de variáveis CSS que a própria classe `.dark` redefine, o componente **não precisa saber qual tema está ativo** — só precisa reler quando algo mudar. Isso o torna imune a temas futuros além de claro/escuro.

**O que é escrito:** `Chart.defaults.color` (texto de eixos e legenda, a partir de `--text-c`) e `Chart.defaults.borderColor` (linhas de grid).

**Duas ressalvas, registradas deliberadamente:**

1. `Chart.defaults` é **estado global** do Chart.js, compartilhado por todas as instâncias. A última a atualizar define o valor para todas. Isso é aceitável porque todas leem do mesmo tema e portanto convergem para o mesmo valor.
2. Escrever em `Chart.defaults` só afeta o que a app **não** especificou explicitamente em `options` — o Chart.js resolve defaults com menor precedência que o `options` da instância. Esse é exatamente o comportamento desejado e o que mantém a promessa de paridade pura.

## Resize

Um `ResizeObserver` na `<div>` container chama `chart.resize()`.

O Chart.js só escuta `window.resize` nativamente. Sem o observer, o canvas fica esticado ou cortado quando o container muda de tamanho sem a janela mudar — sidebar colapsando, modal abrindo, grid refluindo. Combinado com `maintainAspectRatio: false`, o canvas acompanha o container.

## Testes

`tests/components/MaxChart.test.ts`, com Vitest + `@vue/test-utils`.

O `happy-dom` não implementa `canvas.getContext('2d')`, então `chart.js/auto` é mockado com `vi.mock`: um construtor falso que registra as chamadas de `update`, `resize` e `destroy`. Isso é o correto aqui — o objetivo é testar **o wrapper**, não o Chart.js.

O `tests/setup.ts` precisa de um stub de `ResizeObserver` (verificado: não existe hoje).

Casos:

- monta e instancia o Chart.js com `type` / `data` / `options` corretos
- emite `loaded` com a instância após o mount
- `data` mudando → `update()` chamado, `destroy()` **não**
- `options` mudando → `update()` chamado
- `type` mudando → `destroy()` seguido de nova instância
- unmount → `destroy()` chamado, observers desconectados
- `select` emitido no clique com o payload esperado
- `ResizeObserver` disparando → `resize()` chamado
- classe `.dark` alternando → `update()` chamado e `Chart.defaults.color` alterado

## Integração

1. `package.json`: `chart.js` em `dependencies`
2. `src/index.ts`: `export const MaxChart = defineAsyncComponent(() => import('./components/MaxChart.vue'))`, seguindo o padrão de `MaxMaps` ([`src/index.ts:101`](../../../src/index.ts#L101)) e `MaxPdfView`. Alias `Chart` além de `MaxChart`.
3. `npx tsx src/scripts/generateResolver.ts` para regenerar `src/components-manifest.json`
4. Página no playground: alguns tipos, troca de tema, resize de container
5. `npm run type-check` e `npm run lint` limpos ao final

O componente ser async é o que torna a `dependency` direta aceitável: o `chart.js` (~70kb gzip) fica fora do bundle eager e só chega ao navegador de quem renderiza um gráfico.

## Relação com a migração do PrimeVue

O `MaxChart` **não** entra em [`status-primevue.migration.yaml`](../../../status-primevue.migration.yaml): aquele arquivo cataloga componentes existentes que hoje dependem do PrimeVue e precisam ser migrados. O `MaxChart` nasce independente, sem nenhum import de `primevue/*`.

## Fora de escopo

- Açúcar sintático para dados (arrays crus, prop `palette`)
- Defaults de estilo do tema Max nas séries (cores, fontes, grid)
- Registro seletivo de módulos do Chart.js por `type`
- Export de gráfico como imagem
- Wrappers por tipo (`MaxChartBar`, `MaxChartLine`, etc.)
