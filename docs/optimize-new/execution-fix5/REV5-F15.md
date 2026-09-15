# REV5-F15 — Refutação independente de E06-03 e E08-04

## Identificação

- Papel: `REV5-F15` (refutação, somente leitura de código; evidência documental abaixo).
- Agente: `/root/rev5_f15`; parent: `/root`.
- Início: `2026-09-15T14:36:00-03:00`; fim: `2026-09-15T14:38:20-03:00`.
- Referência adversarial: `aac16bca`.
- HEAD auditado: `41c526941508ddb72c72f1bf31f86d2d2e99bbb4`.

## Caso adversarial

O caso exercita `MaxTagSelect` em `isButton` no navegador: foco por Tab, ativação por Enter e Espaço, fechamento por Escape, contador de `before-show` exatamente uma vez por ativação e uma instância `disabled` que não pode abrir a listbox. Também exige que o botão tenha o nome `Gerenciar categorias`.

Ele é capaz de falhar na referência `aac16bca`: naquela revisão, `MaxTagSelect.vue` mantinha simultaneamente `@click.stop="toggle"` no contêiner e não tinha `@click.stop="toggle"` no `MaxIconButton`. Um Enter/Espaço em botão nativo despacha o clique que alcança o contêiner; a mudança de estado pode então ser observada por dois caminhos quando a emissão do componente também ocorre. A asserção de listbox aberta e `beforeShowCalls === 1` após cada ativação detecta essa reentrada. O diff contra a referência confirma que o HEAD restringe os handlers do contêiner a `!props.isButton` e torna o botão o único acionador.

Para E08-04, foram testados inventários dinâmicos sem `ariaLabel`, `label`, `title` ou tooltip. As suítes focais verificam os nomes contextuais/posicionais de barra superior, submenu e ações de tabela, impedindo `undefined` e os antigos fallbacks genéricos.

## Comandos e saída

```text
$ npm run test:browser -- tests/browser/MaxTagSelect.browser.ts
Test Files  1 passed (1)
Tests  5 passed (5)
Duration  2.89s

$ npx vitest run tests/unit/MaxTagSelect.spec.ts tests/unit/MaxIconButton.spec.ts tests/unit/MaxTopToolbar.spec.ts tests/components/MaxTopToolbarSubmenu.test.ts tests/components/MaxTableFields.test.ts --reporter=dot
Test Files  5 passed (5)
Tests  98 passed (98)
Duration  1.85s

$ git diff aac16bca..HEAD -- src/components/MaxTagSelect.vue src/components/MaxTopToolbar.vue src/components/MaxTopToolbarSubmenu.vue src/components/MaxTableFields.vue
MaxTagSelect: handlers do wrapper passaram a usar !props.isButton; MaxIconButton recebeu @click.stop="toggle".
MaxTopToolbar/MaxTopToolbarSubmenu: fallback passou a Item <n> contextual.
MaxTableFields: cada ação recebe getButtonAriaLabel(...), incluindo linha e posição.

$ git diff --check
exit 0
```

## Veredito

**ACEITO.** O cenário Chromium passou no HEAD, a reentrada é refutada contra `aac16bca`, e os três inventários de icon-buttons têm nomes acessíveis específicos para dados incompletos. Não houve edição de código ou testes por este papel.
