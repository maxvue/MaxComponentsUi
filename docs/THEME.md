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

### Instalação e Configuração

O preset é exportado através do subpath público `@maxvue/max-components-ui/preset` (também disponibilizado sob o alias `maxUnoPreset`).

Para utilizar classes utilitárias e atributos nos templates Vue, configure o UnoCSS com os presets recomendados:

```typescript
// uno.config.ts
import { defineConfig, presetAttributify, presetWind3 } from 'unocss';
import { presetMaxUno } from '@maxvue/max-components-ui/preset';

export default defineConfig({
    presets: [
        presetMaxUno(),
        presetWind3(),
        presetAttributify({
            // Protege atributos reais HTML/Vue para evitar extração indevida
            ignoreAttributes: ['style', 'color', 'background', 'hover']
        })
    ]
});
```

> [!NOTE]
> **Classes estáticas vs. Attributify:** As classes utilitárias estáticas (ex.: `class="s10-full"`) funcionam imediatamente apenas com o `presetMaxUno()`. O uso na forma de atributos sem valor (valueless attributes, ex.: `<MaxInputText s10-full />`) requer obrigatoriamente a inclusão do `presetAttributify()`.

#### Integração com Vite e CSS Virtual

No arquivo de configuração do Vite (`vite.config.ts`) e no ponto de entrada da aplicação (`main.ts`):

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';

export default defineConfig({
    plugins: [
        vue(),
        UnoCSS()
    ]
});
```

```typescript
// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import 'virtual:uno.css';

createApp(App).mount('#app');
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
> **Conformidade de Versão:** O contrato documentado abaixo reflete a implementação consolidada em `src/presetMaxUno.ts`. Certifique-se de que o pacote consumido na sua aplicação esteja alinhado a esta especificação baseada em limites em pixels antes de aplicar os novos multiplicadores e sufixos.

##### Sintaxe e Expressão Regular

A regra atende ao padrão:
```regex
/^s-?(\d+)(?:-(full|max|\d+))?(?:-(start|end|desktop|mobile|tablet)){0,2}$/
```

- **Prefixo:** `s` ou `s-` (hífen opcional).
- **Base `n`:** sequência de dígitos inteiros não negativos (`Number(d)`).
- **Sufixo de extensão (opcional):** precedido por hífen, podendo ser `full`, `max` ou um valor numérico inteiro `m`.
- **Sufixos de direção e dispositivo (opcionais, até dois):** precedidos por hífen, podendo conter uma direção (`start` ou `end`) e um dispositivo (`desktop`, `mobile` ou `tablet`), em qualquer ordem após a extensão (ex.: `s7-end-mobile` ou `s7-mobile-end`). Para manter clareza semântica no código, recomenda-se combinar no máximo uma direção e um dispositivo.

##### Fórmulas CSS Geradas

Todas as variantes geram:
- `flex: 1 1 0%`
- `min-width: calc(n * 20px)`

E a propriedade `max-width` varia de acordo com o sufixo:
- **Sem sufixo (padrão):** `max-width: calc(n * 24px)`
- **Com sufixo `-full` ou `-max`:** `max-width: 100%` (são aliases equivalentes; definem teto de largura em 100%, sem impor `width: 100%`)
- **Com sufixo numérico `-m`:** `max-width: calc(m * 20px)` (o multiplicador do sufixo numérico é sempre **20px**, não 24px)

##### Fragmentação CSS e Quebras no MaxGrid

Propriedades de fragmentação emitidas no CSS do preset:
- **Com sufixo `-start`:** `break-before: always`
- **Com sufixo `-end`:** `break-after: always`

Condicionamento por dispositivo no preset (largura de viewport CSS):
- **`mobile`:** emitido sob media query `@media (max-width: 767.98px)`.
- **`tablet`:** emitido sob media query `@media (max-width: 1000.98px)` (inclui larguras mobile).
- **`desktop`:** emitido sob media query `@media (min-width: 1001px)`.
- **Sem dispositivo:** emitido sem media query (incondicional).
- **Dispositivo sem direção (ex.: `s10-mobile`):** não emite nenhuma propriedade `break-*` adicional.

| Dispositivo no token | Condição CSS emitida para `break-*` | Dimensões (`min`/`max-width`) | Quebra real no MaxGrid atual |
|---|---|---|---|
| `mobile` | `@media (max-width: 767.98px)` | Sempre ativas | Não |
| `tablet` | `@media (max-width: 1000.98px)` (inclui mobile) | Sempre ativas | Não |
| `desktop` | `@media (min-width: 1001px)` | Sempre ativas | Não |
| Sem dispositivo, com `start`/`end` | Sem media query (incondicional) | Sempre ativas | Sim, nos filhos diretos |
| Dispositivo sem direção | Nenhum `break-*` emitido | Sempre ativas | Não |

