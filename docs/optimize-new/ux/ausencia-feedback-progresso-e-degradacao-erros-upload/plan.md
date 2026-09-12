# Plano de implementação — upload com progresso e retry

## Objetivo e resultado

Modelar `MaxInputFileUpload` com estados explícitos `idle/selected/uploading/success/error`, progresso real e erro persistente. Falha preserva arquivos/contexto para retry ou dispensa deliberada.

## Escopo e fora de escopo

- Integrar seleção, transporte e feedback numa única máquina de estado.
- Expor progresso, retry, cancelamento e mensagens acessíveis.
- Preservar XHR, eventos e drop.
- Não alterar uploads Project/Big nem protocolo do backend.

## Arquivos

- Alterar `src/components/MaxInputFileUpload.vue` e `tests/components/MaxInputFileUpload.test.ts`.
- Alterar tipos/documentação de props, emits e slots de estado.
- Criar helper de estado somente se houver reuso real.

## Dependências e ordem

1. Fixar transições em testes com XHR falso.
2. Implementar estado/progresso.
3. Implementar erro/retry/cancel.
4. Validar acessibilidade e concorrência.

## Passos

1. Substituir booleans ambíguos por estado discriminado, mantendo computeds de compatibilidade.
2. Ao selecionar, guardar arquivos; só marcar uploading após URL/validação pronta.
3. Ligar `xhr.upload.onprogress`, calcular percentual apenas com `lengthComputable` e expor bytes.
4. Erro HTTP/rede/parse passa a `error` persistente sem limpar `files`.
5. Adicionar ações retry/dispensar/remover; retry reutiliza snapshot e cria novo XHR.
6. Cancelar request anterior/unmount e ignorar callbacks obsoletos por attempt id.
7. Em sucesso, atualizar modelo e limpar seleção conforme política documentada.
8. Renderizar `progressbar` com `aria-valuenow` ou estado indeterminado e região live sem anunciar cada byte.
9. Abrir feedback antes de trabalho assíncrono e manter drop operável durante estados permitidos.

## Migração e testes

Eventos atuais permanecem; adicionar `progress`/`retry` de forma aditiva. Remover limpeza automática de 3 s é mudança UX intencional. Unitários cobrem progress computável/indeterminado, 2xx, HTTP, rede, parse, retry/cancel/unmount e arquivos preservados; integração teclado/axe cobre ações/announcements. Benchmark mede frequência de updates e limita render a frames/percentuais.

## Aceite

Progresso real visível/anunciado; erro persiste; arquivos sobrevivem à falha; retry envia mesmos arquivos; callbacks antigos não mudam tentativa atual; XHR aborta no unmount; testes passam.

## Riscos e rollback

Progress muito frequente causa renders; limitar por rAF/percentual. Retry pode duplicar upload após resposta tardia; usar attempt id/abort. Rollback pode manter nova máquina com UI simples, nunca voltar a apagar erro/arquivos automaticamente.

## Validação final

Testes XHR focados, throttle manual, teclado/leitor, suíte, type-check, lint e `git diff --check`.
