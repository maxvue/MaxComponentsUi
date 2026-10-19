# Plano de implementação — Issue #99

## Descrição e Causa Raiz

**Resultado da triagem: bug confirmado no código atual; correção necessária.** Este documento é somente planejamento. Nenhum código-fonte ou teste foi alterado nesta etapa.

Com `allowNegative=true` e `modelValue=-10`, colar `1.250,75` substitui os dígitos do valor, mas mantém o sinal negativo anterior. O componente calcula e emite `-1250.75` e formata `-R$ 1.250,75`, em vez de `1250.75` e `R$ 1.250,75`. Isso inverte o significado financeiro da entrada e também alimenta a validação de limites com o sinal errado. Não há evidência de persistência incorreta em algum consumidor específico; o defeito comprovado termina na apresentação e no evento público da biblioteca.

### Causa Raiz Comprovada

Referências verificadas na revisão atual:

1. `src/components/MaxInputMoney.vue:L154-174`: `syncFromModel(-10)` inicializa `isNegative.value=true` e `rawDigits.value='1000'` com duas casas decimais.
2. `src/components/MaxInputMoney.vue:L11-25`: o input nativo apresenta `currentDisplay` e encaminha `paste` para `onPaste`.
3. **Origem do defeito — `src/components/MaxInputMoney.vue:L281-290`, especialmente L287:** o handler extrai os dígitos, rejeita colagem sem dígitos e somente atribui `true` ao sinal quando o texto começa por `-` e negativos são permitidos. Não atribui `false` quando a nova colagem é positiva. Simultaneamente, substitui todos os dígitos anteriores, produzindo um estado híbrido: magnitude nova e sinal antigo.
4. `src/components/MaxInputMoney.vue:L214-225`: `emitCurrentValue` aplica o sinal retido aos dígitos novos, atualiza `temp_value` e emite `update:modelValue` com `-1250.75`.
5. `src/components/MaxInputMoney.vue:L180-185` e `L139-151`: `currentDisplay` aplica o mesmo sinal e a formatação pt-BR, resultando em `-R$ 1.250,75`.
6. `src/components/MaxInputMoney.vue:L189-204` e `src/helpers/useInputValidation.ts:L82-91,L150-153`: a validação consome `temp_value`, portanto recebe o valor financeiro já incorreto; não é a origem da mutação do sinal.

**Rastreamento reverso de dados:** exibição negativa e evento incorreto ← aplicação de `isNegative` em `currentDisplay`/`emitCurrentValue` ← `onPaste` substitui `rawDigits`, mas não redefine o sinal positivo ← `isNegative=true` inicializado por `modelValue=-10`. No sentido direto: `modelValue` do consumidor → estado local → colagem no input → estado local → apresentação, validação e evento `update:modelValue` → consumidor. **Store, API/Rotas, Controller/Service e DB: não participam deste fluxo local**; não inventar camadas de backend nem alterar consumidores para compensar o problema.

### Evidência de reprodução e lacuna de cobertura

Foi executada reprodução isolada em Node.js v24.18.0, via entrada padrão, sem criar arquivo de teste nem modificar o SFC. O procedimento extraiu diretamente do arquivo as funções `syncFromModel`, `onPaste`, `emitCurrentValue`, `formatDisplay` e `formatNumberString`, removeu apenas anotações TypeScript com `stripTypeScriptTypes` e usou `ref`/`computed` reais do Vue e `hasContent` real de `@maxvue/max-use`. A validação e o posicionamento do cursor foram substituídos por funções vazias; a captura de `emit` registrou o resultado. Não foi montagem do componente no DOM nem teste em navegador.

Resultado observado, com asserções confirmando o comportamento defeituoso:

```json
{
  "before": { "rawDigits": "1000", "isNegative": true },
  "prevented": true,
  "after": {
    "rawDigits": "125075",
    "isNegative": true,
    "temp_value": -1250.75,
    "display": "-R$ 1.250,75"
  },
  "emissions": [{ "event": "update:modelValue", "value": -1250.75 }]
}
```

A primeira tentativa desse diagnóstico não removeu os tipos e encerrou com `SyntaxError` antes de executar o fluxo; a execução corrigida acima concluiu com código zero. Isso não é falha do componente.

`tests/components/MaxInputMoney.test.ts:L164-176` cobre colagem positiva apenas a partir de `modelValue=null`, com negativos desabilitados por padrão. `L132-150` cobre alternância do sinal por teclado, mas não a substituição por colagem após valor negativo. A condição defeituosa continua presente no código atual, portanto a issue não está previamente corrigida nesta revisão.

## Arquivos afetados

