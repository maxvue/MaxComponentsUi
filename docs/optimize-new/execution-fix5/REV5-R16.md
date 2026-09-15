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

## Revalidação no reparo `519c5000`

O reparo removeu a regra `<style>` injetada no fixture, passou a obter os alvos
da ordem de Tab pelo DOM montado, incluiu `MaxEmptyDiv` real e migrou seu texto
para `--max-content-secondary`. A medição Chromium agora exige 4,5:1 para esse
componente nos temas claro e escuro.

```text
$ npm run test -- tests/architecture/focusVisibleInventory.test.ts tests/themes/textColorValidation.test.ts tests/components/MaxInputTextArea.test.ts --run
Test Files  3 passed (3)
Tests       53 passed (53)

$ npm run test:browser -- tests/browser/FocusVisibleInventory.browser.ts
Test Files  1 passed (1)
Tests       6 passed (6)

$ git diff --check
exit 0
```

Esses resultados encerram os achados anteriores de fixture injetado e de
contraste do empty state. Ainda assim, o aceite integral não é possível: o
inventário arquitetural continua extraindo alvos por regex de fonte e
`hasPolicyAssociatedToTarget()` retorna `globalPolicy` sem vincular o seletor,
estado ou owner ao alvo analisado. O cenário Chromium materializa apenas três
componentes reais de foco (`MaxButton`, `MaxLikeButton`, `InputBase`), enquanto
as famílias ARIA são nós `h(...)` sintéticos; ele tampouco correlaciona sua
lista DOM com todos os alvos descobertos nos SFCs. Logo, não demonstra o
inventário parser/DOM por alvo e estado exigido por E10-04.

### Veredito da revalidação

**REJEITADO (retry do mesmo papel).** O reparo é parcial e verificável, mas
E10-04 permanece aberto até o gate relacionar cada alvo renderizado de cada
componente/estado à sua política computada, sem o atalho global.

## Segunda revalidação no reparo `5d8aa8fb`

O reparo substituiu a regex por `@vue/compiler-sfc`, compila SCSS com Sass e
parseia os seletores compilados com PostCSS. A execução focal passou:

```text
$ npm run test -- tests/architecture/focusVisibleInventory.test.ts tests/themes/textColorValidation.test.ts --run
Test Files  2 passed (2)
Tests       31 passed (31)

$ npm run test:browser -- tests/browser/FocusVisibleInventory.browser.ts
Test Files  1 passed (1)
Tests       6 passed (6)

$ git diff --check
exit 0
```

Contudo, a cadeia ainda não é integral por estado real. `attribute()` lê somente
atributos estáticos (AST tipo 6); `targetOf()` ignora `v-bind:tabindex`,
`v-bind:role`, `v-bind:disabled` e `v-bind:class`. A inspeção AST independente
encontrou **256** desses bindings nos SFCs, incluindo alvos focáveis condicionais
em `MaxImage`, `MaxTagSelect`, `MaxInputFileUpload` e `MaxInputIconPicker`.
Assim, estados `disabled` e os alvos com `tabindex` dinâmico não entram no
inventário. Além disso, `selectorMatchesTarget()` usa inclusão textual de tag,
classe ou `[tabindex]`, sem avaliar a condição do seletor nem o DOM renderizado;
o browser continua montando somente três componentes de foco reais, enquanto as
famílias ARIA são nós sintéticos.

### Veredito da segunda revalidação

**REJEITADO (novo retry do mesmo papel).** Há melhoria concreta de parser/CSS,
mas E10-04 exige que os bindings e estados condicionais sejam materializados e
correlacionados ao estilo computado para cada SFC focável; a verificação atual
não os cobre.

## Terceira revalidação no diff sobre `6a04c6eb`

O diff atual adiciona classificação para `v-bind:class`, `role`, `tabindex`,
`disabled` e spread. A suíte runtime focal passa:

```text
$ npm run test -- tests/architecture/focusVisibleInventory.test.ts tests/themes/textColorValidation.test.ts --run
Test Files  2 passed (2)
Tests       32 passed (32)
```

Mas a verificação de tipos falha no próprio gate R16, independentemente dos
erros de resolução do playground:

```text
tests/architecture/focusVisibleInventory.test.ts(4,36): error TS2305:
Module '"@vue/compiler-sfc"' has no exported member 'ElementNode'.
tests/architecture/focusVisibleInventory.test.ts(4,54): error TS2305:
Module '"@vue/compiler-sfc"' has no exported member 'Node'.
tests/architecture/focusVisibleInventory.test.ts(4,65): error TS2459:
Module '"@vue/compiler-sfc"' declares 'RootNode' locally, but it is not exported.
tests/architecture/focusVisibleInventory.test.ts(26,35): error TS7006:
Parameter 'candidate' implicitly has an 'any' type.
tests/architecture/focusVisibleInventory.test.ts(48,39): error TS7006:
Parameter 'prop' implicitly has an 'any' type.
```

Há também uma lacuna mensurável: `inventory` mantém apenas arquivos que já
possuem `targets.length > 0`, e a auditoria de bindings é extraída somente dessa
lista. A leitura AST independente encontrou 348 bindings relevantes, dos quais
**60 em 32 SFCs** são descartados antes da auditoria; incluem `InputBase.vue`,
`MaxInputCode.vue`, `MaxEmptyDiv.vue` e componentes compostos. A condição
`bindings.length > 100` passa sem garantir que todos os bindings sejam
classificados. Portanto a afirmação de que cada binding foi auditado não é
sustentada.

### Veredito da terceira revalidação

**REJEITADO (novo retry do mesmo papel).** Além de não cobrir todos os bindings
dinâmicos, o teste R16 não passa no type-check. E10-04 continua aberto.

## Quarta revalidação no diff sobre `6a04c6eb`

O diff corrigiu os tipos: usa uma representação local e estrita dos nós AST,
sem importar tipos não públicos de `@vue/compiler-sfc`. Ele também separa
`parsedComponents` da lista filtrada de alvos, de modo que a auditoria de
bindings percorre todos os SFCs antes do filtro.

```text
$ npm run test -- tests/architecture/focusVisibleInventory.test.ts tests/themes/textColorValidation.test.ts --run
Test Files  2 passed (2)
Tests       32 passed (32)

$ npm run test:browser -- tests/browser/FocusVisibleInventory.browser.ts
Test Files  1 passed (1)
Tests       6 passed (6)

$ leitura AST independente
bindings_relevantes_total=348

$ git diff --check
exit 0
```

`npm run type-check:test` ainda falha, porém a saída desta reexecução contém
somente imports não resolvidos de cenários do playground para
`@maxvue/max-components-ui`; os cinco erros anteriormente reportados no teste
R16 não reaparecem. Esse bloqueio transversal permanece para o gate de
type-check/playground e não invalida a evidência focal de R16.

### Veredito da quarta revalidação

**ACEITO.** E10-03/E10-04 possui agora análise AST de SFCs, CSS compilado,
classificação de toda a população de bindings relevante e validação Chromium de
Tab, claro/escuro, forced-colors e zoom. O gate transversal global continua
obrigatório.
