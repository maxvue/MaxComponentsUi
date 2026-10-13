# Tema e Estilos

A biblioteca oferece dois sistemas de estilos complementares:

1. **MaxStyle** — Tokens semânticos e paleta canônica de cores do ecossistema Max
2. **presetMaxUno** — Preset UnoCSS (classes utilitárias para layout, espaçamento e cores)

---

## MaxStyle — Tokens Semânticos e Paleta Canônica

O `MaxStyle` define a identidade cromática e a escala de variáveis CSS (`--max-primary-*`, etc.) do Design System Max.
Não há mais injeção automática mandatória de estilos globais ou do UnoCSS na inicialização da aplicação.
O CSS deve ser importado granularmente onde necessário (ex: componentes específicos ou `import '@maxvue/max-components-ui/styles.css'` na raiz) para evitar side-effects e maximizar o tree-shaking.
### Paleta de Cores Semânticas

| Token | Cor base (500) | Uso |
|-------|---------------|-----|
| `primary` | `#00768E` (teal) | Ações principais, navegação |
| `success` | `#10B981` (esmeralda) | Confirmações, validações |
| `info` | `#0EA5E9` (sky blue) | Informações, notificações |
| `warning` | `#F59E0B` (âmbar) | Alertas, atenção |
| `danger` | `#EF4444` (vermelho) | Erros, exclusões |

Cada cor possui 10 variações de luminosidade (50 a 900), acessíveis como:

```css
/* Variáveis CSS geradas */
var(--max-primary-500)
var(--max-success-200)
var(--max-danger-700)
```

### Dark Mode

O dark mode é ativado pela classe CSS `.dark` (configurável via `darkModeSelector`):

```html
<html class="dark">
  <!-- Componentes em dark mode -->
</html>
```

---

## presetMaxUno — Preset UnoCSS

O preset UnoCSS adiciona classes utilitárias otimizadas para o ecossistema Max.

### Instalação

```typescript
// uno.config.ts
import { presetMaxUno } from '@maxvue/max-components-ui/preset'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [presetMaxUno()]
})
```

### Shortcuts (Classes com `!important`)

#### Padding e Margin

Padrão: `{p|m}{t|b|l|r|w|h|x|y}-{valor}` — valor em pixels.

| Classe | CSS gerado |
|--------|-----------|
| `p10` | `padding: 10px !important` |
| `pt5` | `padding-top: 5px !important` |
| `px20` | `padding-left: 20px !important; padding-right: 20px !important` |
| `m15` | `margin: 15px !important` |
| `mb-10` | `margin-bottom: -10px !important` |

#### Dimensões

| Classe | CSS |
|--------|-----|
| `hFull` ou `h-full` | `height: 100% !important` |
| `wFull` ou `w-full` | `width: 100% !important` |

#### Tipografia

| Classe | CSS |
|--------|-----|
| `font-size-1.2` | `font-size: 1.2rem !important` |
| `fs-0.9` | `font-size: 0.9rem !important` |
| `text-center` | `text-align: center !important` |
| `text-left` | `text-align: left !important` |

#### Cores

| Classe | CSS |
|--------|-----|
| `color-blue-600` | `color: var(--blue-600) !important` |
| `bg-primary-500` | `background-color: var(--primary-500)` |

#### Gap

| Classe | CSS |
|--------|-----|
| `gap-10` | `gap: 10px !important` |
| `row-gap-5` | `row-gap: 5px !important` |
| `col-gap-8` | `column-gap: 8px !important` |

---

### Rules (Classes sem `!important`)

#### Tipografia e Dimensões

| Classe | CSS |
|--------|-----|
| `font-weight-600` | `font-weight: 600` |
| `max-w-300` | `max-width: 300px` |
| `min-h-200` | `min-height: 200px` |

#### Grid

| Classe | CSS |
|--------|-----|
| `grid-cols-1fr-2fr` | `grid-template-columns: 1fr 2fr` |
| `grid-rows-auto-1fr` | `grid-template-rows: auto 1fr` |
| `grid-center` | `display: grid; place-items: center` |
| `grid-center-start` | `display: grid; place-items: center start` |

