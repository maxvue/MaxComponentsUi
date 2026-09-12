# Plano de implementação — contraste estável de ações semânticas

## Objetivo e escopo

Definir foreground explícito por severidade/tema para todos os botões sólidos habilitados, com contraste mínimo 4,5:1 em repouso e hover. Preservar aliases/classes e ícones por `currentColor`; disabled fica fora do requisito normativo principal.

## Fora de escopo

Não redesenhar variantes outlined/text/disabled, remover aliases `.p-button-*` ou revisar contrastes de componentes que não reutilizam ações sólidas.

## Arquivos

- Alterar `src/themes/tokens.scss` e `src/components/MaxButton.vue`.
- Alterar `tests/components/MaxDarkModeContrast.test.ts` e testes de contraste em `tests/themes/`.
- Ajustar documentação de tokens/tema.

## Dependências e ordem

1. Calcular matriz de pares reais.
2. Aprovar tokens foreground por severidade e esquema.
3. Aplicar no botão.
4. Validar wrappers e estados. Coordenar com seleção/texto secundário para uma única matriz de contraste.

## Passos

1. Criar tokens `--max-<severity>-content` e, se necessário, `-hover-content` em root/dark.
2. Escolher foregrounds da identidade, evitando `--background-0` como inferência.
3. Aplicar a primary, secondary, success, info, warning, danger, whatsapp, help e contrast em repouso/hover.
4. Garantir que label/spinner/ícone herdem `currentColor`.
5. Criar helper de teste que resolve variáveis e calcula luminância, sem apenas procurar strings.
6. Testar wrappers que usam `MaxButton` e overrides de tema.

## Migração e testes

Tokens são aditivos; classes e props não mudam. Overrides antigos de `--background-0` deixam de controlar foreground do botão, devendo migrar aos novos tokens. Testes unitários/visuais cobrem claro/escuro, hover/focus e todos os tipos; a11y mede 4,5:1. Benchmark não se aplica.

## Aceite

Todas as severidades sólidas habilitadas atingem ≥4,5:1 em ambos os temas/hover; ícones têm o mesmo par; nenhum estilo sólido usa `--background-0` como foreground genérico.

## Riscos e rollback

Foreground correto pode divergir da expectativa de marca; validar visualmente. Overrides podem quebrar contraste; documentar pares. Rollback restaura token por severidade específico, não a inferência global.

## Validação final

Testes matemáticos e snapshots visuais, axe/inspeção de CSS computado, suíte, stylelint, type-check e `git diff --check`.
