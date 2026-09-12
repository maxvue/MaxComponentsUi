# Plano de implementação

## Objetivo e resultado esperado

Transformar `useInputValidation` em fonte compartilhada de uma política explícita `touched`/`dirty`/`submitted` e migrar os inputs por etapas, produzindo o mesmo momento de exibição e remoção de erro para campos equivalentes.

## Escopo e fora de escopo

- Em escopo: helper e inputs Text, Number, Chips, ColorPicker, CPF/CNPJ, CEP, cartão e validade de cartão.
- Fora de escopo: validação de formulários externos, texto de regras específicas e remoção imediata de APIs legadas.

## Arquivos a alterar/criar

- `src/helpers/useInputValidation.ts`
- `src/components/MaxInputText.vue`, `MaxInputNumber.vue`, `MaxChips.vue`, `MaxColorPicker.vue`
- `src/components/MaxInputCpfCnpj.vue`, `MaxInputCep.vue`, `MaxInputCreditCard.vue`, `MaxInputCreditCardDate.vue`
- `tests/helpers/useInputValidation.test.ts`
- Testes homônimos dos componentes em `tests/components/`

## Dependências e ordem

1. Especificar política e compatibilidade no helper.
2. Migrar inputs genéricos.
3. Migrar formatos especializados.
4. Comparar todos em testes parametrizados.

## Passos de implementação

1. Adicionar refs `touched`, `dirty` e `submitted` ao helper, com métodos `onBlur`, `onInput` e `submit`; separar validade bruta de visibilidade do feedback.
2. Definir política: não mostrar erro required no mount; validar após blur ou submit; após primeiro erro, atualizar/recolher feedback enquanto o usuário corrige; overrides `done`, `caution` e mensagens continuam prioritários.
3. Tratar vazio opcional como estado neutro (`done=null`, sem caution) e vazio obrigatório tocado/submetido como inválido; tornar a mensagem required de CEP alcançável sob essa regra.
4. Centralizar comparação `targetValue`, required e resolução de mensagens, permitindo validators específicos retornarem válido, inválido ou incompleto.
5. Migrar Text/Number/Chips/ColorPicker removendo refs/computeds duplicados e encaminhando eventos reais ao helper.
6. Migrar CPF/CNPJ, CEP e cartão/data preservando máscara, estado “incompleto antes do blur”, validação de formato completo e emits `complete`.
7. Manter adaptadores para props legadas e documentar precedência; adicionar aviso de desenvolvimento apenas para combinações contraditórias.
8. Criar matriz compartilhada de cenários para evitar novas divergências entre componentes.

## Migração e compatibilidade

Preservar props `done`, `caution`, `error`, `required`, `targetValue`, aliases de mensagem e emits. A mudança deliberada é postergar erro required que hoje aparece no mount; disponibilizar modo legado temporário se consumidores dependerem desse timing e registrar depreciação.

## Testes

- Unitários do helper: mount, input, blur, submit, correção, vazio opcional/obrigatório, overrides e mensagens.
- Integração parametrizada: mesmos eventos geram mesmos estados nos oito componentes.
- Regressão: máscaras, valores com zero, formatos incompletos/completos, `complete`, model updates e anúncios do `InputBase`.

## Critérios de aceite mensuráveis

- O helper possui consumidores reais em todos os componentes listados.
- Campos required equivalentes não exibem erro no mount e exibem após blur/submit.
- Correção válida remove erro no próximo input em 100% da matriz.
- Não restam implementações duplicadas de `testIsDone` nos componentes migrados.

## Riscos e rollback

Alterar timing pode afetar snapshots e formulários que esperam erro imediato; mitigar com rollout por família e flag legada temporária. Cada migração deve ser revertível isoladamente enquanto o helper mantém contrato compatível.

## Validação final

Executar testes do helper e de todos os inputs listados, lint/typecheck e um formulário comparativo manual cobrindo mount, digitação, blur, submit, correção e reset.
