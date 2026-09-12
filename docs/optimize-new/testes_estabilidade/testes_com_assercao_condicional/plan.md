# Plano de implementação — tornar assertions obrigatórias

## Objetivo e resultado

Eliminar testes que ficam verdes quando elemento/evento esperado não existe. Cada caso deve falhar claramente ao remover o contrato nomeado.

## Escopo e fora de escopo

- Corrigir os testes citados de CEP, Number, DatePicker e TopMenuSearchBar.
- Fazer varredura por guards silenciosos equivalentes.
- Não alterar produção para acomodar testes nem reescrever suítes não relacionadas.

## Arquivos

- Alterar `tests/components/MaxInputCep.test.ts`, `MaxInputNumber.test.ts`, `MaxInputDatePicker.test.ts` e `MaxTopMenuSearchBar.test.ts`.
- Criar helper de assertion somente se repetição justificar, em `tests/helpers/`.

## Dependências e ordem

1. Enumerar guards.
2. Fixar pré-condições incondicionais.
3. Validar por mutação controlada/revisão.
4. Rodar varredura global.

## Passos

1. Substituir `if (emitted)` por `expect(emitted).toBeDefined()`, contagem exata/mínima e acesso seguro após assertion.
2. Substituir guards de `inputs.length` por assertion de quantidade e seleção explícita.
3. Afirmar existência de `closeBtn` antes do trigger e sempre verificar fechamento.
4. Usar `expect.hasAssertions()` apenas como defesa adicional, não no lugar da assertion de contrato.
5. Remover testes vazios/comentários sem expectativa ou convertê-los em comportamento verificável.
6. Buscar condicionais sobre `exists`, `emitted`, `length` e optional chaining que possam suprimir expectativa.

## Migração e testes

Sem impacto público. Rodar os quatro arquivos isoladamente e simular temporariamente ausência do elemento/evento para confirmar falha; reverter a mutação. A11y/benchmark não se aplicam.

## Aceite

- Nenhum caso citado contém assertion principal condicional.
- Todos possuem ao menos uma assertion incondicional do elemento/evento.
- Remover emissão/input/botão faz o teste correspondente falhar.
- Varredura não encontra padrão silencioso equivalente sem justificativa.

## Riscos e rollback

Assíncrono não aguardado pode parecer ausência; usar `nextTick`/timers corretos, não afrouxar expectativa. Contagem excessivamente exata pode ser frágil quando contrato permite várias emissões; testar payload final e mínimo documentado. Rollback somente da assertion específica se provar contrato diferente.

## Validação final

Executar quatro suítes, suíte completa, busca estática pelos padrões e `git diff --check`.
