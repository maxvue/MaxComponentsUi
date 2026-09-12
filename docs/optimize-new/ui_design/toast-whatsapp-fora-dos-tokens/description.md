# Toast de WhatsApp ignora os tokens oficiais do canal

## Resumo

A severidade WhatsApp usa tokens em `MaxButton`, mas `MaxToast` fixa `#128c7e`. O mesmo significado aparece em verdes diferentes e o toast não aceita tematização pelo contrato existente.

## Severidade e prioridade

- Severidade: baixa
- Prioridade: P3

## Evidências

- `src/themes/tokens.scss:29-30`: `--max-whatsapp-500: #25d366` e `--max-whatsapp-600: #1da851`.
- `src/components/MaxButton.vue:212-220`: ação WhatsApp consome os tokens.
- `src/components/MaxToast.vue:167-186`: demais severidades usam tokens, mas WhatsApp fixa `#128c7e`.
- `tests/components/MaxToast.test.ts:112-116`: teste valida classe, não valor/token.

## Componentes e consumidores afetados

Toasts WhatsApp e telas que os exibem ao lado de ações/badges do mesmo canal.

## Causa-raiz

O toast foi estilizado antes da consolidação dos tokens e não entrou no sweep posterior.

## Impacto visual e funcional

Inconsistência cromática e impossibilidade de customização central; o literal dificulta evolução coordenada do contraste.

## Reprodução e verificação

Renderizar botão e toast WhatsApp lado a lado; sobrescrever tokens e observar que só o botão muda.

## Direção recomendada

Fazer o toast consumir token deliberado do canal, possivelmente um shade próprio mais escuro para superfície sólida.

## Critérios de aceite

- Componentes derivam da mesma família semântica.
- Override afeta button/toast previsivelmente.
- Texto atinge 4,5:1 no shade escolhido.

## Contraevidências consideradas

`#128c7e` é reconhecível e contrasta melhor com branco que o shade 500; não deve ser trocado cegamente sem token apropriado.
