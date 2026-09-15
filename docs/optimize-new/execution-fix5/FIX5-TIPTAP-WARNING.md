# Correção do warning Tiptap no Markdown

- **Papel:** correção focal do `GATE5-OVERLAYS-FOCUS`
- **Agente:** `/root/fix5_tiptap_warning`
- **Data:** `2026-09-15T17:45:00-03:00`
- **HEAD de partida:** `cabb5d710f452a8a27e34d92210a28261491f8ac`

## Reprodução e causa-raiz

O cenário Chromium real de `MaxFocusStack` monta `MaxInputMarkdown` dentro de
`MaxPopover`. Antes da correção, essa montagem emitia:

```text
[tiptap warn]: Duplicate extension names found: ['link', 'underline'].
```

O `StarterKit` v3 já inclui `Link` e `Underline`. O componente também os
adicionava diretamente à lista de extensões; portanto havia duas instâncias de
cada extensão. Não era um aviso do runner nem uma condição a ser silenciada.

## Correção

`MaxInputMarkdown.vue` passa a configurar `link` e `underline` na única
instância de `StarterKit.configure()`. As opções de segurança de URL,
protocolos permitidos e `openOnClick: false` foram preservadas nessa instância;
as importações e registros redundantes foram removidos.

Os mocks unitários passaram a representar o contrato real de
`StarterKit.configure`, sem mascarar a mudança de API.

## Validação independente

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxFocusStack.browser.ts
Test Files  1 passed (1)
Tests  3 passed (3)
Duration  2.98s
```

A saída dessa montagem real não contém `Duplicate extension names found`,
`[tiptap warn]` ou warnings de extensão.

```text
$ npx vitest run tests/components/MaxInputMarkdown.test.ts tests/components/modalSpecializedStack.test.ts
Test Files  2 passed (2)
Tests  37 passed (37)

$ npm run type-check -- --pretty false
exit 0
```

O cenário mantém a pilha real Popover + Markdown/lightbox + IconPicker e as
três provas de foco do gate; logo a correção elimina a causa sem reduzir a
cobertura de overlay/foco.
