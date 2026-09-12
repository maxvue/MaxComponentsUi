# Tooltip apaga descrições ARIA preexistentes

## Resumo
A diretiva substitui todo `aria-describedby` ao abrir e remove o atributo ao fechar, perdendo IDs de ajuda/erro definidos pelo consumidor.

## Severidade e prioridade
Alta — P1. WCAG 1.3.1 e 4.1.2.

## Evidências
`src/directives/tooltip.ts:124` usa `setAttribute` com um único ID; `:150` remove o atributo inteiro. `tests/directives/tooltip.test.ts:267-275` cobre apenas o caso simples, não preservação.

## Afetados
Todo elemento com `v-tooltip` e descrição já existente, especialmente campos e botões com ajuda/erro.

## Causa-raiz
A diretiva assume propriedade exclusiva do atributo em vez de gerenciar uma lista de tokens e restaurar estado.

## Impacto e reprodução
Montar `<button aria-describedby="ajuda" v-tooltip="Detalhe">`; focar e desfocar; o atributo termina ausente e a ajuda deixa de ser anunciada.

## Direção de correção
Capturar valor original, mesclar/remover somente o ID do tooltip e restaurar exatamente no hide/unmount.

## Critérios de aceite
IDs anteriores sobrevivem a hover/foco/atualização/unmount; múltiplas descrições permanecem válidas.

## Contraevidências
A diretiva já usa `role=tooltip` e eventos focus/blur; o defeito é composição do atributo.
