# MaxInputMarkdown — Design Spec

**Data:** 2026-06-25
**Autor:** Johnattas Santana

---

## Visão Geral

Componente de entrada de texto rico com suporte a Markdown para a biblioteca `@maxvue/max-components-ui`. O usuário edita em modo WYSIWYG (texto formatado visualmente em tempo real) com toolbar completa. O `v-model` retorna e recebe Markdown cru (string).

---

## Arquitetura

### Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/components/MaxInputMarkdown.vue` | Componente principal — integra InputBase, Tiptap editor e toolbar |
| `src/components/MaxInputMarkdownToolbar.vue` | Toolbar isolada com todos os botões de formatação |

### Fluxo de Dados

```
v-model (string markdown)
    ↓ deserialize via tiptap-markdown
  Tiptap Editor (ProseMirror DOM — renderização WYSIWYG)
    ↑ serialize via tiptap-markdown
emit('update:modelValue', string markdown)
```

### Integração com InputBase

- Usa `InputBase` com prop `inLine` para label fixo acima do editor (FloatLabel não detecta foco em elementos não-nativos).
- Todas as props padrão do InputBase são repassadas via `v-bind`: `label`, `icon`, `done`, `error`, `caution`, `required`, `message`, `disabled`.

---

## Dependências

| Pacote | Versão | Função |
|--------|--------|--------|
| `@tiptap/vue-3` | latest | Core Vue 3 |
| `@tiptap/starter-kit` | latest | Bold, Italic, Strike, Headings, Lists, Code, Blockquote, History, HorizontalRule |
| `@tiptap/extension-underline` | latest | Sublinhado |
| `@tiptap/extension-link` | latest | Links com popover inline para URL |
| `@tiptap/extension-image` | latest | Imagens via URL |
| `@tiptap/extension-table` | latest | Tabelas |
| `@tiptap/extension-table-row` | latest | Linhas de tabela |
| `@tiptap/extension-table-header` | latest | Cabeçalho de tabela |
| `@tiptap/extension-table-cell` | latest | Células de tabela |
| `tiptap-markdown` | latest | Serialização/desserialização Markdown ↔ ProseMirror |

---

## Props

```ts
interface MaxInputMarkdownProps {
    // Herdadas do padrão InputBase
    modelValue: string;
    label?: string;
    icon?: string;
    i?: string;
    disabled?: boolean;
    float?: boolean;
    msg?: string;
    message?: string;
    iconMessage?: string;
    done?: boolean;
    error?: string | boolean;
    caution?: string | boolean;
    required?: boolean;
    placeholder?: string;

    // Específicas do editor
    minHeight?: string;  // default: '200px'
    maxHeight?: string;  // default: '500px'
}
```

**Emits:** `update:modelValue` — string Markdown serializada a cada mudança no editor.

---

## Toolbar

Layout com grupos separados por divisor vertical (`|`):

```
| B  I  U  ~~  |  H1  H2  H3  |  •―  1―  |  "  </>  ―  |  🔗  🖼  |  ⊞  |  ↩  ↪  ✕ |
```

### Grupos

| Grupo | Ações |
|-------|-------|
| Formatação inline | Bold, Italic, Underline, Strike |
| Títulos | H1, H2, H3 |
| Listas | Bullet List, Ordered List |
| Blocos | Blockquote, Code Block, Horizontal Rule |
| Mídia | Link, Imagem |
| Tabela | Inserir tabela 3×3 |
| Histórico | Undo, Redo, Clear formatting |

### Comportamento dos Botões Especiais

- **Link:** Abre popover inline para digitar URL. Aplica link ao texto selecionado ou insere novo link.
- **Imagem:** Abre popover inline para URL da imagem. Sem suporte a upload direto — apenas URL.
- **Tabela:** Insere tabela 3×3 padrão; células navegáveis com Tab.
- **Active state:** Botão recebe classe `active` quando o formato está ativo no cursor, destacado com `var(--max-primary-500)`.

---

## Estilos

- Arquivo: `<style lang="scss">` com escopo no `.max-input-markdown`
- Toolbar com fundo `var(--background-50)`, borda inferior `var(--background-200)`
- Editor (`.ProseMirror`) estilizado:

| Elemento | Estilo |
|----------|--------|
| `h1` | `font-size: 1.8em`, `font-weight: 700` |
| `h2` | `font-size: 1.5em`, `font-weight: 600` |
| `h3` | `font-size: 1.25em`, `font-weight: 600` |
| `strong` | `font-weight: 700` |
| `em` | `font-style: italic` |
| `code` (inline) | fundo `var(--background-100)`, fonte monospace, padding leve |
| `pre` (code block) | fundo `var(--background-100)`, borda `var(--background-300)`, padding, scroll horizontal |
| `blockquote` | borda esquerda `4px var(--max-primary-400)`, padding-left, cor `var(--background-500)` |
| `a` | cor `var(--max-primary-500)`, underline |
| `table` | bordas colapsadas, `var(--background-200)` |
| `th` | fundo `var(--background-100)`, bold |
| `ul` / `ol` | padding-left, marcadores visíveis |
| `hr` | borda `var(--background-300)` |

- Altura configurável via props `minHeight`/`maxHeight` com `overflow-y: auto` interno.

---

## Testes

Arquivo: `tests/components/MaxInputMarkdown.test.ts`

| Caso | O que verifica |
|------|---------------|
| Renderização | Componente monta sem erros |
| v-model inicial | Conteúdo markdown inicial é desserializado e exibido |
| Emissão | Alteração no editor emite `update:modelValue` com markdown serializado |
| Props InputBase | Props `label`, `disabled`, `error`, `required` são repassadas ao InputBase |
| Toolbar | Toolbar renderiza todos os grupos de botões |
| Disabled | Editor não aceita input quando `disabled: true` |

---

## Registro no índice da biblioteca

Após criar o componente, executar:
```bash
npx tsx src/scripts/generateResolver.ts
```

Adicionar ao `src/index.ts`:
```ts
export { default as MaxInputMarkdown } from './components/MaxInputMarkdown.vue';
```
