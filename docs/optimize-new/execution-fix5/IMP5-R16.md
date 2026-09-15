# Relatório — IMP5-R16 (E10-03 / E10-04)

- Papel: `IMP5-R16` (implementação)
- Agente: `/root/imp5_r16`
- Parent: `/root`
- Início: `2026-09-15T14:58:00-03:00`
- Fim: `2026-09-15T15:13:00-03:00` (reparo pós-REV5-R16)
- HEAD auditado: `288db2242e066d97011664e994b3bdff61c80481`
- Status: **reparo pós-REV5-R16 concluído — aguarda revalidação pelo mesmo REV5-R16**

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

## Reparo após refutação REV5-R16

O refutador demonstrou que a antiga fixture inseria uma regra
`.r16-focus-family:focus-visible`, portanto não provava a folha de estilos da
biblioteca. A fixture não injeta mais nenhum `<style>`: ela coleta a ordem de
Tab diretamente do DOM montado e, para cada elemento encontrado, mede
`outline`/`box-shadow` computados após teclado. A política usada é a folha
real `themes/all.scss`, e a fixture inclui `MaxButton`, `MaxLikeButton`,
`InputBase` e `MaxEmptyDiv` reais.

`MaxEmptyDiv` deixou de ser exceção: seu texto e ícone agora usam
`--max-content-secondary`. O teste Chromium mede a razão calculada entre suas
cores computadas reais e exige 4,5:1 nos dois temas.

## Evidências

| Comando | Resultado |
|---|---|
| `npx vitest run tests/architecture/focusVisibleInventory.test.ts tests/themes/textColorValidation.test.ts tests/components/MaxInputTextArea.test.ts` | passou: 3 arquivos, 53 testes |
| `npm run test:browser -- tests/browser/FocusVisibleInventory.browser.ts` | passou: Chromium, 1 arquivo, 6 testes (DOM real/Tab, claro/escuro, forced-colors, zoom 200% e contraste computado do empty state) |
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