#### Hover dinâmico

| Classe | CSS |
|--------|-----|
| `hover-blue-600` | `&:hover { color: var(--blue-600) !important }` (aplica em filhos `.max-icon` também) |

#### Utilitários

| Classe | CSS |
|--------|-----|
| `elipsis` | `white-space: nowrap; text-overflow: ellipsis; overflow: hidden` |
| `s50` | Ver [Dimensionamento flexível: s1, s2 e variantes](#dimensionamento-flexível-s1-s2-e-variantes) (`flex: 1 1 0%`, mín. `1000px`, máx. `1200px`) |
| `opacity-50` | `opacity: 0.5` |
| `noClick` | `pointer-events: none` |

#### Dimensionamento flexível: s1, s2 e variantes

A família de regras `s` do `presetMaxUno` fornece utilitários para dimensionamento fluído de itens flexíveis (`flex items`).

> [!NOTE]
> **Nota de disponibilidade (2026-10-13):** O contrato documentado abaixo reflete a implementação consolidada na raiz do repositório (`src/presetMaxUno.ts`). Na revisão da branch atual (`wt-b7ccd219`), a regra implementada ainda corresponde à semântica percentual legada (`flex: 1 0 calc(n% - 8px)`). Certifique-se de que o pacote consumido inclua a nova regra antes de aplicar os novos multiplicadores em pixels e sufixos.

##### Sintaxe e Expressão Regular

A regra atende ao padrão:
```regex
/^s-?(\d+)(?:-(full|max|\d+))?$/
```

- **Prefixo:** `s` ou `s-` (hífen opcional).
- **Base `n`:** sequência de dígitos inteiros não negativos (`Number(d)`).
- **Sufixo opcional:** precedido por hífen, podendo ser `full`, `max` ou um valor numérico inteiro `m`.

##### Fórmulas CSS Geradas

Todas as variantes geram:
- `flex: 1 1 0%`
- `min-width: calc(n * 20px)`

E a propriedade `max-width` varia de acordo com o sufixo:
- **Sem sufixo (padrão):** `max-width: calc(n * 24px)`
- **Com sufixo `-full` ou `-max`:** `max-width: 100%` (são aliases equivalentes; definem teto de largura em 100%, sem impor `width: 100%`)
- **Com sufixo numérico `-m`:** `max-width: calc(m * 20px)` (o multiplicador do sufixo numérico é sempre **20px**, não 24px)

##### Tabela de Classes e Resoluções

| Classe / alias | flex | min-width | max-width |
|---|---|---|---|
| `s1` / `s-1` | `1 1 0%` | `20px` | `24px` |
| `s2` / `s-2` | `1 1 0%` | `40px` | `48px` |
| `s10` | `1 1 0%` | `200px` | `240px` |
| `s10-full` / `s-10-full` | `1 1 0%` | `200px` | `100%` |
| `s10-max` | `1 1 0%` | `200px` | `100%` |
| `s10-20` / `s-10-20` | `1 1 0%` | `200px` | `400px` |
| `s50` / `s-50` | `1 1 0%` | `1000px` | `1200px` |

##### Comportamento Flexbox e Contêiner Pai

- **Contexto Flex:** Nenhuma das declarações geradas inclui `!important`. A regra aplica estilos estritamente ao elemento filho (`flex item`). Ela **não** define `display: flex`, `flex-wrap` ou `gap` no elemento pai. Para que o comportamento funcione como esperado, o elemento que usa a classe deve ser filho direto de um contêiner flex (`display: flex`).
- **Fator de Crescimento:** O valor de `flex-grow` é fixo em `1` para todos os itens. O número `n` não representa peso de proporção nem porcentagem direta: todos os itens com classe `s*` competem igualmente pelo espaço livre até atingirem seus respectivos `max-width` ou serem limitados por `min-width`.
- **Prevenção de Quebra/Overflow:** A regra não define `flex-wrap`. Se a soma dos `min-width` dos itens filhos exceder a largura disponível do contêiner pai, ocorrerá overflow horizontal, a menos que o contêiner possua quebra ativada (ex.: `flex-wrap: wrap`).

##### Diferença em Relação à Regra Legada

Na regra percentual anterior, o número indicava porcentagem (ex.: `s50` gerava `calc(50% - 8px)`). Na nova especificação:
- `s50` (ou `s-50`) agora representa largura mínima de **1000px** (`50 * 20px`) e máxima de **1200px** (`50 * 24px`), e **não** 50% do contêiner.
- Usos existentes de classes como `s-50` ou `s-100` em layouts legados devem passar por revisão visual de layout em tarefa específica, e nunca por substituição indiscriminada sem conferência.

##### Casos Extremos e Limitações

- **Zero (`s0`, `s0-full`):** `s0` produz `min-width: 0px` e `max-width: 0px`. `s0-full` produz `min-width: 0px` e `max-width: 100%`.
- **Máximo menor que mínimo (`s10-0`):** gera `min-width: 200px` e `max-width: 0px`. Pelas regras de renderização do CSS standard, quando `min-width` é maior que `max-width`, o valor de `min-width` prevalece. Para evitar conflitos visuais, utilize sempre `m >= n`.
- **Padrões inválidos:** Decimais (`s1.5`), números negativos (`s--10`) ou maiúsculas (`s10-FULL`, `s10-MAX`) não são capturados pela expressão regular e não geram classes utilitárias.

##### Exemplo de Uso

O exemplo a seguir ilustra a distribuição de itens com classes estáticas dentro de um contêiner flex. Note que a declaração do contêiner (`flex gap-4 flex-wrap`) pertence à estrutura do pai, enquanto as classes `s*` atuam nos itens filhos:

```html
<div class="flex gap-4 flex-wrap">
    <div class="s10-full">
        Conteúdo principal flexível (mín. 200px, máx. 100%)
    </div>
    <div class="s10-20">
        Barra lateral com limite estendido (mín. 200px, máx. 400px)
    </div>
</div>
```

#### Cores predefinidas

As seguintes cores possuem variações (ex: `red-100` a `red-900`):

`red`, `green`, `blue`, `emerald`, `orange`, `amber`, `cyan`, `pink`, `yellow`, `gray`, `background`

| Classe | CSS |
|--------|-----|
| `red-500` | `color: var(--red-500)` |
| `bg-blue-200` | `background-color: var(--blue-200)` |

---

### Preflights (CSS global)

O preset compila automaticamente os arquivos SCSS da pasta `themes/` e injeta como CSS global:
- `themes/colors.scss` — Paleta completa de cores com variáveis CSS
- `themes/font.scss` — Configuração de fontes
- `themes/params.scss` — Parâmetros globais

---

## Tipografia

A biblioteca padroniza a tipografia através da variável CSS `--font-sans`:

```css
--font-sans: Quicksand, 'Instrument Sans', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
```

- **Responsabilidade do Host:** A biblioteca não embute arquivos de fontes binárias nem realiza requisições remotas a CDNs. A aplicação consumidora é responsável por carregar a webfont `Quicksand` (via Google Fonts ou asset local), se desejar a renderização com a fonte da marca.
- **Fallback de Sistema:** Se `Quicksand` não estiver carregada, os fallbacks nativos (`Instrument Sans`, `ui-sans-serif`, `system-ui`, `sans-serif`) são acionados de maneira consistente e segura.
- **Customização:** Para substituir a fonte em toda a biblioteca, basta definir `--font-sans` na raiz da sua aplicação.

---

## Variáveis CSS Disponíveis

As variáveis CSS mais comuns geradas pelo tema:

```css
/* Cores de fundo (background) */
--background-0       /* branco / superfície base */
--background-75
--background-100
--background-200
--background-300
--background-400
--background-600
--background-650
--background-750

/* Cores semânticas (primary, success, info, warning, danger) */
--max-primary-100 a --max-primary-950
--max-success-50 a --max-success-900
/* ... */

/* Cores nomeadas */
--blue-200 a --blue-800
--red-500, --green-600, --orange-600
/* ... */

/* Bordas e superfícies */
--surface-border
```
