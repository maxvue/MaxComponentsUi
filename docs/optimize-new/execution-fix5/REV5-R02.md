# REV5-R02 — refutação independente final

- Agente real: `/root/rev5_r02_final`
- Parent ID: `/root`
- Início: `2026-09-15T17:53:00-03:00`
- Fim: `2026-09-15T18:14:19-03:00`
- HEAD solicitado no início: `f6b506641b6834d1d609b1441be75647802c7a8f`
- HEAD observado ao encerrar: `d12d4571799e97ca286f86fa716ce29b80709aaf`
- Referência adversarial: `aac16bca`
- Modo: somente leitura, exceto este relatório e a linha deste papel na matriz.

## Escopo e inspeção do lifecycle

R02 exige eliminar a origem do `AbortError` do happy-dom, rejeitar warnings/errors tardios mesmo sob `vi.spyOn`, e obter duas suítes e duas coberturas completas, limpas e aprovadas.

O mecanismo atual em `tests/helpers/consolePolicy.ts` aguarda um turno nativo (`setImmediate`) no `afterEach` antes de chamar `verifyConsoleClean()`. Ele também registra chamadas feitas por spies de `console.warn`/`console.error` e monitora `unhandledRejection` e `uncaughtException`. O caso `tests/core/warningTrap.test.ts` inclui emissão no `afterEach` do próprio caso, logo há cobertura direta de uma emissão posterior ao corpo do teste.

Isso é evidência favorável à proteção de teardown, mas não substitui os quatro gates globais limpos. Além disso, o worktree foi alterado e o HEAD avançou durante a repetição; portanto, os resultados abaixo são evidência de reprovação, não uma alegação de aprovação de um snapshot imutável.

## Quatro execuções globais serializadas

Cada processo foi aguardado até terminar. A primeira suíte começou enquanto ainda havia uma execução focal de arquitetura no mesmo worktree; por rigor, ela não é prova de isolamento. A segunda suíte e as duas coberturas foram iniciadas sem outro Vitest no worktree `wt-optimize-fix5`.

| Rodada | Resultado | Falhas | Saída proibida R02 |
| --- | --- | --- | --- |
| `npm run test` #1 | código 1; 241/242 arquivos, 3.709/3.710 testes; não conta como isolada | `runtimeDependencies.test.ts`: `@tiptap/extension-link` sem import/exceção | nenhuma ocorrência de `AbortError`, `EPROTO`, `DOMException`, `Unhandled` ou `[Vue warn]` |
| `npm run test` #2 | código 1; 241/242 arquivos, 3.709/3.710 testes | mesma falha de dependência | nenhuma ocorrência dos padrões acima |
| `npm run test:coverage` #1 | código 1; 240/242 arquivos, 3.708/3.710 testes | dependência e `MaxUserAvatar.test.ts`/diretiva tooltip | nenhuma ocorrência dos padrões acima; não houve relatório de cobertura aprovável após a falha |
| `npm run test:coverage` #2 | código 1; 240/242 arquivos, 3.708/3.710 testes | mesmas duas falhas | nenhuma ocorrência dos padrões acima; não houve relatório de cobertura aprovável após a falha |

Os logs de trabalho estão em `/tmp/rev5-r02-suite-{1,2}.log` e `/tmp/rev5-r02-coverage-{1,2}.log` neste ambiente. A repetição confirma que as falhas não são o `AbortError` originalmente associado a R02, mas ainda viola o requisito explícito de quatro execuções globais limpas.

## Veredito

**REJEITADO.** A defesa contra warning/error tardio possui evidência focal e as quatro execuções não exibiram os padrões assíncronos proibidos, porém nenhuma das quatro terminou com código zero. Enquanto `runtimeDependencies.test.ts` e `MaxUserAvatar.test.ts` falharem, R02 não pode ser aceito: o requisito não permite trocar quatro execuções globais limpas por evidência parcial de ausência de `AbortError`.

