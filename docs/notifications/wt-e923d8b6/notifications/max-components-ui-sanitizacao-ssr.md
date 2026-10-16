# Sanitização HTML: fallback SSR sem política equivalente

- Data: 16/10/2026.
- Localização: `src/helpers/sanitizeHtml.ts:10–27`.
- Evidência estática: os caminhos DOMPurify aplicam lista de tags/atributos. O fallback das linhas 25–27 usa apenas substituições por regex para remover tags script e atributos de eventos. Não aplica a mesma lista de elementos, atributos ou protocolos de URL.
- Consumidor observado: `src/components/MaxEmptyDiv.vue:48` deriva o HTML inserido no label desse helper. Existem outros consumidores potenciais; não houve auditoria de alcance nesta tarefa.

**Impacto potencial:** sem DOMPurify operacional em SSR, HTML não confiável pode manter elementos/URLs que a política normal removeria. Há risco de conteúdo ativo ou de divergência de segurança entre renderização no servidor e cliente. Não foi realizado teste de exploração, SSR real ou confirmação de incidente. A gravidade operacional depende de o caminho fallback ser atingido com conteúdo não confiável.

**Encaminhamento fora do escopo:** revisar sanitização SSR de forma própria, com biblioteca adequada ao ambiente ou escape seguro de texto e testes adversariais. Não tratar regex como sanitizador completo. O MaxMarkdownViewer proposto não deve ampliar esse helper global nem depender do fallback; a spec prevê política própria e texto escapado quando não houver sanitização segura.

Nenhuma correção foi aplicada. Não há segredos ou dados reais neste registro.
