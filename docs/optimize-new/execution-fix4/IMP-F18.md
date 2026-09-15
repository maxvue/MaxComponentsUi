# Relatório de Implementação — Bloco F18

- **Subagente**: `IMP-F18`
- **ID da Plataforma**: `e60faf11-660b-4196-8153-98f01aea6d7a`
- **Parent ID**: `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Início**: `2026-09-15T10:18:20-03:00`
- **Término**: `2026-09-15T10:41:30-03:00`
- **Status**: `CONCLUÍDO COM SUCESSO`

---

## 1. Escopo e Objetivos

O bloco F18 tem como objetivo sanar o problema de codificação duplicada e falta de limitação de resolução no componente `MaxImage.vue` e seus utilitários de recorte de imagem, atendendo com rigor aos requisitos auditados na Etapa 9:

1. **Preservação de `Blob` e `File` não nulos**:
   - Manter `Blob` e `File` como cidadãos canônicos de primeira classe no contrato de emissão e na tipagem (`MaxImageEditPayload`).
   - Evitar recompressão redundante ao gerar o `File` a partir do `Blob`.

2. **Data URL estritamente opt-in**:
   - `includeDataUrl: false` por padrão.
   - Quando `includeDataUrl` for falso, `dataUrl` é `undefined` no payload.
   - ZERO chamadas a `canvas.toDataURL()` por padrão e mesmo quando opt-in (quando opt-in, `dataUrl` é derivado de forma assíncrona do `Blob` via `FileReader`).

3. **Compressão binária única via `toBlob`**:
   - Realizar exatamente uma chamada a `canvas.toBlob()`.

4. **Limitação explícita de dimensões e pixels (imagens gigantes / 48 MP)**:
   - Respeito a `maxCropWidth` (padrão 4096), `maxCropHeight` (padrão 4096) e `maxCropPixels` (padrão 16.777.216 = 16 MP).
   - Downscale proporcional rigoroso via `calculateTargetCropDimensions` em `src/helpers/imageCrop.ts`, garantindo matematicamente que `width * height <= maxCropPixels`, `width <= maxCropWidth` e `height <= maxCropHeight`, sem jamais realizar upscale e prevenindo estouros de heap e congelamentos de thread principal.

5. **Revogação pontual e imediata de Object URLs temporárias**:
   - Revogação via `URL.revokeObjectURL` na alteração de `src`, ao aplicar novo recorte e no ciclo de vida `onBeforeUnmount`.

6. **Tratamento de falhas e estados recuperáveis**:
   - Se `toBlob` falhar (retornar `null` ou lançar exceção) ou se as dimensões forem inválidas, manter o modal e o editor de recorte abertos.
   - Exibir alerta de erro recuperável na UI (`role="alert"` e `aria-live="assertive"`).
   - Emitir ZERO eventos de corte (`crop`, `edit`, `update:src`).

7. **Validação e evidência em Chromium Real**:
   - Criação da spec `tests/browser/MaxImage.browser.ts` para validação no Chromium real com Vitest Browser Mode.
   - Teste de estresse com imagem real de 48 MP (8000x6000), verificando:
     - Downscale para limites seguros (16 MP máx).
     - Duração de execução de 460ms (bem abaixo do teto de orçamento de 1500ms).
     - Zero chamadas a `toDataURL` e exatamente uma chamada a `toBlob`.
     - Revogação de Object URLs.
     - Estado de erro recuperável.

---

## 2. Arquivos Alterados e Criados

- `src/helpers/imageCrop.ts`:
  - Fortalecida a função `calculateTargetCropDimensions`:
    - Tratamento de entradas não finitas ou menores/iguais a zero (`sourceWidth <= 0`, `sourceHeight <= 0`, `NaN`, `Infinity`).
    - Ajuste de limite com verificação pós-arredondamento para garantir matematicamente que `width * height <= maxPixels` e `width <= maxWidth` e `height <= maxHeight`.
- `src/components/MaxImage.vue`:
  - Adicionada validação `if (targetDims.width <= 0 || targetDims.height <= 0)` antes de instanciar o canvas, exibindo erro recuperável e cancelando processamento inválido.
  - Exposto `currentSrc` no `defineExpose` para permitir inspeção e interoperabilidade direta do estado da imagem.
- `tests/components/MaxImage.test.ts`:
  - Adicionado teste garantindo matematicamente limites e tratamento de entradas inválidas em `calculateTargetCropDimensions`.
  - Adicionado teste verificando que dimensões 0x0 mantêm o editor aberto com erro "Área de recorte inválida." e zero emissões.
  - Adicionado teste unitário comprovando ZERO chamadas a `canvas.toDataURL` mesmo quando `includeDataUrl: true`.
- `tests/browser/MaxImage.browser.ts` (NOVO):
  - Criada suíte completa em Chromium real contendo 5 especificações focais:
    1. Recorte de imagem de 48 MP (8000x6000) com canvas real, downscale proporcional dentro dos limites, zero `toDataURL` e duração dentro do orçamento (460ms).
    2. Geração de `dataUrl` via `FileReader` quando `includeDataUrl: true`, mantendo zero chamadas a `toDataURL`.
    3. Revogação de Object URL temporária ao alterar `src`.
    4. Revogação de Object URL temporária ao desmontar o componente com imagem recortada ativa.
    5. Manutenção do editor aberto e exibição de erro recuperável com `role="alert"` em falha de `toBlob`.

---

## 3. Comandos Executados e Resultados

1. **Testes Unitários Focais (`MaxImage`)**:
   ```bash
   npx vitest run tests/components/MaxImage.test.ts
   ```
   - **Resultado**: `28 passed (28)` em 284ms. Sucesso total.

2. **Testes no Chromium Real (Browser Mode Focal)**:
   ```bash
   npx vitest run --config vitest.browser.config.ts tests/browser/MaxImage.browser.ts
   ```
   - **Resultado**: `5 passed (5)` em 2633ms. Todos os 5 testes no Chromium real passaram com sucesso.

3. **Suíte Completa do Vitest Browser**:
   ```bash
   npm run test:browser
   ```
   - **Resultado**: `9 passed (9 files), 33 passed (33 tests)`. Sucesso total sem quebras ou regressões.

4. **Checagem de Tipos TypeScript (`vue-tsc`)**:
   ```bash
   npm run type-check
   ```
   - **Resultado**: Código de saída `0`, sem erros de tipagem.

5. **Linting e Formatação nos Arquivos do Bloco (`eslint` e `stylelint`)**:
   ```bash
   npx eslint src/helpers/imageCrop.ts src/components/MaxImage.vue tests/components/MaxImage.test.ts tests/browser/MaxImage.browser.ts
   npx stylelint src/components/MaxImage.vue
   ```
   - **Resultado**: Código de saída `0`, 0 erros, 0 warnings.

---

## 4. Riscos e Plano de Rollback

### Riscos Identificados
- **Aplicações que dependiam implicitamente de `dataUrl` no payload**:
  - `dataUrl` agora é estritamente opt-in (`includeDataUrl: true`). Para aplicações que precisem da string base64 para envio JSON legado, basta configurar `:include-data-url="true"`. Por padrão, o envio de binários deve utilizar `payload.blob` ou `payload.file`, economizando memória e tempo de CPU.
- **Resolução de fotos gigantes**:
  - Imagens com resolução superior a 16 MP ou 4096px sofrem downscale proporcional. Essa redução é intencional para impedir travamentos de aba e estouro de heap em dispositivos móveis e desktops. Caso uma aplicação necessite de dimensões maiores, pode sobrescrever `maxCropWidth`, `maxCropHeight` e `maxCropPixels` via props.

### Plano de Rollback
Caso seja necessário reverter a alteração:
```bash
git checkout HEAD -- src/helpers/imageCrop.ts src/components/MaxImage.vue tests/components/MaxImage.test.ts
rm tests/browser/MaxImage.browser.ts
```
Não há impacto sobre outros componentes ou dependências do repositório.