| Arquivo | Alteração proposta na implementação futura |
| --- | --- |
| `src/components/MaxInputMoney.vue` | Corrigir exclusivamente a determinação do sinal em `onPaste`, preservando o restante do fluxo. |
| `tests/components/MaxInputMoney.test.ts` | Acrescentar regressões de substituição por colagem, sinais, entradas ignoradas e integração com o contrato do componente. |

`docs/issues/99/plan.md` é a única entrega desta etapa. Não alterar helpers compartilhados, estilos, manifesto, dependências, lockfile, stores, rotas ou banco de dados. Não gerar artefatos de distribuição para versionamento.

## Execuções propostas

1. Continuar na worktree dedicada/pré-alocada, preservando alterações de terceiros. Esta etapa de planejamento não autoriza implementação, commit, merge, push ou publicação.
2. Na execução futura autorizada, ampliar a suíte existente usando `mountInputMoney`, Pinia já configurado e `input.trigger('paste', { clipboardData: { getData: () => texto } })`, conforme o padrão de `L164-176`. Verificar o valor do input e o payload emitido; não testar apenas variáveis internas.
3. Trocar a atribuição condicional que somente ativa o sinal por uma atribuição booleana completa em `onPaste`:

   ```typescript
   isNegative.value = props.allowNegative && text.trim().startsWith('-');
   ```

   Manter essa atribuição **após** `if (!hasContent(digits)) return;` e **antes** da substituição de `rawDigits` e de `emitCurrentValue()`. Assim, cada colagem aceita determina seu próprio sinal; colagens ignoradas não modificam o estado anterior.
4. Preservar `preventDefault`, extração por `/\D/g`, limite de 15 dígitos, divisor configurado por `decimals`, emissão única, atualização de `temp_value`, validação e reposicionamento do cursor. Não modificar digitação incremental, `onNativeInput`, watcher ou política de formatação.
5. Preservar a regra existente de reconhecimento do sinal: somente `-` no início do texto após `trim()`, condicionado a `allowNegative`. Não ampliar o parser para formatos contábeis, separadores internacionais ou sinal em outras posições nesta issue.
6. Implementar todo o bloco de alteração e testes antes de executar testes, tipos ou build. Depois validar em lote, diagnosticar e corrigir falhas relacionadas em um único lote e revalidar apenas o necessário. Não executar gates após cada microedição nem ampliar o escopo para falhas de baseline sem causalidade e autorização.
7. Revisar o diff final, confirmar que somente os dois arquivos previstos de implementação foram alterados e manter os contratos públicos intactos. Preservar a worktree com integração pendente.

## Testes de regressão e validação em lote

Adicionar casos à suíte existente, preferencialmente parametrizados para combinações equivalentes:

| Cenário | Resultado obrigatório |
| --- | --- |
| `allowNegative=true`, inicial `-10`, colar `1.250,75` | Input `R$ 1.250,75`; evento `[1250.75]`, sem sinal herdado. |
| Mesma condição, colar `R$ 1.250,75`, `+1.250,75` ou texto positivo com espaços externos | Mesmo resultado positivo, mantendo o parser atual. |
| `allowNegative=true`, valor inicial positivo ou negativo, colar `-1.250,75` e `  -1.250,75  ` | Input `-R$ 1.250,75`; evento `[-1250.75]`. |
| `allowNegative=false`, colar texto positivo ou `-1.250,75` | Resultado positivo, preservando a proibição de negativos já existente. |
| Colagens sucessivas negativa → positiva → negativa → positiva | Exibição e eventos acompanham cada texto colado, sem dependência do sinal anterior. |
| Valor negativo ativo, colar `0,00` | Exibição `R$ 0,00`; evento com zero positivo, verificando também `Object.is(valor, -0) === false`. |
| Valor negativo ativo, colar texto vazio, espaços, apenas `-` ou letras sem dígitos | Valor exibido inalterado e nenhuma nova emissão; uma digitação posterior continua usando o sinal original. |
| Colagem aceita com `decimals=0` e `decimals=3` | Respeitar divisão por `10 ** decimals`, formatação e sinal do texto, sem mudar a máscara reversa. |
| Colagem com mais de 15 dígitos | Manter truncamento aos primeiros 15 dígitos, respeitando o sinal da nova entrada. |
| Consumidor realimentando o evento em `modelValue` | Após colar positivo sobre negativo e aguardar atualização Vue, modelo e input permanecem positivos. |
| `allowNegative=true`, inicial `-10`, `min=0`; colar `1.250,75` e disparar blur | Sem erro indevido de mínimo em `InputBase`; confirma que `temp_value` também foi corrigido. |

