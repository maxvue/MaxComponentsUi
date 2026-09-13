# Política e Inventário de Dependências

Este documento é a fonte de verdade para as dependências do `@maxvue/max-components-ui`, registrando a classificação, justificativa de contrato e processo de verificação.

## Diretrizes de Classificação

1. **`dependencies` (Runtime Direto):**
   Apenas pacotes importados diretamente no código fonte distribuído em `src/` que são empacotados ou resolvidos pelo consumidor da biblioteca.

2. **`peerDependencies` (Ambiente / Host):**
   Pacotes que a aplicação hospedeira deve fornecer (ex.: `vue`, `pinia`, `vue-router`).

3. **`peerDependenciesMeta` com `optional: true`:**
   Integrações opcionais consumidas pelo host onde a biblioteca fornece comportamento enriquecido se disponível, mas não quebra se ausente (ex.: `@maxvue/max-pinia`).

4. **`devDependencies` (Desenvolvimento e Toolchain):**
   Compiladores, bundlers, linters, runners de teste e tipos auxiliares necessários exclusivamente durante o build e desenvolvimento.

## Matriz de Dependências de Produção (`dependencies`)

| Pacote | Onde é importado | Justificativa / Papel |
|---|---|---|
| `@lottiefiles/dotlottie-vue` | `src/components/MaxLottie.vue` | Renderização de animações Lottie (.lottie) |
| `@maxvue/max-use` | Múltiplos componentes e stores | Helpers reativos, composables e utilitários centrais |
| `@monaco-editor/loader` | `src/components/MaxInputCode.vue` | Carregador dinâmico do editor Monaco |
| `@tanstack/vue-virtual` | `src/components/base/MaxBaseVirtualScroller.vue` | Virtualização de listas e scroller de alta performance |
| `@tiptap/core` | `src/components/MaxInputMarkdown.vue` | Núcleo do editor RichText / Markdown |
| `@tiptap/extension-image` | `src/components/MaxInputMarkdown.vue` | Suporte a imagens no editor |
| `@tiptap/extension-link` | `src/components/MaxInputMarkdown.vue` | Suporte a links no editor |
| `@tiptap/extension-table` | `src/components/MaxInputMarkdown.vue` | Suporte a tabelas no editor |
| `@tiptap/extension-table-cell` | `src/components/MaxInputMarkdown.vue` | Célula de tabela |
| `@tiptap/extension-table-header` | `src/components/MaxInputMarkdown.vue` | Cabeçalho de tabela |
| `@tiptap/extension-table-row` | `src/components/MaxInputMarkdown.vue` | Linha de tabela |
| `@tiptap/extension-underline` | `src/components/MaxInputMarkdown.vue` | Sublinhado de texto |
| `@tiptap/starter-kit` | `src/components/MaxInputMarkdown.vue` | Conjunto padrão de extensões Tiptap |
| `@tiptap/vue-3` | `src/components/MaxInputMarkdown.vue` | Integração oficial Vue 3 do Tiptap |
| `axios` | `src/components/MaxInputFileProject.vue`, etc. | Requisições HTTP em componentes com upload |
| `chart.js` | `src/components/MaxChart.vue` | Renderização de gráficos |
| `dompurify` | `src/components/MaxInputMarkdown.vue` | Sanitização de HTML |
| `libphonenumber-js` | `src/components/MaxInputPhone.vue` | Formatação e validação internacional de telefones |
| `maska` | Diretiva `v-maska` em múltiplos inputs | Máscaras de entrada (CPF, CNPJ, Telefone, CEP) |
| `sass` | Compilação de temas e estilos SCSS | Pré-processador SCSS |
| `tiptap-markdown` | `src/components/MaxInputMarkdown.vue` | Serialização/deserialização Markdown |
| `vue-pdf-embed` | `src/components/MaxPdfView.vue` | Renderizador embutido de documentos PDF |
| `vue3-google-map` | `src/components/MaxMaps.vue` | Renderização de mapas interativos |

## Pacotes Removidos ou Reclassificados

- **`quill`:** Removido. A biblioteca migrou para Tiptap; ocorrências remanescentes como `quill:folder-open` eram apenas nomes de ícones Iconify.
- **`oxc-parser`:** Removido da raiz. Não é importado pelo runtime; UnoCSS resolve internamente sua própria cópia no toolchain.
- **`@tiptap/pm`:** Removido da declaração direta. É resolvido transitivamente pelas extensões `@tiptap/*`.
- **`@vue/compiler-*` e `@vue/runtime-*`:** Removidos de `dependencies`. Compiladores pertencem ao toolchain (`@vitejs/plugin-vue`) e runtime é provido por `vue` (`peerDependencies`).
- **`@maxvue/max-pinia`:** Movido para `peerDependencies` opcional (`peerDependenciesMeta.optional = true`). A biblioteca é independente do plugin e funciona perfeitamente sem ele.
- **`unocss`:** Declarado como `peerDependencies` opcional (`peerDependenciesMeta.optional = true`). Necessário somente para consumidores do entrypoint `./preset` (`presetMaxUno()`).

## Testes e Prevenção de Deriva

O teste arquitetural `tests/architecture/runtimeDependencies.test.ts` analisa o código-fonte em `src/` e garante que:
1. Toda dependência em `dependencies` possui import comprovado ou exceção documentada neste arquivo.
2. Nenhum import direto em `src/` seja órfão de declaração.
