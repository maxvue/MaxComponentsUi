# GATE5-MOTION-CONTRAST — relatório de execução

## Revalidação final após granularização R18 — 2026-09-15

- Papel: `GATE5-MOTION-CONTRAST` (somente leitura de código).
- Agente de revalidação: `/root/rev5_r04_chrome151`; parent: `/root`.
- Início: `2026-09-15T18:26:00-03:00`; fim: `2026-09-15T18:27:00-03:00`.
- HEAD auditado: `d12d4571799e97ca286f86fa716ce29b80709aaf`, com a remediação R18 local
  ainda não commitada.

### Evidência reproduzida

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts tests/browser/FocusVisibleInventory.browser.ts --reporter=verbose
Test Files  2 passed (2)
Tests  13 passed (13)
Duration  5.57s

$ npx vitest run tests/themes/tokensMutationReal.test.ts tests/themes/textColorValidation.test.ts tests/components/MaxDarkModeContrast.test.ts --reporter=verbose
Test Files  3 passed (3)
Tests  85 passed (85)
Duration  2.90s
```

O inventário é de 59 SFCs e as fixtures reais têm a mesma cardinalidade:
19 autônomos, quatro estruturais, quatro seletores e 32 restantes. `MaxTab`
é agora importado e montado dentro de `MaxTabs`, eliminando o wrapper que antes
somente usava seu nome. Cada fixture é verificada separadamente por
`assertFixtureCssom` em `no-preference` e `reduce`; a rotina percorre os nós
produzidos pelo próprio SFC e afirma `animationDuration`,
`animationIterationCount`, `transitionDuration` e `transform`, sem média nem
`some/every` entre componentes.

Os estados públicos são efetivamente ativados: accordion/tabs e seletores,
preview de imagem, popover e toast; Drawer e BaseOverlay são então fechados e
removidos. Para as primitivas de transição que possuem lifecycle próprio,
`TransitionFade` e `MaxTransitionUp` comprovam entrada, término e remoção em
`reduce`. Os demais SFCs são microinterações ou componentes sem lifecycle de
entrada/saída independente; sua exigência aplicável é a política CSSOM
individual, já coberta nos dois modos.

O bloco de foco continua aprovando Tab em claro/escuro, zoom 200%, contraste
computado e `forced-colors`; as 85 verificações de contraste, incluindo a
mutação do CSS compilado, também passaram.

### Veredito da revalidação

**ACEITO.** As lacunas anteriores de fixture nominal, CSSOM agregado e estados
inativos foram eliminadas, e a execução Chromium/contraste completa é verde.

## Revalidação após cobertura nominal 59/59 — 2026-09-15

- Papel: `GATE5-MOTION-CONTRAST` (somente leitura de código).
- Agente de revalidação: `/root/rev5_r04_chrome151`; parent: `/root`.
- Início: `2026-09-15T18:21:00-03:00`; fim: `2026-09-15T18:22:00-03:00`.
- HEAD auditado: `d12d4571799e97ca286f86fa716ce29b80709aaf`, com alterações locais de
  R18 ainda não commitadas.

### Evidência reproduzida

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts tests/browser/FocusVisibleInventory.browser.ts --reporter=verbose
Test Files  2 passed (2)
Tests  13 passed (13)

$ npx vitest run tests/themes/tokensMutationReal.test.ts tests/themes/textColorValidation.test.ts tests/components/MaxDarkModeContrast.test.ts --reporter=verbose
Test Files  3 passed (3)
Tests  85 passed (85)
```

O Chromium montou 19 fixtures autônomas, quatro estruturais, quatro
seletores e 32 fixtures restantes: `19 + 4 + 4 + 32 = 59` SFCs. As árvores
usam seus componentes de produção, slots, Pinia e router quando aplicável, e
o modo `reduce` é definido por CDP. O segundo comando preserva o foco em
claro/escuro/zoom/forced-colors e a matriz de contraste com mutação real.

### Lacuna encontrada na refutação

O aumento para 59 mounts é material, mas não fecha integralmente o contrato
da Etapa 10. Nos quatro testes por família, as 56 fixtures além das três
primitivas iniciais são verificadas de forma agregada: `some()` para uma
duração reduzida em algum descendente e `every()` para iteração. Não existe
assertiva individual de `transform`, duração e iteração para cada SFC. Além
disso, o lifecycle de entrada/saída é exercitado somente para `TransitionFade`
e `MaxTransitionUp`; os outros componentes classificados não têm ação de
abertura/fechamento ou transição individual seguida da verificação de término
nativo.

