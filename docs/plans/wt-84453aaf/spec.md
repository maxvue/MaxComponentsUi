# Especificação técnica — dez componentes reutilizáveis sem inputs

- Data: 16/10/2026.
- Projeto: `@maxvue/max-components-ui`, manifesto `1.1.14`.
- Worktree autorizada: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-84453aaf`.
- Branch informada pelo usuário: `wt-84453aaf`. Base observada: `e8bcbebcff14b1932a8394d0f60f76e6b1b25946`.
- Situação: proposta para revisão; esta sessão somente investigou e escreveu documentação. Implementação, testes executáveis e integração Git não foram realizados.

## 1. Contexto & Objetivo

Analisar os frontends de Engeapp, MaxAiManager, AgenteDeBolso e SocialMedia e propor **exatamente dez novos componentes, nenhum input**, para centralização nesta biblioteca e reutilização futura.

Há padrões concretos de cópia, detalhes, diagnósticos, anexos, mensagens, áudio e prévia editorial implementados nos consumidores. O objetivo não é copiar telas inteiras: é separar apresentação e pequenas interações locais das regras de negócio, rotas, autenticação e persistência.

O contexto herdado sobre quinze inputs não integra esta proposta. Inputs estão sob responsabilidade de outras sessões. Não há documentos preexistentes em `docs/plans/wt-84453aaf/` na admissão desta sessão.

### 1.1. Evidências e recorte da análise

Os caminhos abaixo são existentes e relativos a `/home/johnattas/GitHub/`, salvo quando indicada a biblioteca. As linhas são referências da leitura, sujeitas a mudança.

| Projeto | Evidência lida | Padrão observado |
|---|---|---|
| Engeapp | `engeapp/resources/Vue/Sections/Checkout/CheckoutPix.vue:1–29` | Ação de copiar com feedback próprio. |
| Engeapp | `engeapp/resources/Vue/Components/Voip/CallAudioPlayer.vue:1–134` | Reprodução, duração, velocidade e encerramento de áudio. |
| Engeapp | `engeapp/resources/Vue/Components/Chatbot/ChatbotMessageBubble.vue:1–39` | Autor, horário, alinhamento e conteúdo Markdown da mensagem. |
| Engeapp | `engeapp/resources/Vue/Sections/Dashboard/Sections/DataTable/TrelloList.vue:1–162` e `SectionTrelloDataTable.vue:1–150`, no mesmo diretório | Colunas, contagem, recolhimento, virtualização e regras específicas de arraste/mesclagem. |
| Engeapp | `engeapp/resources/Vue/Pages/SocialMediaPage.vue:1–55` | O painel social atual é incorporado por iframe/SSO; não presumir que as abas sociais locais do contexto antigo ainda existam. |
| MaxAiManager | `MaxAiManager/resources/Vue/Sections/Logs/ModalLogDetail.vue:18–220` | Repetição de campos de leitura, cópia e blocos de diagnóstico. |
| MaxAiManager | `MaxAiManager/resources/Vue/Sections/Dashboard/ModalReceivedRequestDetail.vue:18–205,296–310` | Grade de detalhes, diagnóstico e cópia via helper. |
| MaxAiManager | `MaxAiManager/resources/Vue/Components/Support/BugReportDetail.vue:18–95` | Metadados, JSON em `pre`, lista de anexos e histórico de mensagens. |
| MaxAiManager | `MaxAiManager/resources/Vue/Sections/Settings/Ai/AiBaseModelDetails.vue:20–55` | Outra grade de rótulo/valor somente leitura. |
| AgenteDeBolso | `AgenteDeBolso/resources/Vue/Sections/Transaction/DetailDatesSection.vue:1–139` | Rótulo/valor; cálculos financeiros e datas devem permanecer no app. |
| AgenteDeBolso | `AgenteDeBolso/resources/Vue/Sections/Transaction/AttachmentSection.vue:8–91,237–251` | Cota mensal, coleção de comprovantes e estados de sincronização; GET delegado a store MaxPinia. |
| AgenteDeBolso | `AgenteDeBolso/resources/Vue/Sections/Billing/LimitBanner.vue:21–143` | Limites, estado ilimitado e ação contextual de plano, atualmente ligados ao domínio. |
| AgenteDeBolso | `AgenteDeBolso/resources/Vue/Components/AsyncFeedback.vue:1–71` | Feedback genérico já coberto por `MaxAlert`; não criar duplicata. |
| SocialMedia | `SocialMedia/resources/Vue/Sections/SocialMedia/EventTabBriefing.vue:17–39` e `Components/SocialMediaEventModal.vue:879–905`, sob `resources/Vue/` | Indicadores de pendência/salvamento/sucesso separados da operação de salvar. |
| SocialMedia | `SocialMedia/resources/Vue/Components/InstagramSimulatePost.vue:1–64` | Autor, legenda, carrossel de imagens e índice controlado. |
| SocialMedia | `SocialMedia/resources/Vue/Sections/SocialMedia/EventTabPublication.vue:1–45` | A prévia já é composta com publicação, que deve continuar fora da biblioteca. |

É uma análise direcionada de código, não auditoria exaustiva dos quatro sistemas nem validação visual em produção. Não foram acessados arquivos de ambiente, conteúdo de chaves, dados de clientes ou serviços externos dos produtos.

## 2. Escopo

### 2.1. Dentro do escopo proposto para execução futura

| ID | Novo componente | Valor de centralização | Evidência principal | Reuso futuro possível, não comprovado como adoção |
|---|---|---|---|---|
| C01 | `MaxCopyButton` | Ação acessível de copiar, feedback e falhas uniformes. | Checkout Pix e detalhes de logs/requisições. | Identificadores, protocolos, textos e links nos quatro projetos. |
| C02 | `MaxCodeBlock` | Visualização leve de texto técnico, sem editor. | Diagnósticos e JSON do MaxAiManager. | Logs de integrações e respostas de IA. |
| C03 | `MaxDescriptionList` | Pares rótulo/valor responsivos e semânticos. | Grades do MaxAiManager e datas do AgenteDeBolso. | Dados de projetos, contratos e publicações. |
| C04 | `MaxSaveIndicator` | Estado visual compacto de salvamento, sem salvar nada. | Título e briefing do SocialMedia. | Formulários com auto-save via MaxPinia. |
| C05 | `MaxUsageMeter` | Consumo/limite, desconhecido, zero e ilimitado. | Cota de anexos e limites do AgenteDeBolso. | Créditos de IA, armazenamento e franquias. |
| C06 | `MaxAttachmentList` | Coleção de anexos já existentes, com identidade estável. | Comprovantes e anexos de relatos. | Documentos, suporte e entregáveis editoriais. |
| C07 | `MaxAudioPlayer` | Reprodução e eventos de mídia reutilizáveis. | Player de chamadas do Engeapp. | Mensagens de voz e áudio gerado por IA. |
| C08 | `MaxChatMessage` | Anatomia visual de uma mensagem, sem conversa/servidor. | Bolha do chatbot e histórico de relatos. | Assistentes, suporte e colaboração. |
| C09 | `MaxSocialPostPreview` | Prévia de postagem com legenda e imagens navegáveis. | `InstagramSimulatePost` do SocialMedia. | Revisão editorial e propostas de campanha. |
| C10 | `MaxKanbanBoard` | Exibição de colunas, cartões, contagens e recolhimento. | Quadro do Engeapp. | Pipelines e acompanhamento editorial/operacional. |

Os nomes são propostas novas: busca em `src/**/*.{ts,vue,json}` não encontrou esses dez símbolos. Não são APIs existentes. Aprovar este plano não comprova que os consumidores já os utilizam.

### 2.2. Fora do escopo

- Todo input, seletor, editor, upload, formulário composto ou expansão dos quinze inputs anteriores.
- Alterações nos quatro consumidores, seus `storage/libs`, lockfiles ou bibliotecas irmãs.
- GET/POST, autosave, novos endpoints, stores de domínio, migrações e mudanças de cache.
- Publicar postagens, enviar mensagens, gravar áudio, transcrever, OCR, baixar anexos automaticamente ou executar código exibido.
- Arrastar/reordenar/mover/mesclar cartões no Kanban nesta primeira versão. O quadro é de visualização e navegação; isso é deliberado para não extrair regras de negócio destrutivas.
- Realce de sintaxe com dependência nova, Monaco/Tiptap em visualizadores, vídeo/reels e reprodução de interfaces oficiais de várias redes.
- Instalação, execução de testes, builds, commits, merge, push ou publicação nesta sessão Plan.

### 2.3. O que deve continuar funcionando

Nenhum consumidor é migrado automaticamente. Os componentes e aliases existentes, classes `.p-*` consolidadas, catálogo de inputs e os contratos de `MaxProgressBar`, `MaxFilePreview`, `MaxMarkdownViewer`, `MaxCardList`, `MaxTable` e `MaxImage` permanecem inalterados. Migração de telas será outro pedido, com autorização própria.

## 3. Arquitetura & Mudanças Técnicas

### 3.1. Fronteira de responsabilidades

```text
Store MaxPinia do consumidor / dados já carregados
            → adaptação tipada no consumidor
            → props dos componentes MaxComponentsUi
            ← eventos de intenção e eventos locais de mídia/cópia
