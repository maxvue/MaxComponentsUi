# Plano de Implementação: Restauração da Identidade Cromática Max Teal, Erradicação de Fallbacks Hexadecimais e Blindagem de Contraste no Modo Escuro (`.dark`)

## 1. Objetivo da Refatoração

Restaurar a integridade visual da identidade institucional do ecossistema Max, eliminando a adulteração cromática causada pela introdução indevida de cores do Tailwind Blue (`#3b82f6`, `#2563eb`, `#1d4ed8`) e resolvendo problemas críticos de contraste no Modo Escuro (`.dark`).

Os objetivos fundamentais desta intervenção são:
1. **Restauração da Rampa Primária Institucional (Max Teal)**: Substituir todos os fallbacks de chamadas `var()` que apontam para a paleta azul genérica do Tailwind pelas referências canônicas da rampa Teal Max (`--max-primary-500: #00768E`, `--max-primary-600: #005F77`, `--max-primary-700: #004860`).
2. **Correção de Assimetria no Arquivo de Temas (`src/themes/colors.scss`)**: Injetar no bloco `:root.dark, .dark` os tokens semânticos omitidos (`--surface-border`, `--text-b`, `--text-c`, `--text-d`, `--text-color`, `--primary-a`, `--primary-c`, `--primary-mouse`, `--icon-mouse`, `--alerta-b`, `--alerta-c`), garantindo que overlays, modais e bordas no modo escuro utilizem valores contrastantes adequados (`var(--background-300)` e inversão de escalas de texto).
3. **Erradicação de Cores Hexadecimais Hardcoded Ignorando `.dark`**: Substituir literais fixos como `color: #fff;` e `background-color: white;` em `MaxToast.vue`, `MaxBottomMenu.vue`, `MaxDoneIcon.vue`, `MaxErrorIcon.vue`, `MaxImage.vue` e `MaxLoaderAi.vue` por tokens dinâmicos do Design System (`var(--background-0)`, `var(--background-775)`, `var(--surface-border)`).
4. **Normalização de Variáveis Fantasmas**: Renomear tokens inventados fora do padrão do Design System (como `--primary-c`, `--primary-mouse`, `--primary-500` sem o prefixo `--max-`) para as variáveis oficiais padronizadas em `src/styles/style.ts` e `GEMINI.md`.

---

## 2. Arquivos Afetados

| Caminho Relativo | Caminho Absoluto | Categoria do Problema |
|---|---|---|
| `src/themes/colors.scss` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/themes/colors.scss` | Omissão de `--surface-border` e aliases semânticos no bloco `.dark` |
| `src/components/MaxInputCode.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCode.vue` | Fallbacks Tailwind Blue (`#3b82f6`) em ícone e bordas de foco |
| `src/components/MaxInputCodeToolbar.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCodeToolbar.vue` | Fallbacks Tailwind Blue (`#3b82f6`) em bordas e botões |
| `src/components/MaxInputFileUpload.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue` | Tokens inexistentes (`--primary-c`, `--primary-mouse`) com fallbacks `#3b82f6` e `#2563eb` |
| `src/components/MaxInputIconPicker.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue` | Fallback de tom 600 com Tailwind Blue (`#2563eb`) |
| `src/components/MaxInputMarkdown.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputMarkdown.vue` | Mais de 20 fallbacks azuis em blockquotes, seleções e links |
| `src/components/MaxInputMarkdownToolbar.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputMarkdownToolbar.vue` | Fallbacks Tailwind Blue (`#3b82f6`, `#2563eb`) em botões de ação |
| `src/components/MaxInputSelect.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue` | Fallback `--primary-500, #3b82f6` e `--blue-600, #2563eb` |
| `src/components/MaxInputDatePicker.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputDatePicker.vue` | Foco e outline com `var(--blue-600, #2563eb)` |
| `src/components/MaxBottomMenu.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxBottomMenu.vue` | Botão FAB e abas ativas com azuis Tailwind e `#fff` hardcoded |
| `src/components/MaxDoneIcon.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxDoneIcon.vue` | Círculo interno com `background-color: white;` hardcoded |
| `src/components/MaxErrorIcon.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxErrorIcon.vue` | Círculo interno com `background-color: white;` hardcoded |
| `src/components/MaxImage.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxImage.vue` | Crop overlay e handles com bordas e fundos em `#fff` fixo |
| `src/components/MaxLoaderAi.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxLoaderAi.vue` | `color: white !important;` na área de ícone |
| `src/components/MaxToast.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxToast.vue` | Card de toast com `color: #fff;` fixo |

---

## 3. Passo a Passo Detalhado da Implementação

### Fase 1: Blindagem de Tokens no Tema Central (`src/themes/colors.scss`)

No arquivo `src/themes/colors.scss`, no seletor `:root.dark, .dark` (ao final do arquivo, após a linha 2030), incluir a declaração completa das variáveis de suporte a bordas, texto e superfícies escuras:

