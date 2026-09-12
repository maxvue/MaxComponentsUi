# Virtual scroller impõe semântica de seleção sem implementar seleção

## Resumo
`MaxBaseVirtualScroller` declara listbox/options incondicionalmente, embora seja infraestrutura genérica e não implemente foco, seleção ou teclado.

## Severidade e prioridade
Alta — P1. WCAG 1.3.1 e 4.1.2.

## Evidências
`src/components/base/MaxBaseVirtualScroller.vue:2-15` fixa roles e posição/tamanho, sem tabindex, nome, `aria-selected`, active descendant ou handlers. `tests/components/base/MaxBaseVirtualScroller.test.ts:138-152` valida apenas a presença literal dos roles.

## Afetados
Todo consumidor da base, inclusive conteúdo meramente virtualizado e não selecionável.

## Causa-raiz
Semântica específica do domínio foi colocada na infraestrutura de renderização, sem contrato de comportamento correspondente.

## Impacto e reprodução
Montar uma lista somente informativa: leitor anuncia listbox/options operáveis, mas teclado não consegue interagir ou selecionar.

## Direção de correção
Base neutra por padrão; papéis e estados configuráveis e pertencentes ao consumidor, ou implementação completa do padrão quando selection for habilitada.

## Critérios de aceite
Role sempre corresponde ao comportamento; listbox possui nome, foco, seleção e teclado; conteúdo neutro não é anunciado como widget.

## Contraevidências
`aria-setsize/posinset` estão corretos para uma opção real, mas não bastam para criar um listbox.
