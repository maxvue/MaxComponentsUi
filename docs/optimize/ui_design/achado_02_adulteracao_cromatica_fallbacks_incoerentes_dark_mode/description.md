# Adulteração Cromática da Identidade Institucional, Cores Hardcoded e Quebra de Contraste no Modo Escuro (`.dark`)

## Severidade: Crítica

## Componentes Impactados
- `src/components/MaxInputCode.vue` (Fallbacks com azul genérico `#3b82f6` e `#1e1e1e` hardcoded)
- `src/components/MaxInputCodeToolbar.vue` (Fallbacks de cor primária com `#3b82f6`)
- `src/components/MaxInputFileUpload.vue` (Tokens inexistentes `--primary-c`, `--primary-mouse` com fallbacks `#3b82f6` e `#2563eb`)
- `src/components/MaxInputIconPicker.vue` (Fallback de `--max-primary-600` apontando para `#2563eb`)
- `src/components/MaxInputMarkdown.vue` (42 ocorrências de fallbacks inconsistentes, ex.: `--max-primary-700, #1d4ed8`)
- `src/components/MaxToast.vue` (Texto hardcoded em `#fff` e sombras fixas)
- `src/components/MaxBottomMenu.vue` (`color: #fff;` hardcoded)
- `src/components/MaxImage.vue` (Bordas e fundos em `#fff` sem suporte a `.dark`)
- `src/components/MaxLoaderAi.vue` (`color: white !important;`)
- `src/components/MaxDoneIcon.vue` & `src/components/MaxErrorIcon.vue` (`background: #fff;`)
- `src/themes/colors.scss` (Token `--surface-border` definido apenas no `:root` claro e ausente no bloco `.dark`)
- Mais de 50 outros SFCs contendo mais de 260 fallbacks hexadecimais em chamadas `var()`.

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
1. **Descaracterização Cromática da Marca**: Em diversos componentes, o tom de destaque visual exibido (em bordas ativas, ícones de loading, seleções e botões) desvia do Teal institucional da Max (`#00768E`) e passa a exibir o Azul Tailwind (`#3b82f6`, `#2563eb`, `#1d4ed8`).
2. **Cegueira e Falhas de Contraste no Modo Escuro (`.dark`)**: Ao alternar para o tema escuro, componentes como `MaxToast.vue`, `MaxImage.vue`, `MaxLoaderAi.vue`, `MaxDoneIcon.vue` e `MaxBottomMenu.vue` mantêm cores textuais ou de fundo fixas em branco (`#fff` / `white`), gerando contraste nulo ou caixas brancas ofuscantes no meio da interface escura.
3. **Bordas Claras em Overlays Escuros**: Popovers, DatePickers, Modais e Autocompletes renderizam uma borda cinza-clara destacada (`#e2e8f0`) mesmo com o fundo do painel escurecido.

### Causa Raiz Profunda
1. **Adulteração de Fallbacks por "Copy-Paste" Descontrolado**: Durante o desenvolvimento ou migração de componentes, desenvolvedores e assistentes de IA copiaram trechos de utilitários Tailwind ou de bibliotecas de terceiros inserindo fallbacks arbitrários em `var(--max-primary-500, #3b82f6)`. O autor assumiu que o fallback nunca seria usado ou desconhecia a paleta canônica do Design System definida em `src/styles/style.ts` (`MaxStyle.semantic.primary.500 = #00768E`). Em contextos onde a variável CSS não atinge o elemento ou durante o carregamento inicial, a aplicação sofre um "flash" cromático azul em vez do verde-azulado institucional.
2. **Cores Hexadecimais e Literais Isoladas do Sistema de Temas**: O uso de valores hardcoded como `color: #fff;` ou `background-color: #fff;` desrespeita a regra canônica de `GEMINI.md`, que determina o consumo obrigatório através das variáveis do tema (`var(--background-0)` e `var(--background-775)`). No Max Design System, o modo escuro opera por inversão de escala (`--background-0` passa de `#FFFFFF` para `#17293D`, e `--background-775` passa de cinza-escuro para branco). Hardcoded `#fff` ignora esse ciclo de inversão.
3. **Assimetria de Tokens no `src/themes/colors.scss`**: O token `--surface-border` foi injetado na linha 1032 (`--surface-border: var(--background-200);`) apenas dentro do seletor `:root` (modo claro). Na seção `:root.dark, .dark` (iniciada na linha 1051), `--surface-border` foi completamente esquecido. Como consequência, em modo escuro `--surface-border` herda o valor claro ou cai no fallback `#e2e8f0` presente nos 28 componentes que o utilizam.

