# Relatório — IMP5-R16 (E10-03 / E10-04)

- Papel: `IMP5-R16` (implementação)
- Agente: `/root/imp5_r16`
- Parent: `/root`
- Início: `2026-09-15T14:58:00-03:00`
- Fim: `2026-09-15T15:04:00-03:00`
- HEAD auditado: `288db2242e066d97011664e994b3bdff61c80481`
- Status: **concluído — aguarda refutação independente REV5-R16**

## Manifesto

`src/themes/all.scss`; estilos dos componentes de entrada, autocomplete, data,
OTP, tabela, aba e listbox; `tests/architecture/focusVisibleInventory.test.ts`;
`tests/themes/textColorValidation.test.ts`; `tests/components/MaxInputTextArea.test.ts`;
este relatório, inventário e matriz. Não foram alterados `package.json` nem lockfile.

## Reprodução e correção

O inventário anterior aceitava uma menção genérica de `:focus` e não vinculava
o alvo que recebe Tab ao seletor que o estiliza. Também persistiam usos de
`--background-650` em placeholders, sublabels, weekday, estado hover e texto
de carregamento habilitado.

O parser de templates agora extrai tag, classes, role/tabindex e descarta
alvos disabled/tabindex -1. Ele confronta cada alvo com a política local ou a
rede global canônica de elementos tabuláveis em `all.scss`; esta rede fornece
outline, offset e ring por tokens, sem apagar estilos específicos. O gate
também falha se algum `--background-650` de componente não estiver na lista
de exceções documentada.

Foram migrados conteúdos habilitados para `--max-content-placeholder` ou
`--max-content-secondary`; o hover de aba passa a usar o texto forte 775. As
exceções restantes (disabled, decorativas, compatibilidade e primitivas) estão
em `R16-background-650-inventory.md`.

## Evidências

| Comando | Resultado |
|---|---|
| `npx vitest run tests/architecture/focusVisibleInventory.test.ts tests/themes/textColorValidation.test.ts tests/components/MaxInputTextArea.test.ts` | passou: 3 arquivos, 53 testes |
| `npm run test:browser -- tests/browser/FocusVisibleInventory.browser.ts` | passou: Chromium, 1 arquivo, 6 testes (Tab, claro/escuro, forced-colors e zoom 200%) |
| `npx eslint ...` | passou nos testes alterados |
| `npx stylelint ...` | passou nos estilos alterados |
| `git diff --check` | passou |

O cenário Chromium usa `MaxButton`, `MaxLikeButton` e `InputBase` reais, além
das famílias DOM ARIA/nativas derivadas pelo inventário. A validação mede CSS
computado, não somente texto SCSS.

## Risco e rollback

A regra global é limitada a elementos que efetivamente entram na navegação de
teclado e só em `:focus-visible`; políticas locais continuam prevalecendo.
Rollback: reverter este conjunto de arquivos, preservando o inventário como
referência de auditoria.
