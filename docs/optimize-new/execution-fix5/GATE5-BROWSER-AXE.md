# GATE5-BROWSER-AXE — relatório de execução

- Papel: `GATE5-BROWSER-AXE` (somente leitura de código).
- Agente: `/root/gate5_browser_axe`; parent: `/root`.
- Início: `2026-09-15T16:42:30-03:00`; fim: `2026-09-15T16:44:00-03:00`.
- HEAD auditado: `dca2b145` (`fixes/optimize-fix5`).
- Manifest: somente este relatório e a linha correspondente da matriz; nenhum arquivo de código alterado.

## Evidências executadas

1. `npm run test:browser` — **PASSOU** na primeira execução: 19 arquivos e 68 testes Chromium aprovados (código 0; 20,17 s).
2. `npm run test:axe` — **PASSOU**: 1 arquivo e 1 teste (código 0; 1,01 s). O teste executa `axe-core@4.11.0` no Chromium contra um diálogo nomeado e comprova que a mutação que remove o nome do botão produz a violação `button-name`.
3. Reexecução integral para contabilizar a saída — **FALHOU**: 18 arquivos/67 testes aprovados e uma falha transitória em `MaxCreditCard.browser.ts`, cujo `href` do SVG ficou vazio. Três execuções focais subsequentes desse arquivo passaram (6/6 cada), portanto a ocorrência é flutuação adicional a corrigir, e não evidência de regressão reproduzível no componente.

## Avisos e erros da aplicação capturados

- 32 ocorrências de `[Vue warn]: Failed to resolve directive: tooltip`, originadas principalmente em `MaxTableFields`/`MaxIconButton`, `MaxPopover` e `MaxPopoverConfirm` sob o bootstrap browser.
- 1 ocorrência de `[tiptap warn]: Duplicate extension names found: ['link', 'underline']`.
- 3 ocorrências de `Failed to load animation data ... AbortError: signal is aborted without reason` para uma animação remota Lottie.

Os avisos não foram suprimidos: a execução inteira devolveu código zero porque a configuração atual do Vitest não os transforma em falha. A instrução de finalização, porém, exige explicitamente Browser/axe sem warnings de tooltip e uma política explícita para avisos inesperados.

## Veredito

**REJEITADO.** A cobertura browser e o `axe-core` real passam funcionalmente, mas o gate não satisfaz a condição obrigatória de ausência de warnings de `tooltip`. Há ainda o warning de extensões duplicadas do Tiptap, três erros AbortError de Lottie e uma falha integral intermitente de `MaxCreditCard` a estabilizar. Nenhuma correção foi aplicada por este papel de gate somente leitura.
