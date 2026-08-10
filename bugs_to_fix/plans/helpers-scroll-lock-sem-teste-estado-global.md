# `useScrollLock()` não tem teste e mantém estado global sem reset

- **Categoria:** falta-de-teste
- **Severidade:** alta
- **Arquivo(s):** `src/helpers/useScrollLock.ts:19-43`
- **Domínio:** helpers-composables

## Problema

Não existe `tests/helpers/useScrollLock.test.ts`. O helper mantém dois estados **no escopo do módulo**, deliberadamente compartilhados entre todas as instâncias:

```ts
// src/helpers/useScrollLock.ts:19-22
let lock_count = 0;
let previous_overflow = '';
```

O comentário das linhas 6-18 explica bem o porquê do compartilhamento. O problema é o que ele não cobre:

1. **Não há função de reset.** Módulos ES são avaliados uma vez e cacheados — o próprio comentário afirma isso na linha 9. Em um arquivo de testes, um caso que chame `lock()` sem `unlock()` corrompe todos os casos seguintes, e não há como restaurar. Compare com `src/helpers/maxAppConfig.ts:49`, que expõe `resetMaxAppConfig()` exatamente para "isolar um caso do outro" nos testes.
2. **`unlock()` a mais é silenciosamente engolido** (linha 37: `if (lock_count === 0) return;`), mascarando pareamento incorreto no chamador em vez de sinalizar.
3. **`previous_overflow` pode ficar obsoleto.** Ele é capturado apenas quando `lock_count === 0` (linha 31). Se código externo alterar `document.body.style.overflow` enquanto um lock está ativo, o `unlock()` final (linha 39) restaura um valor antigo, sobrescrevendo a alteração externa.
4. **Só o `overflow` é travado.** Em iOS Safari, travar `overflow` no `body` notoriamente não impede o scroll; a técnica usual envolve `position: fixed` + preservação de `scrollY`. Nenhum comentário registra essa limitação.

O único consumidor hoje é `MaxDrawer.vue` (linha 115), que faz o pareamento corretamente com a flag `has_scroll_lock` (`MaxDrawer.vue:175`, `:196-199`, `:203-208`) — inclusive no `onBeforeUnmount`. Ou seja, o consumidor está certo; o helper é que não tem rede de segurança própria.

## Impacto

Sem teste, uma regressão no contador (ex.: alguém "simplificando" `lock()` para não contar) restauraria o scroll da página com um drawer ainda aberto — bug visual difícil de rastrear e que só aparece com dois overlays simultâneos. Sem reset exportado, escrever esse teste é atualmente impossível de forma isolada.

## Plano de correção

1. Exportar um `resetScrollLock()` (padrão já estabelecido por `resetMaxAppConfig` em `src/helpers/maxAppConfig.ts:49`) marcado como uso de teste, zerando `lock_count` e `previous_overflow`.
2. Criar `tests/helpers/useScrollLock.test.ts` cobrindo: lock único aplica `overflow: hidden`; unlock único restaura o valor anterior; dois locks e um unlock mantêm travado; segundo unlock destrava; unlock sem lock prévio é no-op; valor de `overflow` pré-existente (`'auto'`) é preservado e restaurado.
3. Avaliar emitir `console.warn` em `unlock()` desbalanceado, em vez de retorno silencioso.
4. Registrar em comentário a limitação conhecida do iOS Safari, ou implementar a técnica `position: fixed`.

## Verificação

- Testes a criar/ajustar: `tests/helpers/useScrollLock.test.ts` (novo), com `beforeEach(resetScrollLock)`
- Comandos: `npx vitest run tests/helpers/useScrollLock.test.ts`, `npm run type-check`, `npm run lint`