## Revalidação após remover as dependências Tiptap diretas

- Data: `2026-09-15T18:21:11-03:00`
- HEAD: `d12d4571799e97ca286f86fa716ce29b80709aaf` com alterações ainda não commitadas para remover `@tiptap/extension-link` e `@tiptap/extension-underline` de `package.json` e do lockfile.
- Isolamento: nenhum processo `vitest` ou `vite-node` concorrente foi encontrado antes da execução.

| Rodada | Resultado | Falha | Saída proibida R02 |
| --- | --- | --- | --- |
| `npm run test` #3 | código 1; 241/242 arquivos, 3.709/3.710 testes; 230,57 s | somente `tests/components/MaxUserAvatar.test.ts` | nenhuma ocorrência de `AbortError`, `EPROTO`, `DOMException`, `Unhandled` ou `[Vue warn]` |

A remoção corrigiu a falha de `runtimeDependencies.test.ts`. A falha restante não é um warning em runtime: o teste injeta uma diretiva global `tooltip` como `vi.fn`, enquanto `MaxUserAvatar.vue` passou a importar e registrar a diretiva localmente; a diretiva injetada, portanto, não é chamada. Sem uma suíte limpa, as rodadas restantes exigidas (segunda suíte e duas coberturas) não foram executadas, para não produzir uma alegação de aprovação indevida.

**Veredito da revalidação: REJEITADO.** A ausência dos padrões assíncronos proibidos é mantida, mas R02 continua sem quatro execuções globais limpas. A correção necessária é alinhar a asserção de `MaxUserAvatar.test.ts` ao registro local efetivamente usado, preservando a verificação de `showTooltip`; ela está fora do escopo somente-leitura desta refutação.

## Revalidação integral após alinhar a diretiva tooltip

- Data: `2026-09-15T18:48:51-03:00`
- HEAD: `d12d4571799e97ca286f86fa716ce29b80709aaf`, com as mudanças pendentes de tooltip e dependências Tiptap presentes no worktree.
- Isolamento: as duas suítes e as duas coberturas abaixo foram iniciadas sem outro `vitest` ou `vite-node` no worktree `wt-optimize-fix5`; cada processo terminou antes do seguinte começar.

| Rodada válida | Resultado | Duração | Saída proibida R02 |
| --- | --- | --- | --- |
| `npm run test` #1 | código 0; 242/242 arquivos; 3.710/3.710 testes | 225,51 s | ausente: `AbortError`, `EPROTO`, `DOMException`, `Unhandled`, `[Vue warn]` |
| `npm run test` #2 | código 0; 242/242 arquivos; 3.710/3.710 testes | 238,42 s | ausente: mesmos padrões |
| `npm run test:coverage` #1 | código 0; 242/242 arquivos; 3.710/3.710 testes | 277,62 s | ausente: mesmos padrões |
| `npm run test:coverage` #2 | código 0; 242/242 arquivos; 3.710/3.710 testes | 277,60 s | ausente: mesmos padrões |

As duas coberturas válidas tiveram as mesmas métricas: statements 86,83% (11.276/12.985), branches 78,10% (8.757/11.212), functions 87,57% (2.376/2.713) e lines 90,19% (9.631/10.678). Os logs preservados são `/tmp/rev5-r02-final-suite-{1,2}.log` e `/tmp/rev5-r02-final-coverage-{2,4}.log`.

Uma cobertura anterior foi deliberadamente descartada porque outro Vitest estava ativo em outro repositório; outra foi descartada porque `tests/browser/motionReduced.browser.ts` iniciou no mesmo worktree depois do seu disparo. Nenhuma foi usada como evidência de aceite.

**Veredito final da revalidação: ACEITO.** A correção do ciclo de vida e a política de console mantêm a ausência dos padrões assíncronos proibidos, e o requisito de duas suítes mais duas coberturas globais, seriais e limpas foi satisfeito no estado atual.