```scss
:root.dark,
.dark {
    // ... tokens de rampa escura existentes ...

    // Aliases semânticos espelhados para Modo Escuro:
    --surface-border: var(--background-300);
    --text-b: var(--background-775);
    --text-c: var(--background-775);
    --text-d: var(--background-750);
    --text-color: var(--background-700);
    --primary-a: var(--max-primary-600);
    --primary-c: var(--max-primary-500);
    --primary-mouse: var(--max-primary-600);
    --icon-mouse: var(--max-primary-600);
    --alerta-b: var(--warn-600);
    --alerta-c: var(--warn-500);
}
```

*Por que `--surface-border: var(--background-300)` em dark mode?*
No modo claro, `--surface-border` aponta para `--background-200` (`#DDE4EB`). No modo escuro, `--background-200` inverte para um cinza intermediário escuro (`#74869A`), enquanto `--background-300` (`#62768C`) proporciona um contraste de borda nítido de ~3:1 contra o fundo de overlay (`--background-0` em dark mode é `#17293D`), eliminando o contorno esbranquiçado espúrio.

### Fase 2: Substituição da Tabela de Fallbacks Azuis por Max Teal Institucional

Em todos os componentes que utilizam fallbacks em `var()`, aplicar a normalização baseada na rampa oficial de `GEMINI.md`:
- `--max-primary-400`: `#178DA5`
- `--max-primary-500`: `#00768E` (cor primária canônica)
- `--max-primary-600`: `#005F77` (hover primário e ênfase)
- `--max-primary-700`: `#004860`

1. **`MaxInputCode.vue`**:
   - Linha 41:
     - **Antes**: `<MaxIcon icon="eos-icons:loading" :size="1.8" color="var(--max-primary-500, #3b82f6)" />`
     - **Depois**: `<MaxIcon icon="eos-icons:loading" :size="1.8" color="var(--max-primary-500, #00768E)" />`
   - Linhas 399 e 407:
     - **Antes**: `border-color: var(--max-primary-500, #3b82f6);`
     - **Depois**: `border-color: var(--max-primary-500, #00768E);`
2. **`MaxInputCodeToolbar.vue`**:
   - Linha 297:
     - **Antes**: `border-color: var(--max-primary-500, #3b82f6);`
     - **Depois**: `border-color: var(--max-primary-500, #00768E);`
   - Linha 328:
     - **Antes**: `color: var(--max-primary-500, #3b82f6);`
     - **Depois**: `color: var(--max-primary-500, #00768E);`
3. **`MaxInputFileUpload.vue`**:
   - Linha 367:
     - **Antes**: `border-top-color: var(--primary-500, #3b82f6);`
     - **Depois**: `border-top-color: var(--max-primary-500, #00768E);`
   - Linhas 390 e 402:
     - **Antes**:
       ```scss
       background-color: var(--primary-c, #3b82f6) !important;
       background-color: var(--primary-mouse, #2563eb) !important;
       ```
     - **Depois**:
       ```scss
       background-color: var(--max-primary-500, #00768E) !important;
       background-color: var(--max-primary-600, #005F77) !important;
       ```
4. **`MaxInputIconPicker.vue`**:
   - Linha 502:
     - **Antes**: `color: var(--max-primary-600, #2563eb);`
     - **Depois**: `color: var(--max-primary-600, #005F77);`
5. **`MaxInputMarkdown.vue` e `MaxInputMarkdownToolbar.vue`**:
   - Linhas de citações (blockquotes), destaques e barras de ferramentas:
     - Substituir todas as ocorrências de `#3b82f6` por `#00768E`.
     - Substituir todas as ocorrências de `#2563eb` por `#005F77`.
     - Substituir todas as ocorrências de `#1d4ed8` por `#004860`.
6. **`MaxInputDatePicker.vue`**:
   - Linhas 878, 900, 941, 993, 1024, 1031:
     - Substituir `var(--blue-600, #2563eb)` por `var(--max-primary-500, #00768E)`.
7. **`MaxInputSelect.vue`**:
   - Linha 784: substituir `var(--primary-500, #3b82f6)` por `var(--max-primary-500, #00768E)`.
   - Linha 856: substituir `var(--blue-600, #2563eb)` por `var(--max-primary-600, #005F77)`.
8. **Remoção de Fallbacks Desnecessários de `--surface-border`**:
   - Nos 28 arquivos que usam `var(--surface-border, #e2e8f0)`, remover o fallback `#e2e8f0` deixando apenas `var(--surface-border)`. Como a variável agora existe canonicamente tanto no `:root` quanto em `:root.dark, .dark`, a omissão do fallback força o navegador a respeitar a cor de borda correta do tema ativo.

### Fase 3: Adaptação de Componentes com Cores Hardcoded para Suporte ao Modo Escuro

1. **`MaxDoneIcon.vue` e `MaxErrorIcon.vue`**:
   - **Antes**:
     ```scss
     &::before {
         position: absolute;
         content: '';
         width: 15px;
         height: 15px;
         background-color: white;
         border-radius: 50%;
     }
     ```
   - **Depois**:
     ```scss
     &::before {
         position: absolute;
         content: '';
         width: 15px;
         height: 15px;
         background-color: var(--background-0);
         border-radius: 50%;
     }
     ```
   - *Resultado*: No tema claro, o fundo atrás do ícone vazado é `#ffffff`; no tema escuro, assume a cor do background do tema (`#17293D`), mantendo perfeita harmonia sem gerar um disco branco fluorescente.

