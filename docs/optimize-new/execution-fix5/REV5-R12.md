# REV5-R12 — refutação independente de E07-04/E07-05

## Identidade e escopo

- Papel: `REV5-R12` (somente leitura de código de produção).
- Agente: `/root/rev5_r12`; parent: `/root`.
- Início/fim: `2026-09-15T15:59:00-03:00` / `2026-09-15T16:01:00-03:00`.
- Referência adversarial: `aac16bca`; HEAD auditado: `4f9e79ab`.
- Escopo: seletor único de `MaxInputFileProject` e coordenadas `0`/alternativa acessível de `MaxMaps`.

## Caso adversarial contra `aac16bca`

```text
git show aac16bca:src/components/MaxInputFileProject.vue | rg -n 'useFileDialog|const triggerChoose|open\\(\\)'
65: import { ..., useFileDialog, ..., size } from '@maxvue/max-use';
128: const triggerChoose = () => {
131:     open();
257: const { open, reset, onChange } = useFileDialog({

git show aac16bca:src/components/MaxMaps.vue | rg -n 'v-if="coordinates\\.latitude|is_valid'
2: <div class="max-maps map-main-div" v-if="coordinates.latitude !== 0 && coordinates.longitude !== 0">
95: const is_valid = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
```

O caso é capaz de refutar o baseline: no mesmo gesto `triggerChoose()` acionava
`HTMLInputElement.click()` e `useFileDialog.open()`; adicionalmente `0,0`,
equador e meridiano eram descartados pela guarda de renderização/atualização.

No HEAD, o censo independente encontrou somente o input nativo em
`triggerChoose`, e o clique do botão interno usa `@click.stop.prevent`,
impedindo a ativação padrão adicional do `label`. A rota direta pelo `label`
continua sendo uma única ativação nativa. O `hasCoordinates` aceita qualquer
par finito quando `modelValue` não é `null`, inclusive os três casos com zero;
os controles de região continuam fora da guarda do canvas.

## Execução independente

```text
npx vitest run --config vitest.browser.config.ts tests/browser/fileChooserAndGraphAlternatives.browser.ts
Test Files  1 passed (1)
Tests       5 passed (5)
Duration    2.34s

npx vitest run tests/components/MaxInputFileProject.test.ts tests/components/MaxMaps.test.ts tests/components/rev_r12_adversarial.test.ts tests/components/rev_r12_adversarial_maps.test.ts
Test Files  4 passed (4)
Tests       46 passed (46)
Duration    1.29s

npx eslint src/components/MaxInputFileProject.vue src/components/MaxMaps.vue tests/components/MaxInputFileProject.test.ts tests/components/MaxMaps.test.ts tests/components/rev_r12_adversarial.test.ts tests/components/rev_r12_adversarial_maps.test.ts
saída: sucesso (0 erros)
```

O cenário Chromium cobre foco do `label`, Enter e Espaço, contando uma
ativação do input por gesto. O SO não expõe a janela de arquivos ao browser
headless; por isso a contagem de ativações nativas é corroborada pelo censo de
rotas do código, que confirma a remoção de `useFileDialog` deste componente.

## Veredito

**ACEITO.** E07-04 e E07-05 falham no commit de referência e passam no HEAD:
há um único caminho de picker, coordenadas zero não são tratadas como ausência,
e a alternativa acessível segue focável e operável.
