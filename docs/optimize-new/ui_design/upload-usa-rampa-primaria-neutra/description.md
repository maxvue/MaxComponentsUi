# Ação de upload resolve para a rampa primária neutra em vez da marca

## Resumo

`MaxInputFileUpload` usa `--primary-500`, `--primary-c` e `--primary-mouse` em spinner, CTA e dragover. Esses aliases existem e apontam para a rampa neutra, portanto os fallbacks nunca entram e a ação aparece cinza, divergindo das ações teal.

## Severidade e prioridade

- Severidade: alta
- Prioridade: P1

## Evidências

- `src/themes/colors.scss:783-787`: `--primary-500: #B8BFCA` e `--primary-600: #99A1AD`.
- `src/themes/colors.scss:1037-1040`: `--primary-c` e `--primary-mouse` são aliases neutros.
- `src/components/MaxInputFileUpload.vue:363-370`, `384-405` e `582-584`: spinner, CTA, hover e dragover consomem esses tokens.
- O GEMINI documenta que `--primary-*` é compatibilidade neutra e `--max-primary-*` representa ações da marca.

## Componentes e consumidores afetados

`MaxInputFileUpload` nos estados de repouso, hover, loading e dragover.

## Causa-raiz

Aliases históricos foram preservados corretamente, mas o componente continuou atribuindo a eles o significado de ação primária. Como as variáveis existem, os fallbacks não corrigem a resolução real.

## Impacto visual e funcional

A ação principal de envio parece secundária/desabilitada e quebra a consistência com `MaxButton` e demais inputs de ação.

## Reprodução e verificação

Renderizar com os temas distribuídos e inspecionar o fundo computado: no claro resolve `#B8BFCA`, não `#00768E`; no dark continua neutro claro.

## Direção recomendada

Migrar somente papéis de ação/estado para `--max-primary-*`, mantendo aliases e classes legadas onde forem contrato público.

## Critérios de aceite

- CTA, spinner e dragover usam a família teal canônica nos dois temas.
- Hover e foreground têm contraste validado.
- Testes verificam tokens resolvidos.

## Contraevidências consideradas

`--primary-*` não deve ser removido globalmente: é namespace de compatibilidade documentado. O defeito é seu uso como ação de marca neste componente.