Para cada colagem aceita, comparar o número exato de novas emissões e seu payload. Para colagem ignorada, comparar a contagem antes/depois. Aguardar `trigger`/atualizações Vue para asserções sobre DOM; desmontar wrappers adicionais ao concluir os cenários.

Preservar integralmente os testes já existentes de símbolo, casas decimais, máscara reversa, bloqueio de caracteres, Backspace, alternância por `-`, atualização externa e validação obrigatória. Não reescrever asserções para acomodar o defeito.

Validação dimensionada para o lote, depois de implementar código e todos os testes:

```bash
npx vitest run tests/components/MaxInputMoney.test.ts
npm run type-check
npm run type-check:test
npm run lint
npm run test
```

A execução focada identifica conclusivamente a regressão; a suíte completa verifica componentes e helpers compartilhados. Não é necessário build durante a elaboração do plano. Se o fechamento da implementação exigir gate pré-release, usar `npm run verify`, que já agrega tipos, lint, build, testes/cobertura, navegador, consumidores, benchmarks e integridade/segurança: não repetir seus componentes sobre a mesma revisão sem falha ou dúvida concreta. Não executar publicação/release.

## Banco de dados

Nenhuma. O componente mantém estado local e emite `number | null`; não há persistência ou migration envolvida no defeito comprovado.

## Riscos de quebra e Não-Regressão

- **Mudança intencional de comportamento:** consumidores que inadvertidamente dependam do sinal antigo ao colar terão um resultado diferente. O sinal deve pertencer ao valor substituto, como estabelece a regra da issue; não preservar o bug como compatibilidade.
- **Colagem inválida alterando o sinal:** mover a atribuição para antes do retorno antecipado faria textos sem dígitos modificarem uma entrada válida. Preservar a ordem e testar continuidade da digitação após colagem ignorada.
- **Negativos proibidos ou negativos legítimos:** atribuir sempre `false` corrigiria apenas metade do contrato. A expressão precisa combinar `allowNegative` e o sinal explícito; cobrir as duas opções da prop e os dois sinais.
- **Modelo, exibição e validação divergentes:** testar o payload, o valor do input, a realimentação via `modelValue` e o erro de `min` em `InputBase`, não apenas a apresentação formatada.
- **Expansão acidental de escopo:** não mudar parsing de moeda, seleção parcial, reconhecimento de sinais, precisão numérica, `disabled`, teclado móvel/IME, cursor ou limites de valor. Questões independentes eventualmente observadas devem ser tratadas separadamente.
- **Contrato público:** manter props/defaults, tipos/eventos, `InputBase`, classes existentes, acessibilidade e imports atuais. Não introduzir PrimeVue, novas dependências nem referência local a `@maxvue/max-use`.

## Validação

**Prova conclusiva exigida na implementação:** `npx vitest run tests/components/MaxInputMoney.test.ts` deve terminar com código zero contendo a nova regressão montada no DOM: inicial `-10`, `allowNegative=true`, colagem `1.250,75`, input `R$ 1.250,75` e última emissão `[1250.75]`. A alteração cirúrgica deve ser a única mudança de produção necessária para essa regressão deixar de reproduzir o erro demonstrado.

Critérios adicionais: matriz de sinais/colagens acima aprovada; retorno antecipado e contratos existentes preservados; tipos, lint e suíte completa aprovados no lote, ou falhas não relacionadas explicitamente diagnosticadas sem declarar entrega verde. Se houver gate pré-release obrigatório, exigir também `npm run verify` concluído antes de considerar a implementação pronta para release.

**Estado desta etapa:** análise estática e reprodução isolada concluídas; montagem DOM da regressão, testes de projeto, tipos, lint e build não executados, pois a entrega solicitada é somente o plano. Não há correção aplicada ainda.

## Skills Aplicáveis

Skills curadas disponíveis a seguir na implementação, sem presumir skills inexistentes:

- `vue-debugging-best-practices`: rastreamento do estado reativo, evento nativo, modelo e apresentação.
- `vue-components`: preservação da Composition API, props e eventos tipados no SFC.
- `vue-typescript-best-practices`: tipos de eventos de colagem, wrappers e contrato `number | null`.
- `vitest-skill` e `vue-vitest-testing-best-practices`: testes Vitest/Vue Test Utils, simulação de colagem e sincronização assíncrona, adaptados à estrutura real `tests/components/` deste pacote.
- `vue-eslint-stylelint-quality-standards`: conformidade de formatação e lint, sem reformatar trechos alheios ao escopo.
- `code-review`: revisão final de causalidade, contratos e não regressão antes de integração.
- `technical-documentation-best-practices`: fidelidade das referências, do escopo e dos comandos do plano.
