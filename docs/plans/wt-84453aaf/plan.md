# Plano de execução — dez componentes reutilizáveis, sem inputs

- Data: 16/10/2026.
- Projeto: `@maxvue/max-components-ui`.
- Worktree única: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-84453aaf`.
- Branch informada: `wt-84453aaf`; HEAD observado na investigação: `e8bcbebcff14b1932a8394d0f60f76e6b1b25946`.
- Especificação vinculada: [spec.md](./spec.md).
- Estado: **planejado, não implementado**. A sessão Plan não executou testes, builds, instalações ou alterações de código.

## 1. Pedido, resultado e limites

O usuário solicitou análise de Engeapp, MaxAiManager, AgenteDeBolso e SocialMedia e sugestão de dez novos componentes para centralizar no MaxComponentsUi. **Não sugerir inputs**, pois outras sessões trabalham neles.

A execução futura implementará somente os dez componentes aprovados, seus contratos, documentação, demonstrações e testes nesta biblioteca. Não migrará os quatro apps nem alterará sua lógica. Usuários beneficiados: quem consulta detalhes, logs, anexos, mensagens, consumo, quadros e prévias editoriais; equipes ganham uma API visual comum.

As sugestões são:

| Tarefa | Componente novo | Responsabilidade reutilizável | Origem concreta |
|---|---|---|---|
| C01 | `MaxCopyButton` | Copiar texto com retorno confiável e acessível. | Engeapp e MaxAiManager. |
| C02 | `MaxCodeBlock` | Exibir código/JSON/log como texto somente leitura. | MaxAiManager. |
| C03 | `MaxDescriptionList` | Mostrar campos de detalhes em pares rótulo/valor. | MaxAiManager e AgenteDeBolso. |
| C04 | `MaxSaveIndicator` | Mostrar pendência, salvamento, sucesso, erro e offline. | SocialMedia. |
| C05 | `MaxUsageMeter` | Mostrar consumo, cota, exceções e ação contextual. | AgenteDeBolso. |
| C06 | `MaxAttachmentList` | Exibir coleção de anexos, sem upload. | AgenteDeBolso e MaxAiManager. |
| C07 | `MaxAudioPlayer` | Reproduzir áudio, exibir duração e ajustar velocidade. | Engeapp. |
| C08 | `MaxChatMessage` | Exibir mensagem com autor, horário e conteúdo seguro. | Engeapp e MaxAiManager. |
| C09 | `MaxSocialPostPreview` | Prévia de feed com legenda e imagens navegáveis. | SocialMedia. |
| C10 | `MaxKanbanBoard` | Exibir quadro com colunas e cartões recolhíveis. | Engeapp. |

Não há requisito de que cada componente já esteja repetido nos quatro apps. A tabela separa origem observada de possibilidade de reutilização futura. A biblioteca já possui calendário, barra de filtros, estados de consulta, progresso, visualizador Markdown e preview individual de arquivo; não contá-los como novidades.

## 2. Evidências e decisões que o executor deve preservar

### 2.1. Código inspecionado

Referências completas, linhas e contratos estão na spec, seções 1.1 e 3.2. Raízes de origem lidas: `/home/johnattas/GitHub/{engeapp,MaxAiManager,AgenteDeBolso,SocialMedia}/resources/Vue/`. Os nomes e capitalização reais importam; `socialmedia` do pedido corresponde ao diretório `SocialMedia`.

Na biblioteca foram lidos:

- `src/components/MaxFilePreview.vue` e `src/types/filePreview.ts`: preview individual; discriminante `local/remote`, `id`, eventos `open/error`, criação/liberação de blob local.
- `src/components/MaxProgressBar.vue` e seu teste: já possui `mode="meter"`, clamp e ARIA; máximo inválido vira 100, razão para C05 tratar zero antes da composição.
- `src/components/MaxMarkdownViewer.vue` e `src/types/markdownViewer.ts`: renderer obrigatório e sanitização existente; C08 deve compor, não duplicar parser.
- `src/components/MaxAlert.vue`: feedback genérico já existente; não extrair outro `AsyncFeedback`.
- `src/components/MaxCardList.vue`, `src/types/card.ts`, `src/components/MaxTable.vue` e `MaxImage.vue`: composição disponível, virtualização de cards, slots e preview de imagem. Kanban não é sinônimo de grade/tabela.
- `src/components/MaxInputCode.vue`: editor Monaco existente; não usá-lo para um bloco técnico leve nem modificá-lo.
- `src/index.ts`, `src/helpers/MaxComponentsUiResolver.ts`, `src/scripts/generateResolver.ts` e `vite.config.ts`: exportação explícita na raiz, manifesto gerado, subentradas descobertas dos SFCs.
- `package.json:756–782`, `vitest.config.ts`, `vitest.browser.config.ts`, `tests/setup.ts`, `tests/index.test.ts`, `tests/browser/ReusableComponents.browser.ts` e `tests/ssr/reusableComponents.ssr.test.ts`: gates e modelos reais de testes.
- `scripts/verify-consumers.mjs`: empacota e instala em diretórios temporários, renderiza SSR, verifica tipos e Vite; usa `CONSUMER_TEMP_DIR` quando definido.
- `playground/src/catalog.ts` e `playground/src/scenarios/index.ts`: catálogo e importação lazy dos cenários.

Busca pelos dez nomes em `src/**/*.{ts,vue,json}` não retornou ocorrências. A worktree estava limpa antes da criação destes documentos. `.gitignore:68–69` já ignora `.worktrees/` e `.max-code-worktrees/`.

### 2.2. Decisões confirmadas pelo pedido

1. Exatamente dez sugestões sem inputs; investigar os quatro apps.
2. Toda escrita desta tarefa na worktree já fornecida. Não criar worktree, trocar branch ou fazer Git de integração.
3. Nesta sessão, escrever exclusivamente spec, plano e notificações nos destinos autorizados. Não criar `execution-state.json` agora.
4. Não implementar ou validar código nesta fase.

### 2.3. Decisões propostas para aprovação com este plano

1. Componentes novos controlados por props/eventos, sem rede ou persistência de domínio.
2. C07 usa controles de áudio nativos e botões Max, **sem criar input/slider**.
3. C10 é quadro de leitura/navegação; **sem arrastar, reordenar ou mesclar**. O quadro de origem mantém todos esses comportamentos porque não será substituído.
4. C09 cobre somente imagens/legenda em feed genérico; não simula todas as redes nem publica conteúdo.
5. C02 recebe string preparada pelo app, é somente leitura e não carrega Monaco/Tiptap ou dependência de highlighting.
6. C01 usa `useClipboardItems` via MaxUse, com checagem de capacidade e rejeição nativa; não assume sucesso de `useClipboard.copy`.
7. C04 é somente indicador; debounce, filas e confirmação no servidor pertencem a MaxPinia e ao consumidor.
8. Inputs, aliases, classes legadas e demais componentes existentes não serão alterados para acomodar o lote.

### 2.4. Limitações verificadas

- A análise foi estática e direcionada. Não houve navegação nas aplicações, aceite em produção, inspeção de banco ou reprodução de falha.
- `node_modules` da worktree aponta à árvore principal; operações de pacote podem atingir trabalho alheio. Não instalar/limpar nesse symlink.
- MaxPinia não está instalado neste node_modules; é peer opcional e não deve virar import obrigatório nos componentes novos. Fonte irmã consultada apenas como referência de status.
- Apps usam pacotes locais em `storage/libs`; Engeapp e AgenteDeBolso declaram Pinia 3, biblioteca declara peer Pinia 4. Aprovação de consumidores sintéticos não comprova compatibilidade desses apps reais.
- A documentação oficial consultada não é snapshot exato de Vue RC; APIs críticas de cópia foram confrontadas com fonte instalada. Revalidar versões na retomada.
- As notificações não incluem segredos e não autorizam reparos nos apps ou nas bibliotecas irmãs.

## 3. Plano executável

### T00 — Preflight seguro, somente leitura antes da implementação

**Dependências:** autorização futura para Execute.

1. Ler `AGENTS.md`, este plano e a spec na primeira admissão. Nas retomadas, consultar somente o trecho pertinente e o progresso real.
2. Conferir diretório atual, raiz Git, branch e diff. Usar a worktree indicada; não criar outra, trocar branch, descartar alterações ou investigar worktrees alheias.
3. Verificar trabalho já realizado, colisão de nomes e alterações de outras sessões, especialmente em `src/index.ts`, manifesto, `package.json` e catálogo. Se um dos dez componentes agora existir, analisar equivalência antes de duplicar; mudança substancial de seleção exige nova revisão do plano.
4. Ler scripts e hooks efetivos antes de rodar comandos; resolver por leitura as versões/realpaths de Vue, MaxUse, VueUse, Pinia e Axios. Confirmar que MaxUse instalado oferece `useClipboardItems` com rejeição de escrita e que o reexport realmente corresponde ao módulo usado no harness.
5. Conferir aliases/dedupe do harness e singleton Vue/Pinia/Axios. Os novos componentes não farão chamadas Axios; não transformar preparação de harness em refatoração de aplicação.
6. Confirmar diretórios de artefatos, cache, navegador e cenários consumidores temporários **exclusivos desta execução e dentro da worktree**. O symlink de dependências não é autorização para escrever na raiz principal.
7. Não copiar `.env`, instalar dependências, rodar migrations/resets ou acessar banco/cache/filas/storage compartilhados. Nada disso é necessário ao lote. Usar fixtures sintéticas e bloquear rede externa nos testes de componente, exceto infraestrutura de ícones já controlada pelo harness.
8. Se qualquer gate de integridade de biblioteca falhar, parar validações dependentes e diagnosticar. Não remover prehook, ignorar config ou executar binário diretamente para contornar proteção. Dependência ausente/compartilhada sem alternativa segura exige ação autorizada, não instalação silenciosa.

**Saída:** preflight registrado por evidências reais em Execute; ambiente suficiente ou pendência com próxima ação concreta. Preflight não é um teste aprovado de implementação.

### T01 — Contratos e organização do lote

**Depende de:** T00.

- Criar os dez tipos públicos e definir props/eventos/slots exatamente conforme spec 3.2. Revisar unidades (bytes versus unidade visual; segundos; milissegundos), propriedade dos dados e identidade estável antes da UI.
- Não importar DTOs dos apps, `EventSlide`, stores de chatbot, billing, transação ou planner. Adaptadores são exemplos/documentação de fronteira, não novos serviços.
- Confirmar por leitura a composição de `MaxCard`, `MaxIconButton`, `MaxButton`, `MaxUserAvatar`, `MaxImage`, `MaxCardList` e helpers necessários. Ajustes de baixo impacto devem seguir contratos existentes; incompatibilidade crítica exige registro/revisão antes de implementar dependente.
- Definir IDs de regiões estáveis por instância, sem `Math.random()`/horário no SSR; callbacks de slot/eventos tipados, sem `any` novo como atalho.

**Saída:** contratos coerentes; nenhuma alteração dos componentes de input ou dependência nova.

### C01–C10 — Componentes e testes em lote

**Depende de:** T01; C02 também depende do contrato C01. Ordem sugerida: C01, C03–C07, C08–C10 e C02; a ordem não autoriza testes entre microedições.

Para cada ID, criar `src/components/<Nome>.vue`, o tipo correspondente listado na spec e `tests/components/<Nome>.test.ts`. Implementar todo o escopo e seus testes antes de executar validações agregadas.

| ID | Ações de implementação | Condição de conclusão por leitura/revisão |
|---|---|---|
| C01 | Compor botão Max; helper MaxUse; capacidade/permissão, concorrência, mensagens e limpeza. | Sucesso só após escrita confirmada; nenhum texto exposto em eventos/logs; SSR não toca clipboard. |
| C02 | `pre/code`, cabeçalho/ações, expansão e cópia opcional via C01. | HTML nunca interpretado; não edita nem serializa; texto integral disponível/copiado com aviso claro. |
| C03 | `dl/dt/dd`, grid responsivo, vazios e slots. | `0`/`false` preservados e nenhum cálculo financeiro/data de domínio. |
| C04 | Mapear seis estados para ícone/texto; retry só por evento. | Não há fetch, debounce ou sucesso simulado; erro/offline não vira salvo. |
| C05 | Normalizar valores; compor barra só com limite válido; estados especiais e CTA genérico. | Não dividir por zero, não exibir `-1` como limite, não decidir autorização/upgrade. |
| C06 | `ul/li` de MaxFilePreview e repasse de slots/eventos; dados imutáveis. | Sem upload/remoção ou navegação automática; identidade e propriedade dos blobs preservadas. |
| C07 | Áudio com controles nativos, label, velocidade por MaxButton e ciclo de vida. | Sem PrimeVue/slider/autoplay; sem vazamento de fonte anterior e com falhas tratáveis. |
| C08 | Autor, direção, horário determinístico, slots; Markdown opcional via viewer sanitizado. | Sem conexão/envio/parser novo; texto hostil não executa e não há anúncio a cada token. |
| C09 | Prévia de autor/legenda e imagens; navegação por ID, vazio e mudança de lista. | Sem input/plataforma/publicação; índices nunca são usados como identidade persistente. |
| C10 | Colunas, contadores, cards, recolhimento controlado, scroll e foco. | Zero chamadas de domínio, arraste/mesclagem ausentes, colunas vazias visíveis e busca global não alterada. |

**Cooperação futura:** execução sequencial é suficiente. Se houver delegação explicitamente autorizada, dar a cada executor somente o ID, o trecho da spec e os caminhos de escrita daquele componente/tipo/teste. C01/C02 são sequenciais. Um integrador é o único escritor dos arquivos centrais; ninguém roda gates enquanto houver implementação paralela em andamento. Não exigir releitura integral em cada microtarefa.

### T12 — Integração, documentação e harness do lote

**Depende de:** C01–C10 implementados com seus testes escritos.

1. Exportar componentes e tipos por `src/index.ts`. Aliases sem `Max` seguem o padrão existente; conferir colisões antes e nunca substituir alias consolidado. Publicar nomes canônicos no manifesto.
2. Atualizar os exports explícitos de subpath em `package.json` conforme convenção e manter wildcard/versão/dependências. `vite.config.ts` já gera entradas de cada SFC raiz; não introduzir lista paralela desnecessária.
3. Regenerar `src/components-manifest.json` pelo gerador existente em ambiente local suportado. O comando documentado no AGENTS é `npx tsx src/scripts/generateResolver.ts`, mas **não usá-lo se isso baixar `tsx`**. Confirmar executor local antes; falta de ferramenta é bloqueio a resolver sem instalação implícita. Inspecionar diff do gerado e preservar entradas de outras sessões.
4. Ampliar `tests/index.test.ts`, testes de resolver/subpaths existentes encontrados por pesquisa e cenários de `scripts/verify-consumers.mjs` para abranger os dez componentes e seus tipos. Verificar import raiz, import por componente, build Vite e SSR empacotado, não só existência dos arquivos.
5. Criar os quatro arquivos de teste compartilhados propostos na spec: navegador, SSR, hidratação e contratos de tipos. Usar convenções de `tests/browser/ReusableComponents.browser.ts` e `tests/ssr/reusableComponents.*`; não enfraquecer warnings/asserts do setup.
6. Adicionar cenário lazy `operational-components` a `playground/src/scenarios/index.ts`, catálogo e novo SFC. Sem APIs reais; mostrar dados sintéticos de pelo menos dois domínios por padrão quando útil. Não inserir entradas na família `inputs`.
7. Documentar props, defaults, eventos, slots, estados extremos, limites do MVP e composição em `COMPONENTS.md`/`README.md`, sem afirmar que já houve migração dos apps. Exemplos de lista de anexos não devem resolver URLs reais ou demonstrar upload.
8. Incluir teste arquitetural/asserção de bundle contra novas dependências PrimeVue, imports de caminhos dos consumidores e carregamento Monaco/Tiptap causado pelos componentes novos. Reaproveitar verificações existentes antes de criar outra esteira.

**Saída:** lote implementado, todos os testes escritos, distribuição e documentação integradas. Ainda não declarar validação concluída.

### T13 — Validação agregada e diagnóstico em lote

**Depende de:** T12 e preflight ainda válido.

- Comando de fechamento identificado: **`npm run verify`**, a partir da raiz da worktree. Já inclui nomes de arquivos, lockfile, SVG, tipos da biblioteca/testes, lint, build, unitários, cobertura, navegador, bundle do playground, benchmarks, consumidores e auditoria/dependências.
- Antes dele, assegurar que `CONSUMER_TEMP_DIR` aponte para diretório exclusivo sob `.execution-tmp/` desta worktree; o script usa esse valor. Preparação/escrita desse diretório pertence a Execute, não à sessão Plan.
- `verify:consumers` instala pacotes temporários e auditoria consulta rede. Verificar permissões de execução/instalação de fixtures antes. Sem autorização/acesso, registrar bloqueio; não substituir o gate inteiro por um resultado parcial “verde”. Não executar `npm run release`.
- Implementar o lote completo antes do gate. Corrigir falhas de forma agrupada; só depois revalidar. Não executar suíte, tipos/build após cada componente nem duplicar etapas já aprovadas da mesma revisão.
- Se o agregado interromper, registrar o código de saída e etapa da falha. Etapas não alcançadas ficam pendentes; não inferir passagem. Se repetir falha sem alteração/progresso, diagnosticar causa do harness/versões/bootstrap antes de tentar de novo.
- Falhas preexistentes devem ter causalidade investigada e relatório próprio; não ampliar escopo para repará-las sem autorização. Não alterar thresholds, retirar testes ou trocar configurações para mascarar falha.
- Navegador/benchmarks/consumidores não são substituídos por unitários. Reaproveitar resultados da revisão factual idêntica, mantendo checks de regressão impactados por qualquer correção.

**Saída:** resultados vinculados ao conteúdo testado ou pendências explícitas; nunca aprovação inferida de ausência de erros visíveis.

### T14 — Aceite manual e revisão de entrega

**Depende de:** T13, salvo pendências operacionais registradas.

- Se autorizado em Execute, `npm run dev:playground` serve para inspeção manual local; usar URL/porta realmente retornadas pelo servidor, não presumir porta fixa.
- Revisão independente nos marcos de risco: contratos de cópia/HTML/URLs antes do fechamento e revisão da entrega completa. Não precisa revisão por microedição nem subagente automático.
- Verificar clipboard em origem segura com frase sintética: clique, colar manualmente, negar permissão/retirar suporte e conferir ausência de falso sucesso. Não ler automaticamente o clipboard de quem usa a máquina.
- Verificar áudio com arquivo sintético/local permitido: tocar, pausar, terminar, alternar velocidade, substituir `src`, navegar/desmontar, fonte inválida e ausência de autoplay. Eventos simulados não comprovam reprodução nativa.
- Verificar teclado/Tab/Enter/Espaço, foco, 320–375 px, desktop, dark, zoom e movimento reduzido no cenário. Conferir carrossel por ID e recolhimento do Kanban sem perder foco nem capturar a busca global.
- Sem permissão/recurso para aceite externo, tarefa fica `manualPending` com próxima ação. Compatibilidade dos quatro apps reais permanece não validada e fora da implementação; não declarar adoção.
- Revisar diff bruto contra pedido/spec e ausência de arquivos fora do escopo. Não commitar, integrar, publicar ou remover esta worktree; MaxCode/usuário administra isso.

## 4. Matriz de aceite por tarefa

Todos os testes abaixo são **futuros**. Nenhum foi executado nesta investigação. Os caminhos são os previstos na seção 3.3 da spec; revisão de risco é leitura humana/independente, não substitui teste.

| ID/requisito | Evidência de atendimento esperada | Testes pertinentes | Revisão pelo risco | Verificação manual |
|---|---|---|---|---|
| T00: ambiente seguro | Raiz/diff/realpaths/hooks e versões registrados. | Gate de integridade existente, quando execução autorizada. | Symlink compartilhado e isolamento de artefatos. | Confirmar ausência de acesso a serviços reais. |
| C01: cópia confiável | Evento após escrita; motivo de falha; sem conteúdo em logs/eventos. | Sucesso/rejeição, API ausente, permissão negada, vazio, clique duplo, troca de texto, SSR. | Sem fallback silencioso ou leitura do clipboard. | Copiar/colar texto sintético e negar permissão em navegador real. |
| C02: leitura técnica segura | `pre/code` com texto exato, expansão e cópia integral opcional. | HTML malicioso literal, string vazia/longa, linhas, cópia do conteúdo não recortado. | Sem HTML, execução, dados sensíveis em fixture ou import Monaco. | Overflow e navegação por teclado em mobile. |
| C03: detalhes | `dl/dt/dd` coerente e slots tipados. | Zero/false/null/vazio, ordem, mudanças de props e slots, uma/duas/três colunas. | Nenhuma regra financeira/data embutida. | Rótulos extensos e leitura responsiva. |
| C04: estado de salvamento | Cada estado tem texto correto e retry somente por intenção. | Seis estados, transições rápidas e retry; nunca emitir HTTP ou declarar sucesso por timer. | Confirmação de servidor distinta de cache. | Movimento reduzido, erro e offline legíveis sem depender da cor. |
| C05: cotas | Valor real em texto, barra limitada e semântica especial explícita. | Abaixo/igual/acima, limite zero/null, ilimitado, negativo/NaN/Infinity, limiar inválido e ARIA. | Sem autorização de uso decidida na UI; sem “5 de -1”. | Compreender excesso, indisponível e sem limite. |
| C06: anexos | Lista de previews existentes com IDs e eventos íntegros. | Vazio, locais/remotos, reordenação, erros, disabled, slots e ciclo de blob no filho. | Não abrir/excluir/baixar sem ação do consumidor; propriedade dos blobs. | Teclado, nome/tamanho, URLs recusadas e lista longa. |
| C07: áudio | Elemento nativo, velocidade, eventos e desmontagem corretos. | Metadata/fallback, fonte inválida, speeds inválidas, troca/unmount, erro de reprodução e SSR. | Sem autoplay, fetch de token, leak ou import PrimeVue/Slider. | Reprodução real e limpeza ao trocar página. |
| C08: mensagens | Direção/autor/horário e conteúdo seguro, sem rede. | Texto puro, Markdown hostil sanitizado, slots, texto atualizado, horário ausente e hidratação. | Sanitização do viewer mantida; sem log de mensagens. | Sequência de mensagens e foco/legibilidade. |
| C09: prévia | Legenda, vazio e carrossel com ID estável. | Zero/uma/várias imagens, ID inválido, lista reduzida/reordenada, modo controlado/local e teclado. | Sem contrato Meta, IDs de slide acoplados ou ação de publicação. | Imagens quebradas, legenda longa, dark e mobile. |
| C10: quadro | Colunas mesmo vazias, contagem, toggle e item-click corretos. | Múltiplas colunas, recolhimento controlado, total explícito, disabled, foco, ausência de mutação e SSR. | Não extrair mesclagem nem ativar busca global; confirmar viabilidade do virtual scroll. | Scroll horizontal e expandir/recolher por teclado. |
| T12: distribuição | Dez nomes/tipos na raiz, manifesto, subpaths, docs e cenário. | Índice/resolver, tipos, consumidores ESM/TS/Vite/SSR e bundle. | Preservar aliases e alterações concorrentes de inputs. | Catálogo abre cenário lazy sem APIs reais. |
| T13/T14: entrega | Gates vigentes aprovados e aceite nativo, ou pendência explícita. | `npm run verify` completo, sem bypass e com exit codes reais. | Diff final, segurança, acessibilidade e compatibilidade declarada honestamente. | Checks acima completos; sem isso, `manualPending`. |

## 5. Riscos, alternativas e recuperação

- **Duplicação de biblioteca:** não sugerir novamente MaxAlert/MaxQueryState/MaxProgressBar/MaxFilePreview/MaxMarkdownViewer/MaxCalendar. As composições novas devem adicionar o contrato descrito, não renomear o componente existente.
- **Escopo excessivo:** extrair o Kanban completo incluiria merge destrutivo e drag de planner; foi descartado. Extrair upload/recorrência/autosave/publicação também foi descartado por ser input ou negócio.
- **Cópia com sucesso falso:** documentada em notificação própria; helper de itens foi observado como alternativa existente. Se seu comportamento mudar na instalação efetiva, bloquear C01/C02 dependentes até definir solução compatível; não corrigir MaxUse sem outro pedido.
- **Pinia incompatível nos apps:** eventual migração depende de compatibilidade de peers e libs efetivas de cada consumidor; não atualizar Pinia dos apps como parte deste lote.
- **Conteúdo hostil/sensível:** só texto escapado e Markdown sanitizado; nenhuma fixture com credenciais, dados pessoais ou URLs assinadas. Cópia de diagnóstico é opt-in e recebe conteúdo previamente preparado pelo consumidor.
- **Crescimento de bundle:** sem dependência nova, sem parser/editor no bloco de código; compor recursos existentes e verificar bundle. Virtualização do Kanban reutiliza contrato real ou fica explicitamente fora, sem nova infraestrutura improvisada.
- **Mudanças concorrentes:** entradas compartilhadas recebem integração única, sem ordenar/apagar exportações alheias. Não investigar outras worktrees.
- **Operação:** não há deploy, migração de dados ou mudanças persistentes de produto. Reversão futura remove apenas adições deste lote e suas entradas, após revisar dependentes; nunca reset geral. Não executar reversão nesta sessão.
- **Pendência/bloqueio:** indicar evidência, tarefa afetada e próxima ação concreta. Não marcar todo o lote concluído se um gate obrigatório ou aceite nativo estiver pendente.

Notificações desta investigação:

1. `docs/notifications/wt-84453aaf/notifications/max-components-ui-componentes-nao-input.md` — lacunas do catálogo que fundamentam a seleção.
2. `docs/notifications/wt-84453aaf/notifications/max-components-ui-compatibilidade-pinia.md` — divergência de faixas Pinia e dependências locais dos consumidores.
3. `docs/notifications/wt-84453aaf/notifications/max-use-clipboard-feedback.md` — limites do feedback de `useClipboard` observado e alternativa existente.

## 6. Progresso, retomada e handoff em Execute

Na primeira admissão, ler estes documentos e conferir o trabalho real; nas retomadas, consultar tarefas pendentes, decisões e trechos pertinentes, sem reabrir decisões sem evidência nova/requisito alterado. Conferir o código e o diff local antes de confiar em registros anteriores; executar lacunas, não repetir checks equivalentes já vigentes.

**Somente em Execute**, registrar após marcos e handoff em `docs/plans/wt-84453aaf/execution-state.json`, vinculado ao SHA256 real do `plan.md` salvo e às revisões reais de conteúdo por tarefa. Não criar esse arquivo nesta sessão Plan.

- Usar schema **version 2 estrito** do executor MaxCode; conferir schema real antes de gravar, sem inventar estrutura JSON/campos extras. Version 1 permanece compatível, mas não prova validação integral automaticamente.
- Registrar tarefas T00, T01, C01–C10 e T12–T14, estado e arquivos. Estados permitidos: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`.
- Motivos/próxima ação em `nextAction` com até 512 caracteres. Não adicionar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`.
- Comandos registrados têm até 4.096 caracteres e precisam ter sido realmente executados. Registrar todas as falhas, inclusive a do gate completo, sem deduzir exit code a partir de `tool:end.ok`.
- `verification` usa `{ revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`. Hashes são SHA256 reais do conteúdo, nunca nomes de fase/rótulos. Usar a regra de composição do hash exigida pelo schema/harness efetivo para múltiplos arquivos; não inventá-la.
- Resultados de validação/check: somente `passed`, `failed`, `pending`; `blocked` é estado de tarefa, não resultado de check. `passed` exige exitCode 0; `failed` exige inteiro diferente de 0; `pending` não aceita exitCode.
- Checks vazios, falta de resultado vigente, tarefa manual pendente ou falha vigente impedem declarar validação integral. Atualização do conteúdo exige reavaliar quais checks continuam válidos.
- Registro é rastreabilidade autodeclarada: não prova execução nativa, não detecta verificações omitidas nem substitui artefatos observados e aceite real.
- Tarefas assíncronas devem aguardar conclusão/mudança com limite e recuo, sem polling repetitivo sem informação nova. Cancelamento mantém resultados parciais e pendências.

## 7. Revisão final do plano

- Pedido coberto: quatro frontends investigados; dez novos componentes nomeados e fundamentados; nenhum input proposto.
- Mudança versus preservação separados: biblioteca recebe UI reutilizável; apps, persistência e comportamentos existentes não mudam.
- Dependências críticas verificadas por leitura: preview, Markdown, progresso, resolver/build, clipboard e versões. Limitações explícitas para Pinia, virtualização e aceite nativo.
- Cada tarefa tem arquivos/resultados, dependências e matriz de teste/revisão/manual. Não há execução entre microalterações nem aprovação de checks não realizados.
- Escrita desta sessão limitada a `spec.md`, `plan.md` e notificações autorizadas. Não foi criado registro de execução.
- Nenhum commit, merge, push, troca de branch, publicação ou implementação autorizado por este documento durante Plan.

Próximo passo humano: revisar a seleção e os limites propostos. Implementação somente em etapa Execute autorizada.
