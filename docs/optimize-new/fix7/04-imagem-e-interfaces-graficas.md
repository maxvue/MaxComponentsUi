# Lote 04 — Imagem e interfaces gráficas

## Escopo

Blocos `F18` e `R12`.

- `F18`: raster real 8000×6000, Blob/File não nulo, uma chamada `toBlob`, zero `toDataURL` padrão, falha recuperável, duração total <1500 ms, Long Task individual <1200 ms, delta de heap <80 MiB e prova não tautológica de responsividade. Rode cinco amostras, registre ambiente/mediana/pior caso e habilite a medição de heap no Chromium; métrica ausente reprova.
- `R12`: uma única via de ativação do picker e um file chooser real; coordenadas zero válidas e alternativa gráfica acessível.

Os dois blocos podem ser delegados a auxiliares diferentes; o líder mantém os testes browser e o relatório.

```bash
npx vitest run tests/components/MaxImage.test.ts tests/unit/MaxImage.adversarial.spec.ts tests/components/MaxInputFileProject.test.ts tests/components/MaxMaps.test.ts tests/components/rev_r12_adversarial.test.ts tests/components/rev_r12_adversarial_maps.test.ts
npx vitest run --config vitest.browser.config.ts tests/browser/MaxImage.browser.ts tests/browser/fileChooserAndGraphAlternatives.browser.ts
```

Registre métricas e ambiente; não torne budgets opcionais para contornar limitações do harness.
