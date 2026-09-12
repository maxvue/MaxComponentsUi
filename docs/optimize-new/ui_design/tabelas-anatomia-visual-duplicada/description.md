# Tabelas mantêm anatomia visual duplicada e ocultam feedback de inputs em célula

## Resumo

`MaxTable` e `MaxTableFields` duplicam cabeçalho de 40 px, layout flex/grid, zebra e tipografia Jost. A aparência coincide hoje, mas não deriva de primitiva/tokens compartilhados; adicionalmente, `MaxTable` esconde mensagens do `InputBase` dentro das células.

## Severidade e prioridade

- Severidade: média
- Prioridade: P2

## Evidências

- `src/components/MaxTable.vue:745-829`: anatomia de cabeçalho/corpo, altura 40 px e Jost.
- `src/components/MaxTableFields.vue:307-378`: repete a mesma anatomia e métricas.
- Ambos usam `--primary-25/100` para zebra/linha, enquanto a marca canônica usa `--max-primary-*` para seleção e ação.
- `src/components/MaxTable.vue:915-921`: mensagens/estados de `InputBase` em célula são ocultados com `display: none !important`.

## Componentes e consumidores afetados

`MaxTable`, `MaxTableFields` e edição inline com componentes derivados de `InputBase`.

## Causa-raiz

Duas implementações preservaram a aparência histórica separadamente após a migração, sem tokens anatômicos compartilhados. A densidade de célula foi obtida ocultando a camada de feedback do input.

## Impacto visual e funcional

Pequenas evoluções podem fazer as tabelas divergirem; validação inline desaparece e o usuário não vê erro/cautela/ajuda. A tipografia também fica fora do restante da biblioteca.

## Reprodução e verificação

Comparar ambas as tabelas lado a lado e inserir `InputBase` com erro/mensagem em uma célula de `MaxTable`; a mensagem fica invisível.

## Direção recomendada

Extrair tokens/primitivas de cabeçalho, linha, zebra, tipografia e densidade. Criar modo compacto explícito de feedback de célula em vez de ocultação total.

## Critérios de aceite

- Ambas as tabelas derivam dos mesmos tokens anatômicos.
- Erro/cautela em edição inline permanece perceptível e acessível sem quebrar altura.
- Testes visuais cobrem tabela normal, fields e input inválido em célula.

## Contraevidências consideradas

As dimensões e cores estão deliberadamente próximas hoje; classes `.p-*` são compatibilidade legítima. O achado trata duplicação sem contrato e ocultação de feedback, não os aliases.
