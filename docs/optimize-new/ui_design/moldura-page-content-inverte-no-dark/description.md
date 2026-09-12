# Moldura estrutural do PageContent inverte para quase branco no modo escuro

## Resumo

`MaxPageContent` usa `--blue-800` como moldura estrutural. A rampa `--blue-*` é invertida no tema escuro; assim, o teal profundo do tema claro vira uma faixa quase branca no dark, rompendo a assinatura do shell azul-petróleo.

## Severidade e prioridade

- Severidade: média
- Prioridade: P2

## Evidências

- `src/components/MaxPageContent.vue:27-39`: a moldura usa `background-color: var(--blue-800)`.
- `src/themes/colors.scss:491`: `--blue-800` vale `#004860` no tema claro.
- `src/themes/colors.scss:1488`: no tema escuro, o mesmo token vale `#EEF8FB`.
- `tests/components/MaxPageContent.scroll.test.ts:16-34` cobre DOM/scroll, sem as cores dos dois temas.

## Componentes e consumidores afetados

Toda página desktop montada com `MaxPageContent`, especialmente quando composta com `MaxContainerApp` e menus de shell.

## Causa-raiz

Um shade de rampa invertível foi usado como token de papel estrutural fixo. O nome `blue-800` descreve intensidade no claro, não o significado “moldura do shell”.

## Impacto visual e funcional

No dark, surge um halo claro ao redor do conteúdo e a continuidade visual com `--layout-shell-bg: #003048` desaparece. A mudança também altera drasticamente a percepção de elevação da área interna.

## Reprodução e verificação

Renderizar `MaxPageContent`, alternar `.dark` no elemento raiz e comparar a moldura com `MaxContainerApp`/menus adjacentes.

## Direção recomendada

Criar token semântico de moldura/shell com valores deliberados por esquema ou manter o azul-petróleo estrutural quando esse for o papel pretendido.

## Critérios de aceite

- Moldura mantém relação visual deliberada com o shell nos dois temas.
- Não deriva diretamente de um shade cuja escala é invertida.
- Há teste visual ou de valores resolvidos em claro e escuro.

## Contraevidências consideradas

A superfície interna usa `--background-0` e se adapta corretamente. O achado limita-se à faixa estrutural externa baseada em `--blue-800`.
