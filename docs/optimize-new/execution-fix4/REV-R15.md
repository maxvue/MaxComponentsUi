# Relatório de Refutação Independente — REV-R15 (Bloco R15/F22)

## Metadados do Subagente
- **Subagente:** `REV-R15` (Grupo B de Refutação Independente)
- **ID da Plataforma (Conversation ID):** `d3ec7750-500e-4139-b685-7cefe8d16215`
- **Parent ID:** `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Horário de Início:** 2026-09-15T09:48:16-03:00
- **Horário de Término:** 2026-09-15T09:55:30-03:00
- **Worktree Auditado:** `/home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-fix4`
- **Veredito:** **ACEITO**

---

## 1. Escopo Auditado e Requisitos de R15/F22

Conforme especificado em `docs/optimize-new/instructions_to_implementation_fix4.md` (Etapa 8 — R15):
- `start()` deve retornar um handle opaco identificador da instância individual da operação (`LoadingHandle`).
- `end(handle)`, `retry(handle)` e `dismiss(handle)` devem operar estritamente sobre aquela única instância, permitindo controlar instâncias concorrentes A e B independentemente mesmo quando compartilham a mesma chave lógica.
- A compatibilidade de chamadas por chave lógica (`end(chaveLogica)`) deve ser explícita e determinística: deve encerrar todas as instâncias associadas àquela chave.
- Rastreamento de ciclos de retry (`retryCount`), isolamento de timers de auto-dismiss em cenários concorrentes, ausência de vazamento de memória e cleanup no descarte de escopo (`onScopeDispose`).

---

## 2. Metodologia Adversarial de Testes

Para auditar e desafiar a implementação realizada por `IMP-R15`, foram desenhados e executados 5 cenários de teste adversariais extremos:

1. **Concorrência em massa com 50 handles sob a mesma chave lógica:**
   - Disparo simultâneo de 50 instâncias compartilhando a mesma chave lógica `'concurrency.bulk.job'`.
   - Validação da unicidade estrita dos 50 `LoadingHandle` gerados (`Set(handles).size === 50`).
   - Encerramento individual em ordem pseudo-aleatória / embaralhada.
   - Verificação em cada passo de que apenas o handle fechado transita para `'done'`, enquanto `isPending('concurrency.bulk.job')` e `isPending()` global permanecem `true` enquanto restar pelo menos 1 instância ativa.
   - Ao encerrar a 50ª instância, `isPending()` transita imediatamente para `false`.
   - Avanço de timers e validação do esvaziamento completo (`targets.body.items === {}`, `keys === {}`, `keys_target === {}`, `items === []`).

2. **Auto-dismiss com 50 durações divergentes e timers concorrentes sem vazamento:**
   - 50 instâncias iniciadas sob a mesma chave lógica com `done_duration` escalonadas de 100ms a 5000ms.
   - Encerramento simultâneo de todas as 50 instâncias.
   - Avanço progressivo dos timers passo a passo (100ms por 100ms), comprovando que cada item é removido do DOM exatamente na janela de sua própria duração sem interferir ou deletar precocemente os itens vizinhos.
   - Verificação de limpeza total de timers no `doneTimers` após a conclusão.

3. **Compatibilidade de chamada por chave lógica vs handle opaco:**
   - Disparo concorrente de 10 handles da chave `'modulo.exportacao.pdf'` e 10 handles da chave `'modulo.exportacao.xlsx'` (20 itens totais).
   - Encerramento seletivo de 1 handle da chave B: apenas aquele handle transita para `'done'`, os outros 9 continuam `'loading'`.
   - Encerramento de TODAS as instâncias da chave A via chamada determinística `store.end('modulo.exportacao.pdf')`.
   - Validação de que todas as instâncias de A transitaram para `'done'`, enquanto as instâncias de B permaneceram inalteradas e operacionais.

4. **Chave lógica complexa com múltiplos separadores (`.` e `-`):**
   - Chave `'auth.v2.oauth.google-login.session.init'`.
   - Comprovação de que a anatomia da chave interna (`0000.auth.v2.oauth...`) não quebra nem trunca nomes que possuem pontos em sua estrutura semântica.

5. **Ciclo concorrente de error, retry com callback e dismiss seletivo:**
   - Disparo de múltiplos workers concorrentes com callbacks de retry individuais.
   - Chamada `store.error(handle)` seguida de `store.retry(handle)` seletivo.
   - Comprovação de que apenas o callback daquela instância específica foi invocado, com incremento de `retryCount` exclusivo daquela instância e restauração de status `'loading'`.

---

## 3. Evidências dos Testes e Comandos Executados

### 3.1. Testes Adversariais Focais
```bash
npx vitest run tests/stores/adversarial-r15.test.ts
```
**Resultado:**
```text
 ✓ tests/stores/adversarial-r15.test.ts (5 tests) 93ms
   ✓ Adversarial Tests — Bloco R15/F22 (useLoadingStore) (5)
     ✓ adversarial 1: concorrência em massa com 50 handles sob a mesma chave lógica 49ms
     ✓ adversarial 2: auto-dismiss com 50 durações divergentes e timers concorrentes sem vazamento 34ms
     ✓ adversarial 3: compatibilidade de chamada por chave lógica vs handle opaco 6ms
     ✓ adversarial 4: chave lógica complexa com múltiplos separadores de ponto e traço 1ms
     ✓ adversarial 5: ciclo concorrente de error, retry com callback e dismiss seletivo 2ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### 3.2. Suíte Canônica do Store e Componentes Dependentes
```bash
npx vitest run tests/stores/useLoading.Store.test.ts tests/components/MaxLoadScreen.test.ts tests/components/MaxLoadScreenTarget.test.ts tests/ux/asyncStatesRecovery.test.ts
```
**Resultado:**
```text
 ✓ tests/stores/useLoading.Store.test.ts (36 tests) 54ms
 ✓ tests/components/MaxLoadScreenTarget.test.ts (8 tests) 76ms
 ✓ tests/components/MaxLoadScreen.test.ts (13 tests) 94ms
 ✓ tests/ux/asyncStatesRecovery.test.ts (6 tests) 713ms

 Test Files  4 passed (4)
      Tests  63 passed (63)
```

### 3.3. Type-check (TypeScript)
```bash
npm run type-check
```
**Resultado:** Código de saída 0 (zero erros de tipagem com vue-tsc).

### 3.4. ESLint
```bash
npx eslint src/stores/useLoading.Store.ts tests/stores/useLoading.Store.test.ts src/types/app.ts src/types/asyncState.ts
```
**Resultado:** Código de saída 0 (zero warnings, zero erros).

---

## 4. Análise de Causa Raiz e Conclusão

A implementação do bloco R15/F22 em `src/stores/useLoading.Store.ts`:
1. Respeitou integralmente a semântica de handles opacos (`LoadingHandle`) tipados por branded type (`unique symbol`).
2. Garante isolamento estrito entre instâncias concorrentes com a mesma chave lógica em todas as operações (`start`, `end`, `error`, `retry`, `dismiss`).
3. Preserva compatibilidade determinística com código existente que utiliza encerramento por chave lógica.
4. Não vaza timers, não vaza memória e gerencia ciclos de auto-dismiss de forma robusta e independente.

**Veredito Oficial:** **ACEITO**
