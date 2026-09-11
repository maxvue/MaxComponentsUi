# Plano de Implementação: Feedback de Progresso Real, Persistência de Erros e Reativação de Dropzones no Módulo de Upload

## 1. Objetivo da Refatoração

Fornecer feedback de progresso real em tempo real (`xhr.upload.onprogress`) para uploads de arquivos em vez de spinners estáticos; erradicar o "Error Ghosting" (eliminar os temporizadores de 3 segundos que apagam mensagens de erro e descartam os arquivos do usuário); preservar o estado de erro até intervenção ativa do usuário com opção de reenvio (*retry*); reativar a manipulação de arrastar e soltar (*drag and drop*) abandonada em `MaxInputFileProject.vue`; e substituir animações Lottie carregadas de CDN remoto por componentes SVG/CSS nativos, leves e offline do design system.

---

## 2. Arquivos Afetados

| Arquivo | Papel na Refatoração |
|---|---|
| [`src/components/MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue) | Implementação de `xhr.upload.onprogress`, barra de progresso visual, remoção do timer de 3s, persistência de erros com ação de retry. |
| [`src/components/MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadBig.vue) | Remoção de timer de 3s, substituição de DotLottie via CDN remoto por SVG nativo, tratamento persistente de erro. |
| [`src/components/MaxInputFileProject.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileProject.vue) | Reativação do manipulador `onDrop` conectado à pipeline de seleção e upload de documentos fotovoltaicos. |
| [`src/components/MaxInputFile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFile.vue) | Alinhamento de estados visuais e feedback acessível de arquivos adicionados. |
| [`tests/components/MaxInputFileUpload.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputFileUpload.test.ts) | Testes de emissão e renderização de progresso real de upload e persistência de erro sem exclusão automática de arquivos. |
| [`tests/components/MaxInputFileUploadBig.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputFileUploadBig.test.ts) | Testes de estado de loading e erro persistente sem dependência de Lottie CDN. |
| [`tests/components/MaxInputFileProject.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputFileProject.test.ts) | Testes de soltura de arquivos na dropzone (`onDrop`). |

---

## 3. Passo a Passo Detalhado da Implementação

### 3.1. `MaxInputFileUpload.vue`: Progresso Real e Eliminação de "Error Ghosting"

1. **Adicionar Rastreamento Reativo de Progresso**:
   - Declarar refs reativas:
     ```ts
     const uploadProgress = ref(0);
     const errorMessage = ref<string | null>(null);
     ```
2. **Conectar `xhr.upload.onprogress` na Requisição**:
   - No método `startUpload`:
     ```ts
     uploadProgress.value = 0;
     showError.value = false;
     errorMessage.value = null;

     xhr.upload.onprogress = (event: ProgressEvent) => {
         if (event.lengthComputable) {
             const percent = Math.round((event.loaded / event.total) * 100);
             uploadProgress.value = percent;
             emit('progress', { originalEvent: event, progress: percent, loaded: event.loaded, total: event.total });
         }
     };
     ```
3. **Eliminar o Temporizador de 3 Segundos**:
   - Deletar o watcher:
     ```ts
     // REMOVER:
     // watch(showError, (val) => {
     //     if (val) setTimeout(() => { showError.value = false; files.value = []; }, 3000);
     // });
     ```
   - Em vez disso, o estado de erro persiste até que o usuário:
     - Clique em "Tentar Novamente" (`retryUpload()`);
     - Clique em "Fechar/Descartar Erro" (`dismissError()`);
     - Selecione um novo lote de arquivos.
4. **Capturar e Exibir Detalhes Reais do Erro**:
   - No handler `onError`:
     ```ts
     const onError = (event: any) => {
         showError.value = true;
         uploading.value = false;
         uploadProgress.value = 0;

         let extractedMsg = 'Ocorreu um erro ao fazer o upload.';
         try {
             if (event?.xhr?.responseText) {
                 const parsed = JSON.parse(event.xhr.responseText);
                 extractedMsg = parsed.message || parsed.error || extractedMsg;
             } else if (event?.xhr?.status === 413) {
                 extractedMsg = 'Arquivo excede o tamanho máximo permitido pelo servidor.';
             }
         } catch {
             if (event?.xhr?.statusText) extractedMsg = `Erro ${event.xhr.status}: ${event.xhr.statusText}`;
         }

         errorMessage.value = extractedMsg;
         emit('upload-error', { ...event, message: extractedMsg });
         if (attrs.onError) attrs.onError(event);
     };
     ```
5. **Template de Progresso e Erro Semântico**:
   - Na seção de loading:
     ```html
     <div v-else-if="uploading || attrs.uploading" class="upload-loading-state">
         <div class="upload-progress-container">
             <div class="progress-bar-track">
                 <div
                     class="progress-bar-fill"
                     role="progressbar"
                     :aria-valuenow="uploadProgress"
                     aria-valuemin="0"
                     aria-valuemax="100"
                     :style="{ width: `${uploadProgress}%` }"
                 />
             </div>
             <span class="upload-progress-text">Enviando... {{ uploadProgress }}%</span>
         </div>
     </div>
     ```
   - Na seção de erro:
     ```html
     <div v-else-if="showError" class="upload-error-state" role="alert">
         <div class="upload-error-content">
             <MaxIcon icon="material-symbols:error-outline-rounded" :size="1.2" class="error-icon" />
             <span class="error-text">{{ errorMessage }}</span>
         </div>
         <div class="upload-error-actions">
             <MaxButton label="Tentar novamente" size="small" variant="outlined" @click.stop="startUpload(files)" />
             <MaxIconButton icon="material-symbols:close-rounded" size="1" @click.stop="dismissError" aria-label="Descartar erro" />
         </div>
     </div>
     ```

### 3.2. `MaxInputFileProject.vue`: Reativação da Dropzone de Documentos

1. **Implementar o Handler `onDrop`**:
   - Substituir a função comentada vazia:
     ```ts
     function onDrop(files: File[] | null) {
         if (props.disabled || !files || files.length === 0) return;

         // Adiciona à fila de arquivos temporários do projeto
         temp_files.value = [...temp_files.value, ...files];
         emit('files-selected', files);

         // Se modo automático estiver habilitado, dispara o envio imediatamente
         if (props.auto && count_to_upload.value > 0) {
             sendFile(files_to_upload.value);
         }
     }
     ```
2. **Affordance Visual Reforçada no Arrastar**:
   - Garantir que a classe `.is-over-drop` ative o feedback visual com borda primária pontilhada `--max-primary-500` e fundo suave `--max-primary-50`.

### 3.3. `MaxInputFileUploadBig.vue`: Desacoplamento de CDN Externo

1. **Substituir Animações Lottie Externas**:
   - Remover as tags `<DotLottieVue ... src="https://lottie.host/..." background="red" />`.
   - Adotar SVGs animados nativos incorporados ou combinados com `MaxIcon`:
     ```html
     <!-- Estado de upload em progresso -->
     <div v-else-if="uploading" class="upload-state">
         <slot name="uploading">
             <div class="screen-animation">
                 <MaxIcon icon="eos-icons:bubble-loading" size="4" class="upload-spinner" />
                 <div class="screen-animation-label">Enviando arquivos...</div>
             </div>
         </slot>
     </div>

     <!-- Estado de erro persistente -->
     <div v-else-if="showError" class="upload-state">
         <slot name="error">
             <div class="screen-animation">
                 <MaxIcon icon="solar:danger-triangle-bold" size="3.5" class="error-icon" />
                 <div class="screen-animation-label">Erro ao enviar o arquivo.</div>
                 <MaxButton label="Tentar Novamente" class="mt-3" @click.stop="retry" />
             </div>
         </slot>
     </div>
     ```
2. **Remover o Timer de 3 Segundos**:
   - Eliminar `watch(showError, ... setTimeout(..., 3000))`. Manter o estado até nova interação do usuário.

---

## 4. Regras de Usabilidade e Padrões do GEMINI.md

1. **Autonomia e Independência de Rede Externa**:
   - Nenhuma dependência de CDNs externos (Lottie Host, URLs não empacotadas). Todos os assets de feedback visual são SVGs e CSS nativos distribuídos no bundle.
2. **Acessibilidade e Transparência de Estado**:
   - Barras de progresso utilizam `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`.
   - Mensagens de falha utilizam `role="alert"` com contraste em conformidade com as diretrizes WCAG AA.
3. **Estilização SCSS Scoped e Variáveis de Superfície**:
   - Barras de progresso utilizam `--max-primary-500` no preenchimento e `--background-200` no trilho.
   - Textos secundários em `--background-650` e títulos em `--background-775`.

---

## 5. Critérios de Aceite e Testes Vitest Necessários

### Critérios de Aceite
- [ ] Durante upload via `MaxInputFileUpload`, o componente exibe a porcentagem exata transmitida em tempo real de 0% a 100% calculada a partir de `xhr.upload.onprogress`.
- [ ] Quando o servidor retorna erro (ex: 413 ou 500), a mensagem de falha permanece visível na tela sem desaparecer após 3 segundos.
- [ ] A lista de arquivos selecionados não é deletada após uma falha de envio, permitindo ao usuário acionar "Tentar Novamente".
- [ ] Arrastar e soltar arquivos na área de `MaxInputFileProject` anexa os arquivos a `temp_files` e emite o evento `files-selected`.
- [ ] O componente `MaxInputFileUploadBig` exibe o estado de loading e erro usando ícones SVG do sistema sem realizar requisições HTTP para domínios de CDN externos.

### Bateria de Testes Vitest a Implementar / Atualizar
1. `tests/components/MaxInputFileUpload.test.ts`:
   - `test('calcula e emite progresso de upload com base no evento xhr onprogress')`
   - `test('mantem erro visivel e preserva lista de arquivos sem sumir apos 3 segundos')`
   - `test('permite tentar novamente atraves da funcao de retry')`
2. `tests/components/MaxInputFileProject.test.ts`:
   - `test('processa arquivos soltos na dropzone via onDrop e emite files-selected')`
3. `tests/components/MaxInputFileUploadBig.test.ts`:
   - `test('renderiza estado de erro sem dependencia de servico lottie externo')`
   - `test('mantem estado de erro ate acao de recuperacao do usuario')`

---

## 6. Mitigação de Riscos de Regressão

- **Risco de Incompatibilidade de Servidores sem Suporte a `Content-Length`**:
  - *Mitigação*: Se `event.lengthComputable` for falso, a barra de progresso exibe animação indeterminada suave (*striped indeterminate progress*), informando "Enviando arquivos..." sem travar em 0%.
- **Risco de Quebra em Testes que Usavam Mocks Rápidos de XHR**:
  - *Mitigação*: Ajustar fixtures de teste para disparar `xhr.upload.dispatchEvent(new ProgressEvent('progress', ...))` garantindo cobertura total do fluxo assíncrono.
