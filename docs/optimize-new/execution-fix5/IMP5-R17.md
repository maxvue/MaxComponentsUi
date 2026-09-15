# IMP5-R17 — matriz de contraste computada

## Escopo entregue

- Ações `solid`, `outlined`, `text`, `link` e `dashed`, para todas as nove
  severidades, nos temas claro e escuro.
- Estados `repouso`, `hover`, `focus-visible`, `active` e `disabled`. O estado
  desabilitado exige a redução de opacidade e a herança da cor; contraste de
  texto inativo é exceção normativa WCAG.
- Os estados sólidos também percorrem `focus-visible`, `active` e `disabled`:
  `active` é verificado como herança explícita da cascata quando não existe
  regra própria. Para `dashed`, o seletor compilado `:active` é validado como
  transparente. WhatsApp possui foreground próprio inclusive em `dashed`.
- O gate compila `tokens.scss` e o estilo real de `MaxButton.vue`, resolve
  variáveis contra `colors.scss` e calcula a razão WCAG. Não mantém pares de
  cores como oráculo no teste.

## Correção visual

As variantes transparentes agora possuem foreground semântico por severidade e
tema (`--max-button-*-action-content`). Isso impede que o foreground de botão
sólido seja usado sobre a superfície da página, em especial no tema escuro.

## Evidência

Comando executado no worktree:

```text
npx vitest run tests/themes/tokensMutationReal.test.ts --reporter=dot
Test Files  1 passed (1)
Tests  49 passed (49)
```

O teste de mutação altera `--max-button-primary-action-content` somente em
memória para `#aaaaaa`. O CSS real passa no mesmo `executarGateDeContraste()`;
o CSS mutado falha por `contraste insuficiente`.
