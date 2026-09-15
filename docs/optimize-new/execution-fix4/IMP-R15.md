# Relatório de Implementação — IMP-R15 (Bloco R15/F22)

## Metadados do Subagente
- **Subagente:** `IMP-R15` (Grupo A de Implementação)
- **ID da Plataforma (Conversation ID):** `0b77f3fa-8c71-4588-9550-1c228a239dd6`
- **Parent ID:** `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Horário de Início:** 2026-09-15T09:27:57-03:00
- **Horário de Término:** 2026-09-15T09:45:00-03:00
- **Worktree Isolado:** `/home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-fix4`
- **Status:** CONCLUÍDO COM SUCESSO (36/36 testes passando, zero erros de lint e zero erros de tipo)

---

## 1. Contexto e Objetivos

O Bloco R15/F22 aborda os achados em `docs/optimize-new/ux/feedback-terminal-efemero-e-bloqueio-global-loading/` e `docs/optimize-new/ux/estados-assincronos-indistinguiveis-sem-recuperacao/`, especificamente na gestão de instâncias concorrentes no sistema centralizado de loading (`useLoadingStore`).

### Problema Anterior Identificado na Auditoria fix4
1. `start()` retornava `void`. Quem disparava uma operação assíncrona não recebia um identificador único de instância da sua própria operação.
2. Chamadas concorrentes de `start()` com a mesma chave lógica (`key`) sobrescreviam a mesma entrada na fila do target, destruindo instâncias paralelas e impedindo o controle independente entre instâncias A e B da mesma chave.
3. Não havia tipagem formal nem garantia de `LoadingHandle` opaco.
4. O encerramento por chave lógica não estava documentado nem formalizado de maneira determinística para quando múltiplas instâncias compartilham a mesma chave.
5. Faltava rastreamento de contadores de tentativas (`retryCount`), isolamento de timers de auto-dismiss em cenários concorrentes e garantias de cleanup sem vazamento de estado.

---

## 2. Mudanças Implementadas

### 2.1. Tipagens (`src/types/app.ts` e `src/types/asyncState.ts`)
- **Criação do tipo `LoadingHandle`**:
  ```typescript
  declare const LoadingHandleBrand: unique symbol;
  export type LoadingHandle = string & { readonly [LoadingHandleBrand]?: never };
  ```
- **Extensão de `LoadingItem`**:
  - `handle?: LoadingHandle`: handle opaco da instância individual.
  - `logicalKey?: string`: preservação da chave lógica original para agrupamento semântico.
  - `retryCount?: number`: contador de tentativas de retry executadas nesta instância.
  - `maxRetries?: number`: limite opcional de retries.
- Re-exportação canônica de `LoadingHandle` em `src/types/asyncState.ts` e `src/stores/useLoading.Store.ts`.

### 2.2. Implementação do `useLoadingStore` (`src/stores/useLoading.Store.ts`)
- **`start(item_loading: LoadingItem): LoadingHandle`**:
  - Gera chave sequencial opaca única `${pad(count)}.${logicalKey}` para cada chamada, mesmo com chave lógica idêntica.
  - Retorna o `LoadingHandle` exclusivo daquela chamada.
  - Registra o handle em `keys[logicalKey]` (permitindo que múltiplas instâncias compartilhem a mesma chave lógica) e em `keys_target[handle]`.
  - Inicializa `retryCount: item_loading.retryCount ?? 0`.
- **Resolução Determinística de Identificador (`resolveItems`)**:
  - **Precedência 1 (Handle Individual)**: Se o identificador existe em `keys_target` ou como item direto, opera **estritamente sobre aquela única instância**.
  - **Precedência 2 (Chave Lógica)**: Se for uma chave lógica, resolve determinística e simultaneamente **todas as instâncias ativas associadas a ela**.
- **`end(keyOrHandle, options)`**:
  - Se invocado com `LoadingHandle`, encerra apenas a instância correspondente. As demais instâncias da mesma chave lógica continuam em execução e `isPending()` permanece verdadeiro.
  - Se invocado com chave lógica, encerra determinística e simultaneamente todas as instâncias sob aquela chave.
  - Cancela o timer anterior individual e agenda o timer de auto-dismiss (`done_duration`) isolado para cada handle.
- **`error(keyOrHandle, errorOrMessage)`**:
  - Marca erro na instância individual ou em todas da chave lógica.
  - Preserva os metadados de erro e o callback `retry`.
- **`retry(keyOrHandle)`**:
  - Incrementa `retryCount` da instância individual e restaura status para `'loading'`.
  - Executa o callback `retry` individual cadastrado.
- **`dismiss(keyOrHandle)`**:
  - Descarta imediatamente a instância informada (ou todas da chave lógica), cancelando seus timers e liberando memória.
  - Sem argumentos, executa `reset()` completo.
- **`isPending(targetOrKeyOrHandle)`**:
  - Suporta verificação global, por target, por chave lógica ou por `LoadingHandle` individual.
- **Prevenção de Vazamento e Cleanup**:
  - Map de timers indexado individualmente por handle.
  - Limpeza no `onScopeDispose` (unmount / $dispose da store).
  - Reset automático do contador (`count.value = 0`) quando todas as filas de todos os targets forem esvaziadas.

---

## 3. Testes Automatizados e Evidências

### 3.1. Arquivo de Testes (`tests/stores/useLoading.Store.test.ts`)
A suíte foi expandida para **36 testes automatizados**, incluindo casos focais para:
1. `start()` retornando handle opaco e registrando instâncias concorrentes com mesma chave lógica.
2. `end(handle)` operando exclusivamente sobre a instância individual disparada e mantendo instâncias concorrentes ativas.
3. `isPending(handle)` e `isPending(logicalKey)` refletindo adequadamente o estado parcial das instâncias.
4. `end(chaveLogica)` encerrando de forma determinística todas as instâncias associadas à chave.
5. Concorrência de timers independentes com diferentes durações de auto-dismiss (`done_duration`) sob a mesma chave lógica.
6. `retry(handle)` incrementando `retryCount` e executando o callback de retry apenas daquela instância.
7. `dismiss(handle)` descartando imediatamente a instância individual sem afetar outras instâncias concorrentes da mesma chave.
8. Ausência de vazamento de estado após ciclos de execução concorrente (`keys`, `keys_target`, `targets.items` e `count` limpos).

### 3.2. Comandos e Resultados
- **Testes Unitários:**
  ```bash
  npx vitest run tests/stores/useLoading.Store.test.ts
  ```
  **Resultado:** 36/36 testes aprovados (100%).
- **Testes de Componentes Dependentes:**
  ```bash
  npx vitest run tests/components/MaxLoadScreen.test.ts tests/components/MaxLoadScreenTarget.test.ts
  ```
  **Resultado:** 21/21 testes aprovados (100%).
- **Checagem de Tipagem TypeScript:**
  ```bash
  npm run type-check
  ```
  **Resultado:** Código de saída 0 (zero erros de tipo).
- **ESLint nos Arquivos Modificados:**
  ```bash
  npx eslint src/stores/useLoading.Store.ts tests/stores/useLoading.Store.test.ts src/types/app.ts src/types/asyncState.ts
  ```
  **Resultado:** Código de saída 0 (zero warnings e zero erros).

---

## 4. Análise de Riscos e Rollback
- **Compatibilidade Retroativa:** Totalmente preservada. Consumidores que invocam `end('chaveLogica')` ou `start({ key: 'chaveLogica' })` sem capturar o retorno continuam funcionando normalmente.
- **Rollback:** Caso seja necessário reverter, restaurar os 4 arquivos modificados via git checkout:
  `git checkout HEAD -- src/stores/useLoading.Store.ts src/types/app.ts src/types/asyncState.ts tests/stores/useLoading.Store.test.ts`.