Store/ação do consumidor decide persistência, autorização e navegação
```

- Componentes novos são apresentacionais, com estado local apenas para interação visual, reprodução e cópia. Não precisam criar stores fictícias só para cumprir uma regra de arquitetura.
- Toda leitura de página, cache e salvamento futuro permanece em stores MaxPinia dos apps, nunca em Axios dentro destes componentes. `MaxSaveIndicator` recebe um estado normalizado; não depende do shape privado de uma store.
- Helpers vêm de `@maxvue/max-use` instalado via npm; não importar VueUse/Lodash diretamente. Construções da plataforma, como `Blob` e `ClipboardItem`, não são novos helpers de biblioteca.
- Compor componentes Max existentes. Usar Vue 3 Composition API, TypeScript estrito, slots/eventos tipados, tokens semânticos teal, Quicksand e SCSS scoped `.max-*`.
- Tags de abertura em uma linha, script com recuo base de quatro espaços. Não reintroduzir PrimeVue nem copiar o `Slider` do player de origem.

### 3.2. Contratos públicos propostos

Todos os contratos desta seção são decisões propostas para a execução, não interfaces já disponíveis. Listas recebem dados somente leitura; nenhuma prop é mutada. IDs são `string` estáveis, não índices. Props de conteúdo textual são renderizadas por interpolação, nunca `v-html` irrestrito.

#### C01 — MaxCopyButton

- Props: `text: string`; `label = 'Copiar'`; `copiedLabel = 'Copiado'`; `iconOnly = false`; `disabled = false`; `copiedDuration = 1500` milissegundos. Nome acessível permanece obrigatório mesmo no modo só ícone.
- Eventos: `copied: []`; `error: [{ reason: 'unsupported' | 'denied' | 'failed' }]`. Não emitir o conteúdo copiado, registrá-lo ou lê-lo do clipboard.
- Compor `MaxButton`/`MaxIconButton` e feedback local `role="status"`. Não abrir toast global por padrão.
- Usar **`useClipboardItems` reexportado por MaxUse**, `read: false`, com item `text/plain`; construir `ClipboardItem` apenas no clique e depois das checagens de capacidade/contexto seguro. Verificar `clipboard.write`, `ClipboardItem`, `Blob` e `isSupported`. Sucesso somente após escrita aguardada; permissão negada nunca vira sucesso. Sem fallback `execCommand`.
- Motivo: no VueUse instalado `14.4.0`, `useClipboard.copy` pode suprimir rejeição e marcar `copied`; `useClipboardItems.copy` aguarda `navigator.clipboard.write` e propaga rejeição. Evidência em `node_modules/@vueuse/core/dist/index.js:1682–1785`; MaxUse instalado `1.1.47` reexporta os helpers.
- Bloquear cliques concorrentes; invalidar feedback antigo quando `text` mudar. Texto vazio não dispara escrita. SSR não acessa globals de navegador. Sem suporte, informar como copiar manualmente; não forçar API legada.

#### C02 — MaxCodeBlock

- Props: `code: string`; `label = 'Conteúdo técnico'`; `language?: string` apenas como rótulo; `copyable = false`; `maxLines = 20`; `wrap = false`.
- Eventos: `copied: []` e `copy-error` com o motivo de C01. Slot `actions` opcional.
- Usar `pre > code`, escapar via interpolação e compor C01 quando habilitado. Expandir/recolher com `MaxButton`, `aria-expanded` e região identificada. Cópia usa a string integral, não o recorte visual; a interface deve dizer “Copiar conteúdo completo”.
- Não aceitar objeto para serialização automática, HTML, parser ou código executável. Redação de informações sensíveis e serialização JSON pertencem ao consumidor **antes** de fornecer `code`; copiar fica desligado por padrão.
- Não duplicar `MaxInputCode`: este é um editor Monaco; o novo componente é leitura leve, sem toolbar de edição nem atualização de valor.

#### C03 — MaxDescriptionList

- Props: `items: readonly { id: string; label: string; value?: string | number | boolean | null }[]`; `columns: 1 | 2 | 3 = 2`; `emptyValue = '—'`.
- Slots tipados `value({ item })` e `actions({ item })`; sem eventos próprios de edição.
- Renderizar `dl/dt/dd`, responsivo a uma coluna em telas estreitas; preservar `0` e `false`, exibindo booleanos como “Sim”/“Não”. `null`, `undefined` e string vazia usam `emptyValue`. Array vazio não cria pares falsos.
- Slot permite badge/link/cópia sem transformar todo valor em ação. Não calcular datas, moeda, atraso ou status do domínio.

#### C04 — MaxSaveIndicator

- Props: `state: 'idle' | 'pending' | 'saving' | 'saved' | 'error' | 'offline'`; `message?: string`; `retryable = false`.
- Evento `retry: []`; slots opcionais `icon` e `default`. `idle` oculta conteúdo; demais estados têm texto explícito, não apenas cor/spinner.
- Nenhuma chamada HTTP, timer que declara sucesso, debounce ou mudança automática de estado. Estado pertence ao consumidor. Erro e offline nunca são apresentados como salvo.
- `aria-live="polite"`, animação respeita movimento reduzido, botão de retry só em erro e se autorizado. Difere de `MaxAlert`: indicador inline de ciclo de salvamento, não banner genérico.
- Adaptador futuro de MaxPinia deve respeitar `status.server.save` e distinguir salvamento local do confirmado no servidor. O tipo local consultado em `MaxPinia/src/types.ts` é referência, não garantia do pacote `file:` de cada consumidor.

#### C05 — MaxUsageMeter

- Props: `used: number | null`; `limit: number | null`; `unlimited = false`; `label: string`; `unit = ''`; `warningThreshold = 0.8`; `actionLabel?: string`.
- Evento `action: []`; slots `details` e `actions`.
- Compor `MaxProgressBar` com `mode="meter"` somente para números finitos, não negativos e `limit > 0`. Barra e ARIA limitados ao máximo, texto preserva consumo real inclusive acima do limite.
- `unlimited=true`: mostrar “Sem limite”, sem percentual; `limit=null`/`used=null`: “Consumo indisponível”, sem falsa porcentagem; limite zero: “Limite zero”, sem dividir por zero ou usar o fallback 100 do componente base. Negativos/NaN/Infinity são inválidos, não consumo zero. Adaptador converte sentinela `-1` do AgenteDeBolso em `unlimited=true`; não embutir sentinelas de domínio na API pública.
- Limiar vale somente entre 0 e 1; inválido usa padrão 0,8. Mensagem distingue proximidade, atingimento e excesso. Não determina permissão de uso, bloqueio de recurso, período de faturamento ou rota de upgrade.
- Difere de `MaxProgressBar`: agrega semântica de cota, exceções de limite e ação contextual; reutiliza o desenho e ARIA da barra existente.

#### C06 — MaxAttachmentList

- Props: `files: readonly MaxPreviewFile[]`; `disabled = false`; `emptyLabel = 'Nenhum anexo'`.
- Reusar **sem mudar** o discriminante local/remoto de `src/types/filePreview.ts`. Links do consumidor podem ser adaptados a remoto com nome/URL, usando fallback de ícone; não assumir que sejam arquivos baixáveis.
- Eventos `open: [file: MaxPreviewFile]` e `error` com payload de `MaxFilePreview`; slots `metadata({ file })`, `actions({ file, disabled })` e `empty`.
- Compor uma lista semântica de `MaxFilePreview`. Apenas emitir `open`: resolver download/preview autenticado no consumidor. IDs não mudam quando a lista é reordenada.
- Sem upload, seleção, remoção, vínculo com série, envio por e-mail, OCR, busca de URL ou persistência. Ações de domínio só entram pelo slot, com confirmação no app.
- Arquivos locais: o filho controla os blob URLs que criou. Nunca revogar URLs pertencentes ao consumidor. Não expor URL assinada em logs ou payloads de diagnóstico.

#### C07 — MaxAudioPlayer

- Props: `src: string`; `label = 'Reprodutor de áudio'`; `duration?: number` em segundos como fallback informativo; `speeds: readonly number[] = [1, 1.3, 1.6, 2]`.
- Eventos: `play: []`, `pause: []`, `ended: []`, `error: [{ reason: 'invalid-source' | 'load-failed' | 'play-failed' }]`.
- Usar `<audio controls preload="metadata">`, que já inclui navegação temporal acessível, e `MaxButton` para alternar velocidade. **Não criar slider/input novo**, gravação ou transcrição. Sem autoplay.
- Metadata válida do elemento prevalece sobre duração de fallback; tratar duração ausente/infinita sem cálculos inválidos. Filtrar velocidades finitas positivas; lista sem valores válidos usa `[1]`.
- Mudança de fonte reinicia estado; desmontagem pausa e libera recursos do elemento, não blobs que não criou. Fonte vazia ou de protocolo executável deve ser recusada; aceitar HTTP(S), URL relativa e blob fornecido pelo app. Não buscar tokens nem expor credenciais.
- Eventos de reprodução seguem o elemento, não a intenção do clique. Implementação deve tratar rejeições de `play()` caso invoque reprodução programática. Não copiar `void el.play()` do código de origem.

#### C08 — MaxChatMessage

- Props: `id: string`; `direction: 'incoming' | 'outgoing' = 'incoming'`; `author: string`; `text = ''`; `timestamp?: string` ISO; `timeLabel?: string` formatada pelo app; `status?: 'pending' | 'sent' | 'error'`; `renderMarkdown?: (text: string) => string`.
- Slots `avatar`, `content`, `attachments` e `actions`. Sem evento de enviar, buscar ou salvar; ações personalizadas são responsabilidade do slot.
- Texto puro por padrão. Markdown opcional compõe `MaxMarkdownViewer` com `renderMarkdown`, mantendo sanitização existente. Não copiar o renderer ou tipos de store do chatbot.
- Usar `MaxUserAvatar`/`MaxIcon` para identidade visual. Horário determinístico: `timeLabel` visível fornecido pelo app e `timestamp` em `time[datetime]` quando válido; sem formatar fuso local diferente entre SSR e cliente. Sem horário válido, omitir.
- Streaming pode atualizar `text` por props; não criar conexão, auto-scroll nem região viva que anuncie cada token. Papel de usuário/assistente é adaptação do domínio, não enum rígido desta UI.

#### C09 — MaxSocialPostPreview

- Props: `author: string`; `caption = ''`; `media: readonly { id: string; src: string; alt: string }[]`; `activeMediaId?: string`; `emptyLabel = 'Sem imagem para pré-visualizar'`.
- Evento `update:activeMediaId: [id: string]`; slots `header`, `footer` e `empty`.
- Prévia genérica de feed com imagens, legenda preservando quebras e carrossel por `MaxImage` e `MaxIconButton`. Sem seletor de plataforma, edição de legenda, ações sociais reais ou API Meta.
- Com prop ativa: modo controlado, emitir intenção sem mutar; sem prop: estado visual local. ID ausente/inválido exibe a primeira mídia; lista vazia exibe vazio. Mudança da lista não mantém índice inválido. Ordem e IDs preservados.
- Traduzir `slide_number`/`artwork.url` do SocialMedia em adaptador futuro; não importar `EventSlide`. A prévia é aproximada e não garante aparência ou aprovação de uma rede oficial.

#### C10 — MaxKanbanBoard

- Props: `columns: readonly { id: string; title: string; items: readonly { id: string; title: string; description?: string; disabled?: boolean }[]; total?: number }[]`; `collapsedColumnIds: readonly string[] = []`; `label = 'Quadro de acompanhamento'`.
- Eventos `toggle-column: [columnId: string]` e `item-click: [{ columnId: string; itemId: string }]`; slots `column-header({ column })`, `item({ columnId, item })` e `empty-column({ column })`.
- Colunas roláveis horizontalmente, cabeçalho com total fornecido ou tamanho da lista, recolhimento por `MaxIconButton`, cards via `MaxCard`. `aria-expanded`, `aria-controls`, nomes de regiões e foco preservado ao recolher/expandir por teclado.
- `collapsedColumnIds` é controlado pelo consumidor. Não gravar preferências em localStorage. Lista vazia continua mostrando coluna/cabeçalho.
- Usar `MaxCardList` por coluna se sua virtualização e slots puderem ser integrados sem busca global nem filtros (`useGlobalSearch=false`, `filterable=false`, uma coluna). O executor confirma por leitura esse contrato antes de acoplar; se inviável, manter lista estática no MVP e registrar limitação, sem criar virtualizador paralelo.
- Nenhum drag/drop, motor de ordenação, mesclagem, exclusão ou regras de planner nesta versão. Não substituir o quadro de origem, que possui essas funcionalidades.

### 3.3. Arquivos futuros

Novos, na worktree autorizada, somente em Execute:

- `src/components/{MaxCopyButton,MaxCodeBlock,MaxDescriptionList,MaxSaveIndicator,MaxUsageMeter,MaxAttachmentList,MaxAudioPlayer,MaxChatMessage,MaxSocialPostPreview,MaxKanbanBoard}.vue` — dez arquivos, não um nome literal com chaves.
- `src/types/{copyButton,codeBlock,descriptionList,saveIndicator,usageMeter,attachmentList,audioPlayer,chatMessage,socialPostPreview,kanbanBoard}.ts` — contratos públicos correspondentes, sem duplicar `MaxPreviewFile`.
- `tests/components/<NomeDoComponente>.test.ts` para cada componente.
- `tests/browser/OperationalComponents.browser.ts`, `tests/ssr/operationalComponents.ssr.test.ts`, `tests/ssr/operationalComponents.hydration.test.ts`, `tests/types/operationalComponents.test.ts` e `playground/src/scenarios/operational-components.vue` — nomes propostos; confirmar ausência antes de criar.

Existentes a integrar: `src/index.ts`, `src/components-manifest.json`, `package.json` (exports, sem versão/deps novas), `COMPONENTS.md`, `README.md`, `playground/src/catalog.ts`, `playground/src/scenarios/index.ts`, `tests/index.test.ts` e `scripts/verify-consumers.mjs`. Localizar por pesquisa os testes do resolver e de subpaths e ampliar sem remover casos atuais. `vite.config.ts:32–39` já descobre SFCs da raiz; não precisa lista manual nova.

O gerador existente `src/scripts/generateResolver.ts` grava o manifesto, não o entrypoint. Executá-lo apenas em Execute, com ferramenta local já disponível, sem download por `npx`; se faltar executor TypeScript, registrar bloqueio e definir forma suportada sem instalar silenciosamente. Preservar mudanças concorrentes nos arquivos centrais.

### 3.4. Viabilidade, acesso e compatibilidade

- Node_modules da worktree é symlink para o da árvore principal. Não instalar, limpar, atualizar ou reparar esse diretório compartilhado. Qualquer provisionamento isolado precisa de autorização própria.
- MaxUse instalado `1.1.47`; VueUse efetivo `14.4.0`. São evidências locais, não confirmação de todas as árvores dos consumidores.
- MaxPinia é peer opcional e não está instalado neste node_modules. Os novos componentes não devem passar a importá-lo em runtime. O código-fonte irmão foi lido para compreender status, não deve ser referenciado por caminho local.
- Manifestos dos quatro apps usam bibliotecas por `file:./storage/libs/...`; Engeapp/AgenteDeBolso declaram Pinia 3 e esta biblioteca declara peer Pinia 4. Não concluir compatibilidade ponta a ponta ou planejar atualização desses apps nesta entrega.
- Fontes de mídia, clipboard e permissões reais não foram testados. Testes com dublês comprovam contratos, não reprodução/cópia nativas nem autenticação de URLs.
- Consulta oficial via Context7: https://vuejs.org/guide/scaling-up/ssr, https://vueuse.org/useClipboard e https://vueuse.org/useClipboardItems. A documentação não foi obtida como snapshot exato de Vue `3.6.0-rc.10`; confrontar assinatura/comportamento com instalação efetiva. Evitar APIs exclusivas de versões não verificadas.

## 4. Plano de Execução Faseado

1. **Preflight por leitura:** confirmar worktree/branch/diff, instruções vigentes, componentes que outras sessões possam ter criado, dependências efetivas, hooks, harness e isolamento. Não assumir acesso aos mesmos caminhos dos apps em outra máquina; o executor tem o resumo dos contratos acima.
2. **Contratos:** fixar tipos, eventos, estados extremos, composição e ausência de dependências de domínio. Não adicionar stores/rede.
3. **Implementação em lote:** C01 antes de C02; restantes independentes salvo integração compartilhada. Implementar os dez componentes e todos os testes previstos antes de rodar suíte/tipos/build.
4. **Integração única:** exports, tipos, manifesto/resolver, subpaths, playground, catálogo e exemplos; conciliar entradas de sessões paralelas sem reverter inputs.
5. **Validação do conjunto:** executar o gate confirmado no projeto somente depois do lote. Corrigir falhas agrupadas, diagnosticar harness antes de repetir e revalidar a revisão afetada.
6. **Aceite manual e revisão:** clipboard/mídia reais, teclado, mobile, dark, SSR/hidratação e bundle. Pendências externas ficam explícitas; sem publicação ou integração Git automática.

## 5. Critérios de Aceite & Validação

- Existem exatamente os dez novos componentes desta seleção, sem inputs ou nova dependência PrimeVue, sem alterações nos apps/MaxUse/MaxPinia.
- Cada contrato de 3.2 tem testes de estados normais, vazios/inválidos, alterações de props, emissão única e imutabilidade; ver matriz detalhada em `plan.md`.
- Sem falha SSR por `window`, `navigator`, `document`, mídia ou temporizadores; hidratação mantém IDs/horários e conteúdo inicial coerentes.
- Todos exportados por raiz e subpath, com tipos públicos e resolução de nome comprovados; catálogo e cenário lazy incluídos. Imports leves não carregam Monaco/Tiptap por causa dos novos componentes.
- Teclado, foco visível, nomes acessíveis, semântica de listas/detalhes, movimento reduzido e modos claro/escuro são verificáveis no navegador.
- Comandos existentes para futura validação: `npm run verify` (gate agregado completo) e `npm run dev:playground` (inspeção manual). Não executados nesta sessão. O gate envolve instalação de consumidores temporários e auditoria de rede: conferir autorização e isolamento antes; se indisponíveis, registrar bloqueio, sem bypass.
- `verify` já agrega tipos, lint, build, testes, cobertura, browser, benchmark e consumidores. Não repetir suas etapas isoladas sobre o mesmo conteúdo aprovado nem remover casos para obter verde.
- Clipboard e áudio devem ter aceite nativo com conteúdo sintético, origem segura e recursos locais autorizados. Enquanto faltar, registrar `manualPending`, não “concluído integralmente”.

Notificações sanitizadas relacionadas estão em `docs/notifications/wt-84453aaf/notifications/`. Elas não autorizam correções fora deste escopo.
