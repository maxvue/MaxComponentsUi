# Texto secundário compacto fica abaixo do contraste mínimo no tema claro

## Resumo

A escala de texto institucional atribui `--background-650` a placeholders e conteúdo fraco. No tema claro esse token vale `#74869A`, que sobre branco produz aproximadamente 3,74:1. O valor é usado em textos de 12 px e 0,75 rem que não são meramente decorativos, abaixo de 4,5:1.

## Severidade e prioridade

- Severidade: alta
- Prioridade: P1

## Evidências

- `src/themes/colors.scss:725` e `src/themes/colors.scss:751`: superfície branca e `--background-650: #74869A`.
- `src/components/InputBase.vue:233-240`: placeholders de toda a anatomia compartilhada usam `--background-650`.
- `src/components/InputBase.vue:341-364`: mensagem de ajuda tem 12 px; seu token `--max-surface-400` é ainda mais claro no esquema claro (`#94a3b8`, em `src/themes/tokens.scss:48`).
- `src/components/MaxInputCodeToolbar.vue:307-319`: botões compactos de 28 px usam `--background-650` como ícone em repouso.
- `src/components/MaxInputMarkdown.vue:602-610`: blockquote informativo usa `--background-650`.
- `tests/themes/textColorValidation.test.ts:106-181` cristaliza a associação nominal dos tokens, mas não valida contraste.

## Componentes e consumidores afetados

`InputBase` e seus inputs concretos, toolbars compactas, sublabels, empty states, placeholders, mensagens auxiliares e qualquer consumidor da matriz de texto `650/700/750/775`.

## Causa-raiz

A hierarquia cromática foi testada como convenção de nomes, não como pares foreground/background com tamanho e peso reais. O nível 650 foi tratado simultaneamente como disabled (que pode ter exceções) e como texto informativo/placeholder habilitado (que precisa permanecer legível).

## Impacto visual e funcional

Informação contextual fica tênue demais, especialmente em telas de baixo contraste, brilho alto e para pessoas com baixa visão. A densidade compacta da biblioteca agrava o problema porque grande parte desse texto tem 12 px.

## Reprodução e verificação

No tema claro, renderizar um input habilitado com placeholder e mensagem, capturar cores computadas e medir contraste contra a superfície real. Repetir para sublabels e ícones acionáveis que usam 650.

## Direção recomendada

Separar tokens de conteúdo fraco habilitado e conteúdo disabled; escurecer o primeiro no tema claro ou escolher pares contextuais que atinjam contraste. Preservar a escala compacta sem depender de redução de opacidade.

## Critérios de aceite

- Placeholders, ajuda e sublabels habilitados atingem 4,5:1 no fundo efetivo.
- Conteúdo acionável por ícone atinge ao menos 3:1 como componente gráfico, preferencialmente 4,5:1 quando comunica texto.
- Testes de tema verificam razões de contraste dos pares canônicos em claro e escuro.

## Contraevidências consideradas

- `--background-700` (`#5D6F83`) atinge cerca de 5,16:1 sobre branco; o problema não abrange toda a matriz.
- Conteúdo realmente desabilitado pode ser dispensado do requisito; o achado restringe-se aos usos habilitados e informativos.
