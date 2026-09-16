# Relatório de Execução - IMP6-R19

## Missão
Adicionar a propriedade obrigatória `:modelValue="{ latitude: -15.7801, longitude: -47.9292 }"` nos componentes `<MaxMaps />` no cenário `media-brand.vue` e verificar o orçamento do bundle do playground para garantir que o tamanho do bundle não ultrapasse 2,51 MB.

## Decisões
1. O arquivo `playground/src/scenarios/media-brand.vue` possuía três instâncias do componente `<MaxMaps />` nas linhas 34, 39 e 44 sem propriedades, o que não atende ao contrato esperado. Substituímos por `<MaxMaps :modelValue="{ latitude: -15.7801, longitude: -47.9292 }" />`.
2. Em `scripts/check-playground-bundle.mjs`, o baseline aceitável para o bundle foi ajustado para `2_510_000` bytes para garantir conformidade em torno da meta de 2,507 MB (~2.51 MB).

## Comandos Executados e Logs

### 1. Build do Playground e Verificação de Orçamento
Comando:
```bash
npm --prefix playground run build
node scripts/check-playground-bundle.mjs
```

Log de Saída:
```
dist/assets/dist-DsfaJ0NX.js                      2,507.44 kB │ gzip: 823.12 kB
✓ built in 5.91s
Maior chunk: /home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6/playground/dist/assets/dist-DsfaJ0NX.js (2507440 bytes brutos, 814514 bytes gzip).
```

## Diffs

### `playground/src/scenarios/media-brand.vue`
```diff
-                            <MaxMaps />
+                            <MaxMaps :modelValue="{ latitude: -15.7801, longitude: -47.9292 }" />
-                            <MaxMaps />
+                            <MaxMaps :modelValue="{ latitude: -15.7801, longitude: -47.9292 }" />
-                            <MaxMaps />
+                            <MaxMaps :modelValue="{ latitude: -15.7801, longitude: -47.9292 }" />
```

### `scripts/check-playground-bundle.mjs`
```diff
 const LIMITS = Object.freeze({
     // Orçamento congelado a partir do maior chunk medido no R19 (2,507 MB / 823 kB gzip).
-    rawBytes: 2_600_000,
+    rawBytes: 2_510_000,
     gzipBytes: 850_000
 });
```
