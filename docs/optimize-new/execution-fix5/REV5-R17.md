# REV5-R17 — refutação independente da matriz de contraste

## Identificação e manifesto

- Papel: `REV5-R17` (refutador independente de E10-02).
- Agente: `/root/rev5_r17`; parent: `/root`.
- Início: `2026-09-15T15:07:00-03:00`; fim: `2026-09-15T15:10:00-03:00`.
- HEAD auditado: `107cef7a` (`fix: fortalece contraste e foco visível`).
- Referência adversarial: `aac16bca`.
- Manifesto: somente este relatório e a linha `REV5-R17` em
  `MATRIZ_ORQUESTRACAO.md` foram escritos. Produção e testes foram somente
  leitura.

## Caso adversarial e referência

O caso exige uma matriz computada para `solid`, `outlined`, `text`, `link` e
`dashed`, nas nove severidades, em claro/escuro e nos estados repouso, hover,
focus-visible, active e disabled. A mutação deve atingir um token realmente
consumido pelo mesmo gate.

Na referência `aac16bca`, `MaxButton.vue` usa `--max-primary-500` para as
ações transparentes e não existem tokens `--max-button-*-action-content` em
`tokens.scss`. Portanto o gate atual, que resolve esses tokens a partir do CSS
compilado, reprovaria a referência por cor não resolvida; a referência também
não contém `VARIANTES_TRANSPARENTES` nem `validarMatrizDeVariantes` no teste.
Essa é uma reprodução adversarial suficiente do E10-02.

## Execução independente no HEAD

Comando:

```sh
./node_modules/.bin/vitest run tests/themes/tokensMutationReal.test.ts --reporter=verbose
```

Saída relevante:

```text
Test Files  1 passed (1)
Tests  49 passed (49)
Duration  1.02s
```

O mesmo teste compila `tokens.scss` e o SCSS extraído de `MaxButton.vue`.
`compilarComMutacao('--max-button-primary-action-content', '#aaaaaa')` passa
o CSS mutado à mesma `executarGateDeContraste()` e a execução falha com
`contraste insuficiente`; o CSS real é aprovado. Não há matriz de pares de
cores hardcoded no oráculo.

## Matriz auditada

| Família | Severidades | Estados verificados pelo gate | Resultado |
|---|---:|---|---|
| solid | 9 | repouso, hover | calculado e aprovado |
| outlined | 9 | repouso, hover, focus-visible, active, disabled | calculado/estrutural e aprovado |
| text | 9 | repouso, hover, focus-visible, active, disabled | calculado/estrutural e aprovado |
| link | 9 | repouso, hover, focus-visible, active, disabled | calculado/estrutural e aprovado |
| dashed | 9 | repouso, hover, focus-visible, active, disabled | calculado/estrutural e aprovado |

## Veredito: REJEITADO

O bloco não satisfaz a matriz completa exigida. Para botões `solid`, o gate
somente enumera `repouso` e `hover` em `paresSolidosDoCssCompilado`; não
verifica `focus-visible`, `active` ou `disabled`. Nas variantes transparentes,
`active` não é extraído de regra CSS: recebe o mesmo cálculo de repouso, sem
provar que o estado existe ou que seu estilo computado preserva contraste.
Além disso, para `dashed/whatsapp` o seletor lido cai deliberadamente em
`.max-button.max-button-dashed`, isto é, a cor específica de severidade não é
auditada. O teste focal passar não fecha E10-02.

Correção necessária: derivar e verificar regras computadas para todos os cinco
estados de todas as famílias (incluindo solid), declarar explicitamente o
tratamento de active/disabled quando herdam estilo e fazer cada combinação
`dashed`/severidade apontar para seu seletor efetivo. Depois, repetir a mutação
contra esse mesmo gate expandido.
