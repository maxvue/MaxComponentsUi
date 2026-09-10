# Impossibilidade de Remover Arquivos e Ausência de Metadados no Upload (`MaxInputFileUpload`)

## Contexto e Componentes Afetados
- **Componentes:** `MaxInputFileUpload.vue`, `MaxInputFileUploadBig.vue`, `MaxInputFileUploadButton.vue`.
- **Categoria:** Inputs e formulários / Prevenção de perda de dados e feedback.
- **Severidade:** Média-Alta.
- **Heurística Violada:** Nielsen #3 (Controle e Liberdade do Usuário), Nielsen #1 (Visibilidade do Status do Sistema) e Nielsen #6 (Reconhecimento em vez de Memorização).

---

## Descrição do Problema

O componente de envio de documentos e mídias [`MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue) apresenta limitações severas no gerenciamento da lista de arquivos:

1. **Impossibilidade de Remover Arquivos Selecionados:**
   Na lista de arquivos exibida em [`MaxInputFileUpload.vue:77-86`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L77-L86):
   ```html
   <div class="files-icons" v-if="modelValue.length > 0">
       <div v-for="(file, index) in modelValue" :key="file.id || index" class="file-icon" @click="$emit('file-click', file)">
           <Icon icon="ph:file-pdf-light" v-if="getFileExtension(file?.file_name || '') === 'pdf'" size="1.8" />
           <Icon icon="ph:file-jpg-light" v-if="['jpg', 'jpeg'].includes(getFileExtension(file?.file_name || ''))" size="1.8" />
           <Icon icon="ph:file-png-light" v-if="getFileExtension(file?.file_name || '') === 'png'" size="1.8" />
           <Icon icon="fa:check-circle" class="file-check" size="0.7" />
           <img :src="file?.thumbnail ? `/media/thumbnails/${file.thumbnail}` : file?.src" alt="Image" v-show="!file.file_name" />
       </div>
   </div>
   ```
   **Não existe botão de exclusão ou remoção ("X" / lixeira) em nenhum arquivo da lista.** Se o usuário anexar acidentalmente um arquivo errado ou duplicado, ele não tem como excluí-lo da seleção antes de salvar o formulário.

2. **Ausência Completa de Nomes e Tamanhos dos Arquivos:**
   Cada item renderiza unicamente um ícone de 1.8rem com um pequeno selo de check verde. **O nome original do arquivo (ex.: `contrato_assinado.pdf`), a extensão e o tamanho em KB/MB não são exibidos em lugar nenhum**. Se o usuário anexar 4 PDFs diferentes, todos os 4 aparecem como ícones idênticos, tornando impossível saber qual é qual sem clicar em cada um para download/visualização externa.

3. **Ícones Invisíveis para Outras Extensões Suportadas:**
   O atributo `accept` padrão inclui `.doc, .docx` (linha 9), além de outros formatos aceitos em projetos corporativos (`.xlsx`, `.csv`, `.zip`). No entanto, as condições `v-if` tratam apenas `pdf`, `jpg`, `jpeg` e `png`. Qualquer documento de texto, planilha ou arquivo compactado fica sem ícone visível.

---

## Evidência no Código

1. [`MaxInputFileUpload.vue:77-86`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L77-L86): O evento do item é apenas `@click="$emit('file-click', file)"`, sem botão de exclusão e sem texto de nome de arquivo.
2. Inexistência de um evento emitido como `@remove-file` ou `@delete`.
3. Ausência de barra de progresso percentual individual para arquivos grandes.

---

## Impacto na Experiência do Usuário (UX)

1. **Risco de Envio de Dados Errados ou Confidenciais:** O usuário não consegue conferir pelo nome se anexou o documento correto ou um arquivo pessoal por engano antes do envio.
2. **Sensação de Falta de Controle:** Não conseguir remover um anexo incorreto força o usuário a cancelar todo o formulário ou recarregar a página para começar do zero.
3. **Incerteza sobre o Sucesso do Upload:** Sem tamanho do arquivo e sem barra de progresso individual, uploads lentos parecem congelados.

---

## Recomendações de Solução

1. **Ação de Remoção Individual:**
   - Adicionar em cada card/ícone um botão de fechar/excluir (`mdi:close` ou `iconoir:trash`), permitindo remover o item da lista `modelValue` com confirmação ou de forma instantânea.
2. **Exibição de Metadados (Nome e Tamanho):**
   - Exibir o nome do arquivo truncado com reticências no centro (`documento_..._2026.pdf`) e o tamanho formatado (ex.: `1.4 MB`).
3. **Ícone Genérico de Fallback:**
   - Para extensões não cobertas, exibir um ícone padrão como `ph:file-text` ou `ph:file-generic` em vez de deixar o elemento em branco.
