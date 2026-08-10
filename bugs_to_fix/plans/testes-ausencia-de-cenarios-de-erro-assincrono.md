# Quase nenhum teste cobre falha assíncrona (promise rejeitada / `fetch` com erro)

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `tests/` (109 arquivos), `tests/stores/useIcon.Store.test.ts:88-106`, `tests/setup.ts:1-80`
- **Domínio:** docs-qualidade-testes

## Problema

Em **109 arquivos de teste**, apenas **4** contêm qualquer simulação de falha assíncrona
(`grep -rln "mockRejectedValue\|rejects\." tests/`):

- `tests/stores/useIcon.Store.test.ts`
- `tests/components/MaxInputFileProject.test.ts`
- `tests/components/MaxListBox.test.ts`
- `tests/setup.ts` (que é só o setup global, não uma suíte)

Ou seja: **3 suítes reais** cobrem caminho de erro assíncrono, em uma biblioteca cujo
`tests/setup.ts` mocka globalmente `fetch` e `indexedDB` — prova de que há bastante
código de rede e persistência.

O `useIcon.Store.test.ts` mostra como deveria ser feito. Ele é a referência de qualidade
do repositório nesse quesito:

- linhas 88-106: `mockRejectedValue(new Error('Network error'))` e verificação de que o
  ícone permanece em `'waiting'` e que `console.error` foi chamado;
- linhas 108-149: resposta bem-sucedida mas **sem o ícone pedido**, com contagem de
  retries até o limite;
- linhas 151-163: `localStorage` com JSON corrompido — `expect(...).not.toThrow()` e
  descarte do cache;
- linhas 190-232: backoff com `vi.useFakeTimers()`, verificando que o contador de erros
  reseta após 30s.

Componentes com I/O assíncrono evidente que **não** têm nenhum caso de falha:

- `tests/components/MaxInputAutoCompleteApi.test.ts` — o componente faz busca assíncrona
  via API com cache IndexedDB (conforme `status-primevue.migration.yaml:186`,
  *"busca assíncrona via API + cache IDB (getCachedApiIDB/keyExists)"*). Não há
  `mockRejectedValue` no arquivo.
- `tests/components/MaxInputCep.test.ts` — consulta de CEP; o
  `status-primevue.migration.yaml:28` cita ícone de loading, logo há requisição.
- `tests/components/MaxInputIconPicker.test.ts` — endpoints `/api/icons/picker` e
  `/api/icons/picker/svg` (documentados em `.superpowers-task-12-report.md`).
- `tests/helpers/cached.test.ts` — helper de cache; falha de `indexedDB` não coberta.
- `tests/components/MaxInputFileUpload.test.ts` e variantes — upload sem cenário de erro.

Nenhum teste cobre **quota excedida no `localStorage`** (`QuotaExceededError` no
`setItem`), embora o `useIconStore` persista um blob de ícones que só cresce — cenário
de falha realista em produção.

## Impacto

- **Caminho de erro é o menos testado e o mais visível para o usuário:** quando a API
  cai, o que aparece na tela é exatamente o comportamento não coberto. Um `catch`
  ausente vira tela branca ou spinner infinito.
- **Regressões silenciosas:** remover um `try/catch` ou um `.catch()` não faz nenhum
  teste falhar hoje, na maioria dos componentes.
- **Estados de loading presos:** o padrão `'waiting'` do `useIconStore` (que *é* testado)
  mostra que "ficar preso em carregando" é um risco concreto na base. Componentes com
  loading próprio não têm essa proteção.
- **Migração arriscada:** `MaxInputAutoCompleteApi` e `MaxInputIconPicker` são itens
  `alta` da fila (28 e 30 em `migration_executor.md:142,144`) e serão reescritos sem
  rede de segurança para o caminho de erro.

## Plano de correção

1. **Adotar o `useIcon.Store.test.ts` como modelo** e documentar no `CONTRIBUTING.md` a
   regra: *todo módulo que faz `fetch`, acessa `localStorage`/`indexedDB` ou retorna
   Promise deve ter ao menos um caso de rejeição.*
2. **Cobrir, por ordem de risco:**
   - `MaxInputAutoCompleteApi`: `fetch` rejeitado durante a busca → não deve lançar,
     deve encerrar o loading e não deve deixar sugestões obsoletas na tela;
   - `MaxInputCep`: consulta que falha e consulta que retorna CEP inexistente → estado
     `error`/`caution` correto e loading encerrado;
   - `MaxInputIconPicker`: `/api/icons/picker` fora do ar → lista vazia tratada, sem
     exceção;
   - `MaxInputFileUpload*`: upload rejeitado → progresso zerado e erro comunicado;
   - `tests/helpers/cached.test.ts`: `indexedDB` indisponível ou `open` rejeitado.
3. **Cobrir `QuotaExceededError`:** teste em que `localStorage.setItem` lança, garantindo
   que o `useIconStore` não quebre a aplicação (hoje o mock de `localStorage` está em
   `tests/setup.ts` e pode ser instrumentado para lançar).
4. **Padronizar o helper de asserção assíncrona.** As suítes atuais usam
   `await new Promise((r) => setTimeout(r, 250))` repetidamente
   (`useIcon.Store.test.ts:73,82,96,100,121,126,137,142,175,179`), o que é lento e
   sensível a timing. Preferir `vi.useFakeTimers()` + `advanceTimersByTimeAsync` — padrão
   que o próprio arquivo já usa corretamente nas linhas 190-232 — e extrair um helper
   compartilhado.
5. **Verificar que os `catch` silenciam de forma intencional:** em cada novo teste,
   assertar o efeito observável (estado, emit, mensagem), não apenas
   `expect(...).not.toThrow()`.

## Verificação

- `grep -rln "mockRejectedValue\|rejects\." tests/ | wc -l` sobe de 4 para cobrir todos
  os módulos com I/O assíncrono.
- Para cada novo caso, **teste de mutação:** remover o `try/catch` (ou o `.catch()`) do
  fonte correspondente e confirmar que o teste **falha**.
- Nenhum teste novo depende de `setTimeout` real; `npx vitest run` não fica mais lento de
  forma perceptível.
- `npx vitest run` verde ao final.