> [!IMPORTANT]
> **Diferença crucial entre Parsers e Suporte no MaxGrid:**
> 1. O organizador de linhas de `<MaxGrid>` (`src/components/base/gridSlotRows.ts`) opera com a expressão regular:
>    ```regex
>    /^s-?(\d+)(?:-(full|max|\d+))?(?:-(start|end))?$/
>    ```
>    Isso significa que o `<MaxGrid>` atual **não interpreta sufixos de dispositivo** (`desktop`, `mobile`, `tablet`). Tokens com dispositivo geram as media queries CSS de fragmentação descritas acima, mas NÃO produzem quebras estruturais de linha no `<MaxGrid>`. Quebras estruturais no `<MaxGrid>` funcionam exclusivamente com tokens sem dispositivo (`start` ou `end`).
> 2. Em contêineres `div` flex comuns fora de `<MaxGrid>`, as propriedades CSS `break-before` e `break-after` do standard aplicam-se a contextos de fragmentação (páginas impressas, colunas CSS multicol) e não comandam quebra de linha em flexbox CSS comum.

Dentro do `<MaxGrid>`, o componente inspeciona os filhos lógicos diretos do seu slot (expandindo Fragments como `v-for` e `<template>`) e organiza os itens em segmentos de linha (`div.max-grid-row`) quando detecta marcadores `start` ou `end` ativos:
- **`-end`:** Encerra o segmento atual imediatamente após o item, fazendo com que o próximo item vá para uma nova linha.
- **`-start`:** Inicia um novo segmento de linha imediatamente antes do item, separando-o dos elementos anteriores.
- **Pares redundantes:** Quando um item com `-end` é seguido por um item com `-start`, eles definem uma única fronteira de quebra (não criam linha intermediária vazia).
- **Sem marcadores:** Quando o `<MaxGrid>` não contém nenhum marcador ativo, os VNodes originais são renderizados diretamente sem qualquer wrapper `div.max-grid-row`, preservando total retrocompatibilidade e seletores diretos.
- **Fronteiras e Largura:** A quebra de linha não altera o `max-width` do item. Um item com `s3-10-start`, por exemplo, mantém teto máximo de 200px (`10 * 20px`), não passando a ocupar 100% da tela. Caso o conteúdo necessite de largura maior, utilize `full` ou `max` (ex.: `s3-full-start`).

##### Tabela de Classes e Resoluções

| Classe / Atributo | flex | min-width | max-width | Quebra no MaxGrid |
|---|---|---|---|---|
| `s1` / `s-1` | `1 1 0%` | `20px` | `24px` | Nenhuma |
| `s2` / `s-2` | `1 1 0%` | `40px` | `48px` | Nenhuma |
| `s3-start` | `1 1 0%` | `60px` | `72px` | Inicia nova linha antes do item |
| `s3-10-start` | `1 1 0%` | `60px` | `200px` | Inicia nova linha antes do item |
| `s7-end` | `1 1 0%` | `140px` | `168px` | Encerra a linha após o item |
| `s7-10-end` | `1 1 0%` | `140px` | `200px` | Encerra a linha após o item |
| `s7-end-mobile` | `1 1 0%` | `140px` | `168px` | Apenas CSS condicional; sem quebra no MaxGrid |
| `s10` | `1 1 0%` | `200px` | `240px` | Nenhuma (não significa 10%) |
| `s10-20` / `s-10-20` | `1 1 0%` | `200px` | `400px` | Nenhuma (extensão usa multiplicador 20px) |
| `s10-full` / `s-10-full` | `1 1 0%` | `200px` | `100%` | Nenhuma (teto máximo, não largura forçada) |
| `s10-max` | `1 1 0%` | `200px` | `100%` | Nenhuma (alias de -full) |
| `s-50-full-start` | `1 1 0%` | `1000px` | `100%` | Inicia nova linha antes do item |
| `s-50-max-end` | `1 1 0%` | `1000px` | `100%` | Encerra a linha após o item |
| `s50` / `s-50` | `1 1 0%` | `1000px` | `1200px` | Nenhuma (não significa 50%) |
| `s100` | `1 1 0%` | `2000px` | `2400px` | Nenhuma (não significa 100%) |
| `s0` | `1 1 0%` | `0px` | `0px` | Nenhuma (pode colapsar) |
| `s0-full` | `1 1 0%` | `0px` | `100%` | Nenhuma (permite mínimo zero) |
| `s10-0` | `1 1 0%` | `200px` | `0px` | Nenhuma (conflito: min-width prevalece no CSS) |

