# Overlays acessam document durante renderização SSR

## Resumo
Quatro componentes executam watchers `immediate` durante `setup` e acessam `document` mesmo quando fechados. Renderização server-side falha antes de produzir HTML/hidratar.

## Severidade e prioridade
**Alta / P1.** Qualquer import/render desses componentes em SSR pode abortar a página.

## Evidências
- `MaxDrawer.vue:194-218`: ramo fechado imediato chama `document.removeEventListener` em 212; aberto usa `document` em 202.
- `MaxModal.vue:234-255`: watcher imediato acessa `document` em 240/247.
- `MaxPdfView.vue:90-106`: acesso em 93/100.
- `MaxPopoverConfirm.vue:83-91`: acesso em 86/89.
- `useFocusTrap.ts:48-58`: `activate()` usa `document.activeElement` e `HTMLElement` sem guard.
- Não há teste com `createSSRApp`/`renderToString`; busca em `tests/` não encontra cobertura SSR.

## Afetados
`MaxDrawer`, `MaxModal`, `MaxPdfView`, `MaxPopoverConfirm`, `useFocusTrap` e apps Nuxt/Vite SSR.

## Causa-raiz
Registro/remoção de listeners e foco está no watcher de setup sem fronteira browser-only. Outros helpers (`useScrollLock`) têm guard, mas o contrato não foi centralizado.

## Impacto
`ReferenceError: document is not defined` em renderização no servidor, inclusive com overlay inicialmente fechado.

## Reprodução
Renderizar cada componente com `createSSRApp` + `renderToString` em Node, fornecendo Pinia quando necessário.

## Direção de correção
Centralizar guards em helper browser-safe, registrar efeitos DOM após mount e tornar trap/listener idempotentes; adicionar suíte SSR.

## Critérios de aceite
- Todos renderizam em Node abertos e fechados sem acessar DOM global.
- Hidratação mantém listener, foco e scroll lock no cliente.
- Testes SSR cobrem os quatro.

## Contraevidências consideradas
Callbacks `onMounted` e helpers com `typeof document` são seguros; não foram incluídos. A existência de happy-dom nos testes não simula ausência de DOM.
