# REV5-R17 — refutação independente da matriz de contraste

## Identificação e manifesto

- Papel: `REV5-R17` (refutador independente de E10-02).
- Agente: `/root/rev5_r17`; parent: `/root`.
- Início: `2026-09-15T15:07:00-03:00`; primeira refutação: `2026-09-15T15:10:00-03:00`; revalidação: `2026-09-15T15:14:00-03:00`.
- HEAD inicialmente auditado: `107cef7a`; HEAD de revalidação: `519c5000`
  (`fix: valida contraste e foco por componentes reais`).
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

## Revalidação independente no HEAD corrigido

Comando:

```sh
./node_modules/.bin/vitest run tests/themes/tokensMutationReal.test.ts --reporter=verbose
```

Saída relevante:

```text
Test Files  1 passed (1)
Tests  49 passed (49)
Duration  1.05s
```

O mesmo teste compila `tokens.scss` e o SCSS extraído de `MaxButton.vue`.
`compilarComMutacao('--max-button-primary-action-content', '#aaaaaa')` passa
o CSS mutado à mesma `executarGateDeContraste()` e a execução falha com
`contraste insuficiente`; o CSS real é aprovado. Não há matriz de pares de
cores hardcoded no oráculo.

## Matriz auditada

| Família | Severidades | Estados verificados pelo gate | Resultado |
|---|---:|---|---|
| solid | 9 | repouso, hover, focus-visible, active, disabled | calculado/estrutural e aprovado |
| outlined | 9 | repouso, hover, focus-visible, active, disabled | calculado/estrutural e aprovado |
| text | 9 | repouso, hover, focus-visible, active, disabled | calculado/estrutural e aprovado |
| link | 9 | repouso, hover, focus-visible, active, disabled | calculado/estrutural e aprovado |
| dashed | 9 | repouso, hover, focus-visible, active, disabled | calculado/estrutural e aprovado |

## Veredito: ACEITO após revalidação

O reparo adicionou `validarEstadosSolidos()`, que verifica, para todas as nove
severidades e ambos os temas, o anel de `focus-visible`, a cascata de `active`
e o contrato de opacidade/herança de `disabled`. A ausência de regra `:active`
é agora uma condição explicitamente validada como herança do CSS de repouso,
não uma lacuna silenciosa. O estado ativo de `dashed` extrai e exige fundo
transparente, e `MaxButton.vue` contém a regra específica de
`dashed/whatsapp`, consumida pelo seletor individual da matriz.

A mutação em memória de `--max-button-primary-action-content` continua
quebrando a mesma `executarGateDeContraste()` que aprova o CSS real. Assim, o
caso adversarial falha em `aac16bca`, o HEAD reparado passa e E10-02 recebe
aceite integral.
