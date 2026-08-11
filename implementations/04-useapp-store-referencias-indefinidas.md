# 04 — useApp.Store.ts e useLogin.Store.ts: stores órfãs que não compilam

**Severidade:** Crítica
**Categoria:** Bug / Código órfão
**Arquivos:** `src/stores/useApp.Store.ts:1-99`, `src/stores/useLogin.Store.ts`

## Problema

`useApp.Store.ts` usa `user`, `loading`, `version`, `useWindowSize`, `useBreakpoints`, `useChatSettingsStore`, `useRefCached`, `UseWindowSizeReturn` — **nenhum importado**. Qualquer chamada a `useSystemStore()` lança `ReferenceError`. O arquivo não compila sob checagem estrita e está excluído do tsconfig (por isso `vue-tsc` passa silenciosamente). Não é exportado em `src/stores/index.ts`.

`useLogin.Store.ts` está na mesma situação (código específico de app consumidor).

## Correção sugerida

Remover os dois arquivos da lib. Se houver intenção de mantê-los, completar os imports, incluí-los no tsconfig e exportá-los deliberadamente no barrel.