Assim, uma regressão de transform ou de lifecycle em qualquer um dos 56 SFCs
poderia continuar passando: basta que outro descendente no mesmo fixture
atenda à checagem agregada. A porta do servidor do Vitest também já estava em
uso e o runner escolheu outra automaticamente; a execução passou, mas isso
não elimina a lacuna de granularidade.

### Veredito da revalidação

**REJEITADO.** Contraste, foco e a montagem real 59/59 são aprovados, mas o
gate combinado exige medidas de estilo computado e lifecycle por componente
classificado, nos modos `no-preference` e `reduce`. R18 precisa tornar as
assertivas e as transições individualmente detectáveis antes de novo aceite.

- Papel: `GATE5-MOTION-CONTRAST` (somente leitura de código).
- Agente: `/root/gate5_motion_contrast`; parent: `/root`.
- Início: `2026-09-15T17:45:00-03:00`; fim: `2026-09-15T17:45:35-03:00`.
- HEAD auditado: `cabb5d710f452a8a27e34d92210a28261491f8ac` (`fixes/optimize-fix5`).
- Manifest: somente este relatório e a linha correspondente da matriz; nenhum arquivo de código alterado.

## Evidência executada

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts tests/browser/FocusVisibleInventory.browser.ts --reporter=verbose

Test Files  2 passed (2)
     Tests  9 passed (9)
Duration  2.93s
```

O Chromium real confirmou `prefers-reduced-motion` tanto em `reduce` quanto em
`no-preference`; os três alvos montados tiveram duração reduzida de `1e-05s`,
iteração `1`, transform computado aceitável e lifecycle de entrada/saída. O
segundo arquivo cobriu Tab em temas claro/escuro, zoom de 200%, contraste de
`MaxEmptyDiv` >= 4,5:1 e `forced-colors: active`.

```text
$ npx vitest run tests/themes/tokensMutationReal.test.ts tests/themes/textColorValidation.test.ts tests/components/MaxDarkModeContrast.test.ts --reporter=verbose

Test Files  3 passed (3)
     Tests  85 passed (85)
Duration  2.90s
```

O gate computado deriva pares do CSS compilado e cobre as variantes `solid`,
`outlined`, `text`, `link` e `dashed`, nove severidades, claro/escuro e os
estados default/hover/focus-visible/active/disabled. O teste de mutação em
memória alterou um token consumido e fez o mesmo gate falhar, portanto a
medição de contraste não é uma matriz morta.

## Lacuna impeditiva

Apesar de `motionReduced.browser.ts` inventariar 59 SFCs, ele monta apenas
três: `MaxAiIcon`, `TransitionFade` e `MaxTransitionUp`. Logo, não mede no
Chromium o estilo computado, transform, duração, iteração e lifecycle dos
outros 56 componentes classificados. Isso contraria a exigência da Etapa 10
de verificar todos os componentes classificados com `reduce` e
`no-preference`. O próprio bloco R18 permanece aberto/rejeitado na matriz;
não há evidência causal contra o baseline `aac16bca` para essa cobertura.

## Veredito

**REJEITADO.** O subgate de contraste é aceito, e a cobertura browser focal de
movimento passa, mas o gate combinado não pode aceitar R18 enquanto os 59 SFCs
não forem montados por fixtures reais (ou por famílias de fixtures que os
montem) e medidos no Chromium em ambas as preferências de movimento.

## Revalidação final integrada — 2026-09-15

**ACEITO.** A implementação final de R18 eliminou os alvos globais ambíguos:
cada um dos 59 SFCs é montado por fixture real e resolve seu alvo pelo contrato
nominal (raiz, `aria-controls`, sentinela de Teleport ou pseudo-elemento). Os
overlays exercitam abertura, fechamento e remoção antes do unmount.

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts tests/browser/FocusVisibleInventory.browser.ts --reporter=verbose

Test Files  2 passed (2)
     Tests  14 passed (14)
Duration  6.19s

$ npx vitest run tests/themes/tokensMutationReal.test.ts tests/themes/textColorValidation.test.ts tests/components/MaxDarkModeContrast.test.ts --reporter=verbose

Test Files  3 passed (3)
     Tests  85 passed (85)
Duration  2.81s
```

O Chromium confirmou `no-preference` e `reduce`, foco/forced-colors e os
contrastes com mutação real. `git diff --check` também passou.
