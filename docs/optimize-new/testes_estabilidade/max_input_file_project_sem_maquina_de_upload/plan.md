# Plano de implementação — máquina de upload do MaxInputFileProject

## Objetivo e resultado esperado

Unificar dialog e drop numa ingestão imutável e controlar cada arquivo por identidade/estado (`queued`, `uploading`, `succeeded`, `failed`). Cada tentativa envia um arquivo no máximo uma vez, permite retry e é cancelada no unmount.

## Escopo e fora de escopo

- Escopo: normalização, estado interno, auto/manual upload, eventos, erro/retry, cancelamento e URLs locais.
- Fora: upload resumível/chunked, persistência offline, processamento de IA ou mudança do endpoint/formato FormData sem contrato.

## Arquivos-alvo

- `src/components/MaxInputFileProject.vue`.
- `src/types/index.ts` para tipos públicos de estado/eventos, se exportados.
- `tests/components/MaxInputFileProject.test.ts`.
- `COMPONENTS.md` para alinhar props, métodos e eventos reais.

## Dependências e ordem

1. Fixar contrato de eventos e identidade com testes.
2. Extrair ingestão/normalização imutável.
3. Implementar scheduler por estado e Promise pública.
4. Ligar drop/dialog, retry e cancelamento.
5. Validar URLs e documentação.

## Passos detalhados

1. Criar `ingestFiles(File[])` usado por `onChange` e `onDrop`; ignorar vazio/disabled e emitir `files-selected` uma vez com o mesmo payload.
2. Normalizar cada entrada numa cópia, nunca escrever em `props.files` nem nos objetos do pai. Para `File`, preservar o Blob original, nome/tipo/extensão e gerar ID estável.
3. Manter estados em mapa interno por ID. Entradas do servidor começam concluídas; novas começam enfileiradas.
4. Substituir o watcher de contagem por scheduler que seleciona somente `queued`, marca `uploading` antes do POST e registra IDs da tentativa.
5. Fazer `sendFile` retornar `Promise`, aceitar lote/IDs opcionais e nunca incluir itens já `uploading`/`succeeded`.
6. Criar um `AbortController` por request e passá-lo ao Axios; no sucesso marcar apenas o lote correspondente, emitir sucesso e impedir reenvio. Na falha marcar `failed`, preservar arquivos e emitir erro com IDs.
7. Expor retry que move somente falhas selecionadas para fila; chamadas concorrentes compartilham/ignoram IDs em voo.
8. Guardar/revogar URLs apenas das cópias internas criadas pelo componente, inclusive remoção e unmount. Abort no unmount não publica estado tardio.
9. Tornar leitura de CSRF browser-safe e preservar headers/serialização de `uploadData`.

## Migração e compatibilidade

- Manter props `files`, `auto`, `url`/`route`/`uploadRoute`, `uploadData` e `buttons`.
- Preservar `sendFile` exposto, agora aguardável; callbacks que ignoram retorno continuam funcionando.
- Alinhar documentação hoje divergente e adicionar eventos de ciclo somente de forma aditiva.
- Mudanças externas em `props.files` são reconciliadas por ID sem perder uploads em voo nem mutar o pai.

## Testes pertinentes

- Capturar `onDrop` real no mock e provar equivalência com file dialog/eventos.
- Adicionar A e, antes de resolver, B: POST A uma vez e POST B uma vez; nenhum request contém A novamente.
- Cobrir sucesso, falha, retry seletivo, duplo retry, auto=false/manual e endpoint ausente.
- Afirmar imutabilidade profunda das entradas relevantes e ciclo exato de Object URLs.
- Desmontar com request pendente: signal abortado e zero emits/mutações posteriores.
- A11y: drop zone/click/teclado permanecem alcançáveis e estados/erros são anunciados conforme plano de feedback global.
- Benchmark: `k` alterações enquanto A está em voo não aumentam uploads de A; contagem, não tempo, bloqueia CI.

## Critérios de aceite

- Dialog e drop passam pela mesma função e emitem o mesmo contrato.
- Cada ID aparece em no máximo um request ativo e um sucesso por tentativa.
- Objetos recebidos em `props.files` permanecem estruturalmente iguais.
- Falha preserva arquivo e retry envia apenas IDs falhos.
- Unmount aborta todos os requests e revoga todas as URLs próprias.
- Testes focados, type-check, suíte e build passam.

## Riscos, rollback e validação final

- Riscos: identidade instável em atualização do pai, resposta em lote sem mapeamento e duplicação entre scheduler/manual. Mitigar com ID canônico e única fila.
- Rollback: desativar auto-scheduler mantendo ingestão imutável e `sendFile` manual; não voltar a mutar props.
- Validar concorrência com promises controladas, drop/dialog, retry, cancelamento, URLs, SSR, documentação e build.
