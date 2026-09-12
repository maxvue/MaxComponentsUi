# Plano de implementação — tokens acessíveis de seleção

## Objetivo e escopo

Unificar seleção de `MaxInputSelect` e `MaxListBox` em tokens semânticos com texto ≥4,5:1 nos dois temas e indicação adicional à cor. Preservar aliases `--blue-*` como compatibilidade.

## Fora de escopo

Não remover a rampa `--blue-*` pública, mudar lógica de seleção/virtualização ou revisar outros estados cromáticos fora dos dois componentes.

## Arquivos

- Alterar `src/themes/tokens.scss`, `MaxInputSelect.vue` e `MaxListBox.vue`.
- Alterar testes dos componentes e testes de contraste em `tests/themes/`.

## Dependências e ordem

1. Definir pares selection/content/hover/focus.
2. Aplicar aos dois componentes.
3. Validar estados combinados e virtualização.
4. Coordenar com foregrounds de ações/foco.

## Passos

1. Criar `--max-selection-background`, `--max-selection-content` e variantes hover/focus em root/dark.
2. Basear o claro em shade da marca que passe 4,5:1; escolher o par dark por cálculo, não inversão nominal.
3. Substituir `--blue-600`/`--background-0` apenas nos papéis de seleção.
4. Adicionar indicador não cromático coerente (ícone/check ou peso/borda) sem alterar altura.
5. Resolver foco+seleção com anel contrastante distinto do fundo.
6. Testar item normal, hover, selecionado, selecionado+focado e disabled.

## Migração e testes

Tokens novos são aditivos; props/slots/emits permanecem. Overrides visuais migram aos tokens de seleção. Unitários verificam estados; testes matemáticos usam cores resolvidas; browser/axe cobre claro/escuro e virtualização. Benchmark não se aplica.

## Aceite

Foreground/background selecionado ≥4,5:1; foco contra adjacências ≥3:1; seleção reconhecível sem cor; ambos componentes usam os mesmos tokens; aliases históricos permanecem.

## Riscos e rollback

Indicador adicional pode afetar layout; reservar espaço. Override incompleto pode falhar contraste; documentar pares. Rollback troca valores dos tokens, sem retornar aos aliases históricos.

## Validação final

Cálculo automatizado, snapshots dos estados, navegação por teclado, suíte dos dois componentes, stylelint e `git diff --check`.