2. **`MaxBottomMenu.vue`**:
   - Ajustar o fundo da barra inferior e cores ativas:
     ```scss
     .bottom-menu-bar {
         background-color: var(--background-0);
         border-top: 1px solid var(--surface-border);
     }

     .bottom-menu-tab {
         color: var(--background-650);

         &.active {
             color: var(--max-primary-500);
         }

         &:focus-visible {
             outline: 2px solid var(--max-primary-500);
         }
     }

     .fab {
         background: var(--max-primary-500);
         color: var(--background-0);

         &:hover {
             background: var(--max-primary-600);
         }

         &:focus-visible {
             outline: 2px solid var(--max-primary-400);
         }
     }
     ```

3. **`MaxToast.vue`**:
   - Cards com severidade continuam utilizando suas cores semânticas vibrantes (`var(--max-success-600)`, `var(--max-danger-600)`), mas o texto base e botões de ação passam a usar variáveis do Design System:
     ```scss
     .max-toast-item {
         color: #ffffff; // Mantém branco puro sobre backgrounds saturados de alerta/erro
         border: 1px solid rgb(255 255 255 / 15%);

         &.severity-info {
             background: var(--max-info-600);
         }
     }
     ```
   - Adicionar variante para toast neutro (sem severidade de perigo):
     ```scss
     &:not([class*='severity-']) {
         background: var(--background-0);
         color: var(--background-775);
         border: 1px solid var(--surface-border);
     }
     ```

4. **`MaxImage.vue`**:
   - Ajustar crop overlay e handles para respeitarem o tema:
     ```scss
     .max-image-crop-box {
         border: 2px solid var(--max-primary-500);
         box-shadow: 0 0 0 9999px rgb(0 0 0 / 60%), 0 0 8px rgb(0 0 0 / 50%);

         .max-image-crop-handle {
             background-color: var(--background-0);
             border: 1px solid var(--background-800);
         }
     }
     ```

5. **`MaxLoaderAi.vue`**:
   - Substituir `color: white !important;` por `color: var(--max-primary-500);` ou `color: var(--background-775);`.

---

## 4. Regras de Estilo do GEMINI.md a Cumprir

- **Consumo Exclusivo de Cores via Tokens CSS**: Todas as cores devem vir de `var(--max-primary-*)`, `var(--background-*)`, `var(--max-success-*)`, `var(--max-danger-*)` ou `var(--surface-border)`.
- **Proibição Absoluta de Fallbacks com Azuis do Tailwind**: Qualquer referência a `#3b82f6`, `#2563eb`, `#1d4ed8` deve ser completamente expurgada do projeto.
- **Inversão Coerente no Modo Escuro**: Garantir que nenhum elemento possua fundo branco fixo ou borda clara sobre superfícies escuras.

---

## 5. Critérios de Aceite e Verificação Técnica

1. **Varredura de Fallbacks Azuis**:
   ```bash
   rg -i '#3b82f6|#2563eb|#1d4ed8' src/components
   ```
   *Critério*: Deve retornar **0 resultados** em todo o diretório `src/components/`.
2. **Conferência de Tokens em `src/themes/colors.scss`**:
   ```bash
   rg --line-number '--surface-border' src/themes/colors.scss
   ```
   *Critério*: Deve exibir correspondência tanto na seção `:root` (linha ~1032) quanto na seção `:root.dark, .dark`.
3. **Checagem de Tipagem e Linters**:
   ```bash
   npm run type-check
   npm run lint
   ```
   *Critério*: Código 0 sem erros.
4. **Testes de Regressão Automatizados**:
   ```bash
   npm run test
   ```
   *Critério*: Todos os 176 arquivos de teste passando.
5. **Auditoria Visual no Modo Escuro (`.dark`)**:
   - Executar `npm run dev:playground` e alternar para modo escuro.
   - Conferir visualmente `MaxBottomMenu`, `MaxDoneIcon`, `MaxErrorIcon`, `MaxInputCode` e `MaxToast`, confirmando contraste adequado (mínimo 4.5:1 para texto e 3:1 para controles de interface).

---

## 6. Mitigação de Riscos de Regressão

| Risco Potencial | Probabilidade | Severidade | Estratégia de Mitigação |
|---|:---:|:---:|---|
| Perda de legibilidade em Toasts coloridos se texto mudar para cor escura em tema escuro | Baixa | Alta | Manter texto claro (`#ffffff` ou `var(--background-0)` em modo claro) sobre backgrounds saturados de alerta (`--max-danger-600`, `--max-success-600`). |
| Quebra de testes visuais ou de snapshot de cores | Média | Baixa | Rodar `npm run test` para identificar se algum teste unitário verificava valores hexadecimais exatos de estilo computado. |
| Inconsistência de handles de crop de imagem em imagens pretas | Baixa | Média | Utilizar borda escura sobre o handle (`border: 1px solid var(--background-800)`) com preenchimento claro para garantir visibilidade sobre qualquer foto. |
