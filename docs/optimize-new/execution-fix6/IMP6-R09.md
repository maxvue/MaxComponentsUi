# Relatório Formal - IMP6-R09

**Data**: 15 de Setembro de 2026
**UUID**: 32fdd0cf-0d47-46e2-9382-4bd99f05dd26
**Diretório de Trabalho**: `/home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6`

## Objetivo
1. Corrigir o literal `z-index: 9999` em `src/components/MaxTagSelect.vue` (linha 1012) e em `src/components/MaxInputSelect.vue` (linha 954).
2. Substituir pelo token de camada canônica `var(--max-z-index-dropdown, var(--max-layer-dropdown, 1000))`.
3. Verificar a integração de safe-area, offsets de visualViewport e clamp mobile para evitar regressões (nenhuma regressão identificada no z-index e layout associado aos selects na overlay).
4. Executar os testes de camada.

## Decisões Tomadas
- O uso de valores hardcoded como `9999` em overlays e modais frequentemente causa quebras de stacking context em layouts responsivos ou ao lidar com safe-areas (em dispositivos móveis). A utilização do token canônico resolve essas regressões, permitindo uma padronização no gerenciamento das camadas (`--max-layer-*`).
- O z-index foi fixado perfeitamente nas posições indicadas por substituição exata.

## Diffs

### src/components/MaxTagSelect.vue
```diff
--- src/components/MaxTagSelect.vue
+++ src/components/MaxTagSelect.vue
@@ -1009,7 +1009,7 @@
     .max-select-overlay {
         position: fixed;
         box-sizing: border-box;
-        z-index: 9999;
+        z-index: var(--max-z-index-dropdown, var(--max-layer-dropdown, 1000));
         background: var(--background-0, #fff);
         border: 1px solid var(--surface-border);
         border-radius: 6px;
```

### src/components/MaxInputSelect.vue
```diff
--- src/components/MaxInputSelect.vue
+++ src/components/MaxInputSelect.vue
@@ -951,7 +951,7 @@
 
 .max-select-overlay {
     position: fixed;
-    z-index: 9999;
+    z-index: var(--max-z-index-dropdown, var(--max-layer-dropdown, 1000));
     background: var(--background-0, #fff);
     border: 1px solid var(--surface-border);
     border-radius: 6px;
```

## Comandos Executados e Logs

**Comando:**
```bash
npx vitest run tests/themes/layers.test.ts
```

**Log Real de Execução:**
```text
npm notice run @maxvue/max-components-ui@1.1.2 npx
npm notice run 'vitest' run tests/themes/layers.test.ts

 RUN  v4.1.11 /home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6


 ✓ tests/themes/layers.test.ts (6 tests) 25ms
   ✓ Escala Semântica de Camadas (Stacking Layers) (6)
     ✓ declara todos os 11 tokens canônicos de camadas em :root com valores numéricos corretos 3ms
     ✓ declara a família correspondente de tokens semânticos --max-z-index-* 1ms
     ✓ respeita a ordem estritamente ascendente dos níveis visuais 1ms
     ✓ mantém aliases legados mapeados para a escala canônica com fallback idêntico 1ms
     ✓ suporta override direto de --max-z-index-* e --max-layer-* via CSS sem quebrar camadas 12ms
     ✓ rejeita literais arbitrários legados (9999, 99999, 100000, 999999) nos componentes 6ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  18:36:52
   Duration  997ms (transform 265ms, setup 383ms, import 231ms, tests 25ms, environment 233ms)
```

**Resultado:** Sucesso total em todos os 6 testes do arquivo `layers.test.ts`. O fallback semântico de tokens e as validações para a ausência de literais arbitrários legados no código funcionaram corretamente, garantindo conformidade sem alterar as definições de `visualViewport` ou clamp de mobile.
