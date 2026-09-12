# Tipografia legada Jost fragmenta controles compactos

## Resumo

A biblioteca aplica `Quicksand, sans-serif` globalmente, mas `MaxInputToggle`, `MaxTable` e `MaxTableFields` forçam `Jost, sans-serif`. Jost não é carregada nem integra o fallback público, de modo que esses componentes podem resolver para métricas diferentes conforme as fontes instaladas no sistema. A ausência de um webfont Quicksand embutido, isoladamente, não é defeito demonstrado: bibliotecas podem delegar o carregamento ao consumidor; esse contrato apenas precisa estar documentado.

## Severidade e prioridade

- Severidade: média.
- Prioridade: P2.

## Evidências

- `src/themes/font.scss:1-5`: a família global efetiva é `Quicksand, sans-serif`.
- `src/themes/app.scss:6-7`: o fallback público começa por Quicksand e não inclui Jost.
- `src/components/MaxInputToggle.vue:138-144`: a label força `Jost` com `!important`.
- `src/components/MaxTable.vue:752-818` e `MaxTableFields.vue:328-354`: cabeçalho e corpo também forçam Jost.
- Não há `@font-face`, import de webfont ou asset Jost no repositório.

## Componentes e consumidores afetados

`MaxInputToggle`, `MaxTable`, `MaxTableFields` e layouts que os alinham com inputs e títulos em Quicksand.

## Causa-raiz

Declarações locais do período anterior à consolidação da tipografia permaneceram em componentes compactos. Como Jost não possui papel tipográfico documentado, o fallback de plataforma passa a definir suas métricas.

## Impacto visual e funcional

Tabelas e toggles podem divergir do restante da biblioteca; largura de texto, alinhamento e densidade variam entre ambientes que têm ou não Jost instalada.

## Reprodução e verificação

Abrir os componentes em ambiente sem Jost instalada e inspecionar a família efetivamente renderizada. Comparar cabeçalho/corpo com labels de `InputBase` e títulos adjacentes.

## Direção recomendada

Remover as exceções e herdar a tipografia canônica, salvo se Jost receber papel explícito, carregamento e documentação. Separadamente, documentar se o pacote ou o consumidor é responsável por disponibilizar Quicksand.

## Critérios de aceite

- Componentes compactos resolvem para a família canônica definida pelo tema.
- Nenhuma família adicional é forçada sem papel e contrato documentados.
- Teste visual compara alinhamento de tabelas e toggles com formulários.
- A responsabilidade pelo carregamento de Quicksand fica explícita para consumidores.

## Contraevidências consideradas

- Uma biblioteca não precisa necessariamente embutir webfonts; por isso, a antiga alegação de que Quicksand não carregada era defeito foi retirada.
- Fontes monoespaçadas em editores e dados numéricos possuem papel funcional e não fazem parte deste achado.
