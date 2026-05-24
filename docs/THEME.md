# Tema e Estilos

A biblioteca oferece dois sistemas de estilos complementares:

1. **MaxStyle** — Preset PrimeVue (define as cores semânticas dos componentes)
2. **presetMaxUno** — Preset UnoCSS (classes utilitárias para layout, espaçamento e cores)

---

## MaxStyle — Preset PrimeVue

O `MaxStyle` é um preset baseado no **Aura** (PrimeVue) com paleta de cores personalizada.
É aplicado automaticamente ao usar `app.use(MaxComponentsUi)`.

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
| `s50` | `flex: 1 0 calc(50% - 8px)` |
| `opacity-50` | `opacity: 0.5` |
| `noClick` | `pointer-events: none` |

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
--max-primary-50 a --max-primary-900
--max-success-50 a --max-success-900
/* ... */

/* Cores nomeadas */
--blue-200 a --blue-800
--red-500, --green-600, --orange-600
/* ... */

/* Bordas e superfícies */
--surface-border
```
