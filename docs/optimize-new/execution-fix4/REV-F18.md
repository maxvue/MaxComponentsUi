# Relatório de Refutação Independente — Bloco F18

- **Subagente**: `REV-F18` (Grupo B de Refutação Independente)
- **ID da Plataforma**: `9490e049-2141-4636-a123-3de747d03c84`
- **Parent ID**: `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Início**: `2026-09-15T10:42:42-03:00`
- **Término**: `2026-09-15T10:55:00-03:00`
- **Veredito**: **ACEITO**

---

## 1. Sumário da Auditoria Adversarial

A implementação do Bloco **F18** realizada pelo subagente `IMP-F18` em `src/components/MaxImage.vue`, `src/helpers/imageCrop.ts` e suas suítes de teste foi submetida a uma auditoria técnica adversarial minuciosa com o objetivo de refutar e testar a resiliência do componente sob condições extremas.

Foram criados testes adversariais específicos adicionais (`tests/unit/MaxImage.adversarial.spec.ts`) complementando as suítes `tests/components/MaxImage.test.ts` e `tests/browser/MaxImage.browser.ts`.

---

## 2. Verificação Adversarial dos Requisitos F18

### 2.1. Canvas de Alta Resolução (48 MP = 8000x6000) em Chromium Real
- **Orçamento de tempo**: Medição realizada via Vitest Browser Mode com imagem SVG real decodificada nativamente em 8000x6000 (48 MP).
  - Duração de `confirmCrop()` no Chromium real: **465ms** a **472ms** (orçamento teto: **1500ms**). Aprovado com ampla margem de segurança.
- **Downscale proporcional**:
  - Imagem 8000x6000 (proporção 4:3) reduzida proporcionalmente para canvas com `width * height <= 16.777.216` (16 MP) e dimensões `< 4096px`.
  - Diferença de aspect ratio $< 0.05$ (geometria rigorosamente preservada).
  - Ausência de estouros de memória e sem congelamentos na UI.

### 2.2. Codificação Binária Única e Ausência Total de `toDataURL`
- **Zero chamadas a `toDataURL` por padrão**: Comprovado via spy em `HTMLCanvasElement.prototype.toDataURL` (0 chamadas).
- **Zero chamadas a `toDataURL` mesmo quando opt-in (`includeDataUrl: true`)**: Comprovado que `dataUrl` é derivado de forma assíncrona a partir do `Blob` via `FileReader.readAsDataURL`, eliminando recompressão redundante pelo canvas.
- **Exatamente uma chamada a `toBlob`**: Validado tanto no ambiente sintético quanto no Chromium real.

### 2.3. Tratamento de Falhas Recuperáveis e Estados de Erro
- **Simulação de falha em `toBlob` (retornando `null` ou lançando exceção síncrona/assíncrona)**:
  - O editor de recorte (`isCropping`) **permanece aberto** permitindo nova tentativa pelo usuário.
  - Alerta acessível presente com `role="alert"` e `aria-live="assertive"`.
  - **Zero emissões** de eventos (`crop`, `edit`, `update:src`).
- **Dimensões inválidas (0x0)**:
  - Validação em `MaxImage.vue` bloqueia a operação antes de instanciar canvas, exibindo `Área de recorte inválida.` e mantendo o editor ativo sem quebra de estado.

### 2.4. Ciclo de Vida de Object URLs e Prevenção de Vazamento de Memória
- **Ao alterar a prop `src`**: O watcher dispara `revokeActiveObjectUrl()`, liberando a URL de objeto no browser.
- **Ao desmontar o componente (`onBeforeUnmount`)**: Chamada explícita a `revokeActiveObjectUrl()`.
- **Em recortes sucessivos**: Testado no adversarial spec (`tests/unit/MaxImage.adversarial.spec.ts`) que a cada novo recorte a Object URL intermediária anterior é pontualmente revogada antes de criar a nova.

### 2.5. Estresse Matemático em `calculateTargetCropDimensions`
- **Validação de limites extremos**: Testados casos com proporções ultra esticadas (100.000x2, 3x100.000), `maxPixels` diminutos (10 e 1), limites de largura/altura e entradas degeneradas (`0`, negativos, `NaN`, `Infinity`, `-Infinity`).
- **Garantia de não-upscale**: Imagens com resolução inferior aos limites mantêm suas dimensões exatas sem interpolação artificial.

---

## 3. Evidências de Execução de Testes

### 3.1. Testes Unitários de Componente e Adversariais
```bash
npx vitest run tests/components/MaxImage.test.ts tests/unit/MaxImage.adversarial.spec.ts
```
**Saída**:
```text
 ✓ tests/unit/MaxImage.adversarial.spec.ts (9 tests) 184ms
 ✓ tests/components/MaxImage.test.ts (28 tests) 309ms

 Test Files  2 passed (2)
      Tests  37 passed (37)
   Duration  1.74s
```

### 3.2. Testes em Chromium Real (Vitest Browser Mode)
```bash
npx vitest run --config vitest.browser.config.ts tests/browser/MaxImage.browser.ts
```
**Saída**:
```text
 ✓ |chromium| tests/browser/MaxImage.browser.ts (5 tests) 2593ms
   ✓ MaxImage no Chromium Real — Performance de Recorte em Alta Resolução (F18) (5)
     ✓ executa recorte de imagem de 48 MP com canvas real, downscale proporcional dentro dos limites, zero toDataURL e dentro do orçamento de tempo  467ms
     ✓ gera dataUrl via FileReader quando includeDataUrl for true, mantendo ZERO chamadas a canvas.toDataURL  407ms
     ✓ revoga a Object URL temporária ao alterar a propriedade src  601ms
     ✓ revoga a Object URL temporária ao desmontar o componente com imagem recortada ativa  616ms
     ✓ mantém o editor de recorte aberto e exibe erro recuperável com role="alert" se toBlob falhar  500ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  4.73s
```

### 3.3. Conformidade de Código e Estilos (Linting)
```bash
npx eslint src/components/MaxImage.vue src/helpers/imageCrop.ts tests/components/MaxImage.test.ts tests/browser/MaxImage.browser.ts tests/unit/MaxImage.adversarial.spec.ts
npx stylelint src/components/MaxImage.vue
```
- **Resultado**: Código de saída `0`, sem erros ou warnings de ESLint e Stylelint.

---

## 4. Conclusão e Veredito

Todas as premissas estabelecidas na especificação da Etapa 9 e nos critérios da auditoria para o Bloco F18 foram cumpridas com rigor:
1. `Blob` e `File` são emitidos no payload de recorte sem recompressões duplas.
2. Ausência total de chamadas a `canvas.toDataURL()`.
3. `toBlob()` é executado exatamente uma vez.
4. Downscale proporcional rigoroso para fotos gigantes (48 MP testados no Chromium real com tempo de 465ms < 1500ms).
5. Falha recuperável com `role="alert"` e retenção de editor.
6. Gerenciamento estrito de memória com revogação sistemática de Object URLs.

Veredito: **ACEITO**.
