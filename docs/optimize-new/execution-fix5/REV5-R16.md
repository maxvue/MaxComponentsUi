# Relatório de refutação independente — REV5-R16

- Papel: `REV5-R16` — refutação somente leitura de R16 / E10-03 e E10-04.
- Agente: `/root/rev5_r16`; parent: `/root`.
- Início: `2026-09-15T15:06:00-03:00`; fim: `2026-09-15T15:08:35-03:00`.
- HEAD auditado: `107cef7a`.
- Referência adversarial: `aac16bca`.
- Manifesto: foram escritos somente este relatório e a linha correspondente na
  matriz. Nenhum arquivo de produção ou teste foi modificado.

## Caso adversarial e referência

O contrato exige associação por alvo focável real e inventário de cada uso de
`--background-650`, por seletor e estado. A referência não possui a política
global que o novo teste exige:

```text
$ node (leitura de git show aac16bca:src/themes/all.scss)
baseline_global_focus_policy=false
baseline_background650_occurrences=23
```

Assim, o requisito novo de política global falha contra `aac16bca`. Porém, os
casos adversariais abaixo também demonstram que o HEAD não prova o contrato
integral, portanto a correção não pode ser aceita.

## Evidências no HEAD

```text
$ npm run test -- tests/architecture/focusVisibleInventory.test.ts --run
Test Files  1 passed (1)
Tests       6 passed (6)

$ npm run test:browser -- tests/browser/FocusVisibleInventory.browser.ts
Test Files  1 passed (1)
Tests       6 passed (6)

$ rg -n -- '--background-650' src
11 ocorrências em 7 arquivos (incluindo MaxEmptyDiv.vue e params.scss)
```

Os comandos passam, mas não estabelecem o aceite pelos motivos a seguir.

1. `hasPolicyAssociatedToTarget()` retorna `globalPolicy` diretamente
   (`tests/architecture/focusVisibleInventory.test.ts`, linhas 56–67).
   Uma vez que a regra global exista, nenhuma classe, seletor, estado, DOM
   renderizado ou owner do alvo é verificado. Além disso, o parser é uma regex
   de template: não resolve componentes, `v-if`, `v-for`, slots, bindings ou o
   DOM emitido. Logo, não há associação parser/DOM por alvo focável.
2. O browser cobre só `MaxButton`, `MaxLikeButton` e `InputBase`; link, textarea
   e todos os papéis ARIA são `h(...)` sintéticos. Pior, o próprio fixture
   injeta `.r16-focus-family:focus-visible` com outline e box-shadow
   (`tests/browser/FocusVisibleInventory.browser.ts`, linhas 70–93).
   Portanto Tab, zoom e forced-colors aprovam um estilo criado pelo teste, não
   os componentes reais inventariados.
3. O inventário de `background-650` é uma lista fixa de quatro basenames
   (`tests/architecture/focusVisibleInventory.test.ts`, linhas 102–113),
   não uma análise de seletor/estado. Ele marca `MaxEmptyDiv.vue` como
   “decorativo”, mas seu container colore o slot de rótulo padrão “Sem
   Registros”, isto é, conteúdo textual informado ao usuário. No tema claro,
   `#74869A` sobre o fundo `#EEF1F5` do componente mede **3,30:1**, abaixo de
   4,5:1 para texto normal; no escuro a mesma combinação temática mede 5,70:1.
   A exceção, portanto, não é válida em todos os temas.
4. O teste de contraste no browser mede somente `.r16-token-probe` sintético e
   aceita mínimo 3:1, não os usos remanescentes nem contraste de texto normal.

## Veredito

**REJEITADO.** O HEAD acrescentou uma rede global útil, mas E10-03/E10-04
permanecem sem inventário parser/DOM e de estados completo e sem cobertura de
componentes reais em light/dark/forced-colors/zoom/Tab. O implementador deve
substituir a lista e o fixture sintéticos por um inventário derivado do DOM
renderizado, testar os componentes/estados reais e migrar ou justificar com
contraste calculado o rótulo de `MaxEmptyDiv`.