---

## Evidência Técnica

### 1. Fallbacks com Cores Estranhas à Identidade Visual (Tailwind Blue vs Max Teal)
Em `src/components/MaxInputCode.vue`:
```vue
<!-- Linha 41: Ícone de loading do editor usando fallback Tailwind Blue-500 (#3b82f6) -->
<MaxIcon icon="eos-icons:loading" :size="1.8" color="var(--max-primary-500, #3b82f6)" />
```
```scss
// Linhas 399 e 407: Borda de foco usando fallback #3b82f6 em vez de #00768E
border-color: var(--max-primary-500, #3b82f6);
```

Em `src/components/MaxInputIconPicker.vue`:
```scss
// Linha 502: Fallback de tom 600 usando Tailwind Blue-600 (#2563eb) em vez de Teal 600 (#005F77)
color: var(--max-primary-600, #2563eb);
```

Em `src/components/MaxInputMarkdown.vue`:
```scss
// Linha 573: Fallback de tom 700 usando Tailwind Blue-700 (#1d4ed8) em vez de Teal 700 (#004860)
color: var(--max-primary-700, #1d4ed8);
```

Em `src/components/MaxInputFileUpload.vue`:
```scss
// Linha 367, 390 e 402: Invenção de nomes de variáveis inexistentes no Design System com Tailwind Blue
border-top-color: var(--primary-500, #3b82f6);
background-color: var(--primary-c, #3b82f6) !important;
background-color: var(--primary-mouse, #2563eb) !important;
```

### 2. Cores Literais Hardcoded Ignorando `.dark`
Em `src/components/MaxToast.vue`:
```scss
// Linhas 157-160
color: #fff;
box-shadow:
    0 4px 16px rgb(0 0 0 / 25%),
    0 1px 4px rgb(0 0 0 / 15%);
```

Em `src/components/MaxImage.vue`:
```scss
// Linhas 680 e 705
border: 2px solid #fff;
background-color: #fff;
```

Em `src/components/MaxLoaderAi.vue`:
```scss
// Linha 59
.icon-div {
    color: white !important;
}
```

### 3. Omissão Crítica no Arquivo de Temas `src/themes/colors.scss`
```scss
// Linha 1032 - Dentro de :root (Modo Claro)
--surface-border: var(--background-200);

// Linha 1051-1052 - Seletor .dark (Modo Escuro)
:root.dark,
.dark {
    // --surface-border NÃO É DECLARADO AQUI!
    // Resulta na manutenção do valor claro (#e2e8f0) para todas as 28 ocorrências:
    // var(--surface-border, #e2e8f0)
```

---

## Impacto na Consistência Visual do Design System

1. **Fragmentação de Marca**: O ecossistema Max possui como diferencial estético a paleta Teal (`#00768E`). A intrusão silenciosa de azuis Tailwind destrói a coesão visual e passa a impressão de uma interface construída com templates genéricos.
2. **Incompatibilidade Acessível no Modo Escuro**: Cores fixadas em `#fff` criam inconsistência de luminância que pode violar os critérios de conformidade WCAG 2.1 AA (contraste mínimo de 4.5:1 para texto normal e 3:1 para controles de interface).
3. **Degradação Estética de Overlays**: A borda cinza-clara `#e2e8f0` em torno de caixas escuras no modo escuro cria um contorno espúrio e artificial, eliminando a sensação de profundidade e polimento profissional das superfícies.
