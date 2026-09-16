# Relatório de Execução — IMP6-R12

- **ID do Papel:** IMP6-R12
- **Bloco:** R12 / E07-04, E07-05 (Picker nativo único em MaxInputFileProject e coordenadas válidas (0, 0) em MaxMaps)
- **UUID:** `311beb2d-8e94-45fc-b2e5-c6ea71418e14`
- **Parent ID:** `da986479-bddd-4162-bd27-8952f0c5a526`
- **Worktree:** `/home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6`
- **Branch:** `fix/fix6-implementation`
- **Status:** CONCLUÍDO COM SUCESSO

## 1. Escopo e Objetivos do Requisito R12
1. **Picker Nativo Único em `MaxInputFileProject.vue`:**
   - No baseline, `triggerChoose` executava `nativeInputRef.value.click()` e simultaneamente `open()` do `useFileDialog()`, abrindo dois seletores nativos concorrentes e gerando falha e duplicidade de fluxo no sistema operacional.
   - Eliminar a chamada a `open()` em `triggerChoose` e manter estritamente o disparo único do seletor nativo `<input type="file">` através do clique associado.
2. **Aceite de Coordenadas (0, 0) em `MaxMaps.vue`:**
   - No baseline, o template usava `v-if="coordinates.latitude !== 0 && coordinates.longitude !== 0"` e o watcher verificava `lat !== 0 && lng !== 0`, eliminando a exibição do mapa para o meridiano de Greenwich no equador (latitude 0, longitude 0).
   - Implementar `isValidCoordinates` validando que a latitude está no intervalo [-90, 90] e a longitude no intervalo [-180, 180], aceitando explicitamente (0, 0) como coordenadas válidas.
3. **Alternativas Gráficas Acessíveis e Validação em Browser:**
   - Garantir a integridade da região acessível do mapa e upload no Chromium real via `tests/browser/fileChooserAndGraphAlternatives.browser.ts`.

## 2. Modificações Realizadas
- `src/components/MaxInputFileProject.vue`:
  - Removido `open()` em `triggerChoose()`.
  - Removido `open` do retorno de `useFileDialog()`.
- `src/components/MaxMaps.vue`:
  - Adicionada computed `isValidCoordinates` validando limites numéricos e aceitando 0.
  - Atualizado o template para usar `v-if="isValidCoordinates"`.
  - Atualizado watcher de `modelValue` para considerar 0 como coordenada válida.
- `tests/components/MaxInputFileProject.test.ts`:
  - Ajustado teste de renderização inicial para validar o `click` no input nativo em vez de esperar chamada em `openMock`.
- `tests/components/MaxMaps.test.ts`:
  - Adicionado caso de teste verificando aceitação e renderização de coordenadas `(0, 0)`.

## 3. Evidências e Comandos Executados
```bash
$ npx vitest run tests/components/MaxMaps.test.ts tests/components/MaxInputFileProject.test.ts
✓ tests/components/MaxMaps.test.ts (12 tests) 87ms
✓ tests/components/MaxInputFileProject.test.ts (23 tests) 192ms
Test Files  2 passed (2)
     Tests  35 passed (35)

$ npx vitest run --config vitest.browser.config.ts tests/browser/fileChooserAndGraphAlternatives.browser.ts
✓ |chromium| tests/browser/fileChooserAndGraphAlternatives.browser.ts (5 tests) 353ms
  ✓ File Chooser e Alternativas Acessíveis no Chromium Real (R12 / F19) (5)
    ✓ MaxInputFileUpload e MaxInputFileProject (3)
    ✓ MaxChart e MaxMaps - Alternativas Perceptíveis ao Foco (2)
Test Files  1 passed (1)
     Tests  5 passed (5)

$ npx eslint src/components/MaxInputFileProject.vue src/components/MaxMaps.vue tests/components/MaxMaps.test.ts tests/components/MaxInputFileProject.test.ts
# Código de saída 0 (0 erros, 0 avisos)
```
