# Dependências declaradas e nunca importadas (`quill`, `color`, `@unocss/reset`, `@iconify/vue`)

- **Categoria:** build
- **Severidade:** média
- **Arquivo(s):** `package.json:46`, `package.json:61`, `package.json:64`, `package.json:70`
- **Domínio:** build-config

## Problema

Quatro entradas de `dependencies` não têm nenhum import correspondente em `src/`. Busca por
`from '<pkg>'` / `import('<pkg>')` em todo o `src/`:

| Pacote | Linha | Ocorrências em `src/` | Observação |
|--------|-------|----------------------|------------|
| `quill` | `package.json:70` | 0 | A única ocorrência da string "quill" em `src/` é `MaxInputFileUpload.vue:50`, no **nome de um ícone Iconify** (`icon="quill:folder-open"`) — o conjunto de ícones "Quill", sem relação com o editor Quill. O editor de rich text da lib é o TipTap. Falso positivo textual. |
| `color` | `package.json:64` | 0 | Ocorrências da palavra "color" em `src/` são todas propriedades CSS ou a shortcut `color-*` do preset UnoCSS. O pacote npm `color` (manipulação de cores) nunca é importado. |
| `@unocss/reset` | `package.json:61` | 0 | Importado apenas em `playground/package.json`, que tem seu próprio `package.json`/lockfile. Não é usado pela lib. |
| `@iconify/vue` | `package.json:46` | 0 | Não importado em `src/`. Aparece só em `playground/package.json`. Além disso, `vite.config.ts:41` já o lista **explicitamente** como external, o que sugere que era usado no passado e a limpeza não foi feita. Os ícones hoje passam pelo `useIconStore`, que faz fetch do SVG da API do Iconify. |

Foram verificados também os pacotes que *pareciam* órfãos mas **estão em uso** via import
dinâmico — estes devem ser mantidos e não fazem parte deste achado:

- `chart.js` — usado por `src/components/MaxChart.vue`, carregado via
  `defineAsyncComponent` em `src/index.ts:144`.
- `@lottiefiles/dotlottie-vue` — `src/components/MaxInputFileUploadBig.vue:39`, import dinâmico.
- `vue-pdf-embed` — `src/components/MaxPdfView.vue:47`, import dinâmico.

## Impacto

- Consumidores instalam quatro pacotes inúteis. `quill` sozinho traz ~1 MB, e `@iconify/vue`
  arrasta o runtime de ícones do Iconify — tudo isso baixado e resolvido sem nunca ser
  carregado.
- Superfície de auditoria de segurança inflada: cada dependência é um item a acompanhar em
  `npm audit` e nos alertas do Dependabot, sem contrapartida.
- Confusão de manutenção: um leitor do `package.json` conclui que a lib usa Quill como
  editor, quando o editor real é o TipTap.

## Plano de correção

1. Remover as quatro entradas de `dependencies`.
2. Remover `'@iconify/vue'` da lista de externals explícitos em `vite.config.ts:41` — como
   nada o importa, a entrada vira código morto. (Manter os externals `node:*` e
   `@oxc-parser/binding-wasm32-wasi`, que têm outra função.)
3. Rodar `npm install` para atualizar o `package-lock.json`.
4. Antes de remover, confirmar o caso do `quill` executando a busca por import real, e não
   por substring — a ocorrência do nome do icon set é o único hit e não conta:
   `grep -rnE "(from|import\() *'quill" src/` deve retornar vazio.
5. Aproveitar para verificar o `playground/`: ele já declara `@unocss/reset` e `@iconify/vue`
   no próprio `playground/package.json`, então nada quebra ali com a remoção na raiz.

## Verificação

- `npm run build` conclui sem erro de módulo não resolvido.
- `npm run test` passa integralmente.
- `npm run dev:playground` sobe e renderiza ícones (`MaxIcon`), gráficos (`MaxChart`), PDF
  (`MaxPdfView`) e o upload com animação Lottie — cobrindo tanto os removidos quanto os
  dinâmicos que devem continuar funcionando.
- `npm ls quill color @unocss/reset @iconify/vue` na raiz não lista mais nenhum deles como
  dependência direta.
