# Testes passam sem executar sua asserção principal

## Resumo
Vários testes colocam toda validação dentro de `if` que depende justamente do elemento/evento esperado. Se a implementação deixar de renderizar ou emitir, o corpo não roda e o teste permanece verde.

## Severidade e prioridade
**Alta / P1.** São falsos positivos explícitos em contratos de input e navegação.

## Evidências
- `tests/components/MaxInputCep.test.ts:36-55`: testes de emissão só verificam payload dentro de `if (emitted...)`.
- `tests/components/MaxInputNumber.test.ts:76-93,105-133`: cinco validações dependem de `if (inputs.length > 0)`.
- `tests/components/MaxInputDatePicker.test.ts:45-52`: emissão também é opcional no teste.
- `tests/components/MaxTopMenuSearchBar.test.ts:54-75`: fechamento só é validado se o botão existir.

## Afetados
Suítes e contratos de `MaxInputCep`, `MaxInputNumber`, `MaxInputDatePicker` e `MaxTopMenuSearchBar`.

## Causa-raiz
Guards defensivos foram usados no teste no lugar de pré-condições/assertions obrigatórias.

## Impacto
Remover input, botão ou emissão pode não falhar os testes cujo nome afirma exatamente esse comportamento.

## Reprodução
Substituir conceitualmente o evento/elemento por ausência: a condição fica falsa, nenhuma expectation interna executa e o caso conclui sem erro.

## Direção de correção
Primeiro afirmar existência/quantidade do elemento ou evento; depois acessar com non-null assertion/helper que falhe claramente. Usar `expect.hasAssertions()` nos casos apropriados.

## Critérios de aceite
- Cada teste executa ao menos uma asserção incondicional do contrato nomeado.
- Mutação que remove emissão/input/botão faz o teste correspondente falhar.
- Busca por esses padrões não encontra guards silenciosos equivalentes.

## Contraevidências consideradas
Há testes correlatos em alguns componentes, mas eles não garantem os payloads/caminhos nomeados nesses casos específicos.
