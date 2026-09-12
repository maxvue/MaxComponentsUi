# Plano de implementação — drenar fila e ordenar respostas do icon picker

## Objetivo e resultado

Drenar todos os SVGs pendentes em lotes de até 200 e impedir respostas antigas de alterarem catálogo/loading atual. Unmount deve cancelar timers e requisições.

## Escopo e fora de escopo

- Separar enqueue de scheduler/drain.
- Adicionar identidade/abort para catálogo e validar HTTP.
- Preservar sanitização, cache, debounce e endpoints.
- Não implementar virtualização, tratada em achado próprio.

## Arquivos

- Alterar `src/components/MaxInputIconPicker.vue`.
- Alterar `tests/components/MaxInputIconPicker.test.ts` e/ou `tests/unit/MaxInputIconPicker.spec.ts` conforme contratos existentes.

## Dependências e ordem

1. Criar testes com Promises/fake timers.
2. Refatorar fila.
3. Proteger fetch de catálogo/loading.
4. Testar unmount/erros/integração com virtualização.

## Passos

1. Fazer `enqueueSvgFetch` apenas deduplicar nomes e chamar `scheduleDrain`.
2. `scheduleDrain` cria no máximo um timer; `drain` retira 200, processa e reagenda diretamente enquanto houver backlog.
3. Definir política de uma requisição de SVG por vez, retries limitados e estado dos itens que falharam.
4. Validar `res.ok` e shape antes de sanitizar; erro não é JSON válido/cache.
5. Para catálogo, abortar request anterior e manter generation id. Só a geração atual altera `curatedIcons`/`isLoading` e executa preload.
6. No unmount/fechamento conforme política, cancelar debounce/timer, abortar controllers e impedir reschedule tardio.
7. Evitar que `finally` antigo desligue loading atual.

## Migração e compatibilidade

Sem mudança de props/emits. Ordem visual passa a corresponder à consulta mais recente. AbortController requer fallback apenas se navegadores suportados não o tiverem; generation id continua obrigatório.

## Testes

- 201/401 nomes geram 2/3 lotes sem novo estímulo; nenhum lote excede 200.
- Duplicados/cache não entram na fila.
- Respostas `abc` antes de `ab` mantêm `abc` e loading correto.
- HTTP 4xx/5xx, JSON inválido, reject e unmount não alteram estado atual.
- Integração com scroll rápido garante eventual drenagem.
- A11y: estados loading/vazio atuais não regredirem; benchmark conta requests, não tempo.

## Aceite

Todos os pendentes são processados exatamente uma vez por ciclo, resposta obsoleta nunca escreve, somente request atual controla loading, unmount zera timers/fila e aborta fetches, e testes focados passam.

## Riscos e rollback

Retry infinito ou concorrência pode sobrecarregar API; limitar e serializar. Abort pode ser confundido com erro; tratá-lo silenciosamente apenas para geração antiga. Rollback restaura scheduler anterior somente atrás de limite temporário menor que 200; proteção de geração deve permanecer.

## Validação final

Fake timers/Promises diferidas, testes focados, inspeção de requests, suíte, type-check, lint e `git diff --check`.