##### Comportamento Flexbox e Contêiner Pai

- **Contexto Flex:** Nenhuma das declarações geradas inclui `!important`. A regra aplica estilos estritamente ao elemento filho (`flex item`). Ela **não** define `display: flex`, `flex-wrap` ou `gap` no elemento pai. Para que o comportamento funcione como esperado, o elemento que usa a classe deve ser filho direto de um contêiner flex (`display: flex`).
- **Fator de Crescimento:** O valor de `flex-grow` é fixo em `1` para todos os itens. O número `n` não representa peso de proporção nem porcentagem direta: todos os itens com classe `s*` competem igualmente pelo espaço livre até atingirem seus respectivos `max-width` ou serem limitados por `min-width`.
- **Prevenção de Quebra/Overflow:** A regra não define `flex-wrap`. Se a soma dos `min-width` dos itens filhos exceder a largura disponível do contêiner pai, ocorrerá overflow horizontal, a menos que o contêiner possua quebra ativada (ex.: `flex-wrap: wrap`). O wrap natural acomoda itens em novas linhas quando necessário, mas nunca comprime um item abaixo de seu `min-width`.

##### Diferença em Relação à Regra Legada

Na regra percentual anterior, o número indicava porcentagem (ex.: `s50` gerava `calc(50% - 8px)`). Na especificação consolidada:
- `s50` (ou `s-50`) agora representa largura mínima de **1000px** (`50 * 20px`) e máxima de **1200px** (`50 * 24px`), e **não** 50% do contêiner.
- `s100` agora representa largura mínima de **2000px** (`100 * 20px`) e máxima de **2400px** (`100 * 24px`), e **não** 100% do contêiner.
- Usos existentes de classes como `s-50` ou `s-100` em layouts legados devem passar por revisão visual de layout em tarefa específica, e nunca por substituição indiscriminada sem conferência. Para ocupar a linha toda com elasticidade, utilize `s10-full` ou `s10-max`.

##### Casos Extremos e Limitações

- **Zero (`s0`, `s0-full`):** `s0` produz `min-width: 0px` e `max-width: 0px`. `s0-full` produz `min-width: 0px` e `max-width: 100%`.
- **Máximo menor que mínimo (`s10-0`):** gera `min-width: 200px` e `max-width: 0px`. Pelas regras de renderização do CSS standard, quando `min-width` é maior que `max-width`, o valor de `min-width` prevalece. Para evitar conflitos visuais, utilize sempre `m >= n`.
- **Limites de Precisão Numérica:** Valores excessivamente extensos processados por `Number(d)` no JavaScript do gerador podem atingir `Number.MAX_SAFE_INTEGER`, resultando em perda de precisão aritmética.
- **Padrões inválidos:** Decimais (`s1.5`), números negativos (`s--10`) ou maiúsculas (`s10-FULL`, `s10-MAX`) não são capturados pela expressão regular e não geram classes utilitárias.
- **Extração Estática do UnoCSS:** O compilador do UnoCSS realiza varredura estática de código-fonte. Classes geradas dinamicamente via interpolação de strings em runtime (ex.: `:class="'s' + tamanho"`) não são detectadas a menos que constem previamente em uma safelist configurada no `uno.config.ts`.

##### Exemplo de Uso no MaxGrid (Vue 3)

O exemplo a seguir ilustra o uso de marcadores de linha explícita em um formulário com `<MaxGrid>`, utilizando atributos valueless e classes equivalentes com tags de abertura em linha única:

```vue
<template>
    <MaxGrid label="Formulário de Proposta">
        <MaxInputText class="s10-full" label="Cliente" v-model="form.cliente" />
        <MaxInputNumber s7-end label="Consumo Médio (kWh)" v-model="form.consumo" />
        <div class="s3-10-start" id="painel-historico">
            <span>Histórico de faturas dos últimos 12 meses</span>
        </div>
    </MaxGrid>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxGrid, MaxInputText, MaxInputNumber } from '@maxvue/max-components-ui';

    const form = ref({
        cliente: '',
        consumo: null as number | null
    });
</script>
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

O preset compila automaticamente o barril SCSS principal da biblioteca (`themes/all.scss`) e injeta as definições como CSS global:
- `themes/params.scss` — Parâmetros estruturais globais, bordas e espaçamentos
- `themes/colors.scss` — Paleta completa de cores com variáveis CSS
- `themes/font.scss` — Configuração de fontes e tipografia
- Variáveis de estado, resets e tokens canônicos do ecossistema Max

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
