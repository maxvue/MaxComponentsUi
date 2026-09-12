# Plano de implementação — token semântico da moldura de conteúdo

## Objetivo e resultado esperado

Desvincular a moldura de `MaxPageContent` da rampa invertível `--blue-*` e atribuir-lhe um token de papel do shell, com azul-petróleo deliberado em claro e escuro.

## Escopo e fora de escopo

- Escopo: token de moldura, uso no componente e regressão claro/escuro.
- Fora: mudar superfície interna, dimensões, scroll ou toda a rampa `--blue-*`.

## Arquivos-alvo

- `src/themes/colors.scss` para `--layout-content-frame-bg` nos dois esquemas.
- `src/components/MaxPageContent.vue`.
- `tests/components/MaxPageContent.scroll.test.ts` e novo `tests/themes/layoutShellColors.test.ts` se necessário.

## Dependências e ordem

1. Aprovar visualmente a relação moldura/shell em ambos os temas.
2. Materializar o token semântico.
3. Migrar o componente e cobrir valores resolvidos.
4. Incluir cenário no playground canônico.

## Passos detalhados

1. Definir `--layout-content-frame-bg` junto aos tokens `--layout-shell-*`, mantendo o papel estrutural escuro sem derivar de shade invertível.
2. Usar no claro valor equivalente à moldura atual (`#004860`) ou ajuste aprovado; no dark usar teal profundo coerente com `--layout-shell-bg`, não tom quase branco.
3. Substituir `var(--blue-800)` no componente pelo novo token com fallback institucional seguro.
4. Testar a composição com `MaxContainerApp`, menus e a superfície `--background-0`.

## Migração e compatibilidade

- Sem mudança de props, DOM, dimensões ou rolagem.
- Novo custom property é aditivo e pode ser sobrescrito pelo host.
- `--blue-800` permanece para seus demais usos históricos.

## Testes pertinentes

- Resolver CSS em `:root` e `.dark`; nenhum resultado pode ser `#EEF8FB` para a moldura.
- Snapshot visual desktop claro/escuro e mobile sem moldura arredondada.
- Verificar contraste/continuidade perceptual com shell e distinção da superfície interna.
- A11y e benchmark não se aplicam; manter teste de scroll.

## Critérios de aceite

- `MaxPageContent` não referencia `--blue-800`.
- Token semântico existe nos dois temas e produz cor estrutural aprovada.
- Claro/escuro não mostram halo claro inesperado.
- Testes, stylelint e build passam.

## Riscos, rollback e validação final

- Risco: moldura perder separação da superfície no dark. Mitigar com screenshot e aprovação do par completo.
- Rollback: ajustar valor do token, sem voltar ao shade invertível.
- Validar temas, shell adjacente, viewport móvel, scroll e CSS distribuído.
