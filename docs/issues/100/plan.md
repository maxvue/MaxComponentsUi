# Plano de execução — Issue #100

## Descrição e Causa Raiz

**Veracidade: bug confirmado no código atual e reproduzido em runtime.** Em modo `auto`, os atalhos `%`, `$`, `r` e `R` reinterpretam o mesmo buffer numérico em outra unidade, mas não publicam o desconto e o preço recalculados. O consumidor recebe o novo tipo enquanto mantém os valores financeiros anteriores. A inconsistência pode afetar totais apresentados ou persistidos pela aplicação consumidora; não foi verificada uma aplicação externa nem uma persistência incorreta efetiva.

### Causa Raiz Comprovada

- `src/components/MaxInputDiscount.vue:L218-242`: `modelValue=10`, inicialmente em percentual, produz `digitsBuffer='100'`. O mesmo buffer significa `10` em percentual (divisor 10) e `1` em moeda (divisor 100).
- `src/components/MaxInputDiscount.vue:L168-185`: `userSelectedType` determina `effectiveActiveType`, com precedência sobre a prop de tipo.
- `src/components/MaxInputDiscount.vue:L256-272`: a máscara e o preço dependem do tipo ativo e do desconto calculado. Com bruto 1000, a troca de percentual para moeda muda a apresentação de `10,0 %` para `R$ 1,00` e o preço calculado de 900 para 999.
- **Ponto defeituoso:** `src/components/MaxInputDiscount.vue:L329-344`. Cada ramo altera `userSelectedType`, emite `update:type_discount` e `type-change` e retorna sem chamar `emitValues()`.
- **Contrato omitido:** `src/components/MaxInputDiscount.vue:L310-317`. `emitValues()` publica, nesta ordem, `update:modelValue`, `update:discount` e `update:price`, lendo os cálculos atuais.
- `src/components/MaxInputDiscount.vue:L450-502`: não existe watcher dos cálculos internos que compense a omissão. Os watchers observam props externas; o preço de montagem é emitido uma única vez. Não se deve depender de alterações externas para completar a sincronização de uma interação local.
- `src/components/MaxInputDiscount.vue:L416-440`: o clique no símbolo já emite os valores financeiros depois de alternar. Entretanto, ele converte o desconto equivalente e altera o buffer, diferentemente dos atalhos. Não reutilizar esse handler para corrigir o teclado.

### Rastreamento dos dados e limite da análise

Fluxo direto: `input @keydown` (`L29-46`) → `onKeyDown` (`L320-344`) → `userSelectedType` → `effectiveActiveType` → `currentDiscountValue`/`currentPrice` → máscara renderizada. O caminho de saída para o pai termina prematuramente nos dois eventos de tipo, sem os três eventos financeiros de `emitValues`.

Rastreamento reverso: desconto e preço do pai ← eventos públicos (`L157-163`, `L310-317`) ← desconto derivado do buffer/tipo (`L235-243`) e preço derivado do bruto/desconto/tipo (`L262-272`) ← props `discount`/`modelValue`/`default` e `gross`/`startValue` (`L187-192`, `L218-233`) e teclado. O retorno pai → filho acontece pelos watchers externos (`L450-497`).

**UI ⇄ Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB:** o fluxo comprovado termina no contrato de props/eventos do componente Vue. O componente importa apenas Vue e `InputBase` (`L69-70`), não acessa store, API, rotas, controller, service nem banco. Essas camadas são responsabilidade do consumidor e não devem ser inventadas ou alteradas neste plano.

### Reprodução realizada nesta etapa

Foi executado um script Node via entrada padrão, sem gravar arquivos: compilação em memória do script/template reais com `@vue/compiler-sfc` e TypeScript; montagem por Vue Test Utils em Happy DOM; apenas `InputBase` substituído por stub que repassa seu slot. A reprodução é isolada do layout e não equivale a teste em navegador real.

Props: `{ gross: 1000, modelValue: 10, type_discount: 'auto' }`.

| Etapa | Máscara observada | `update:modelValue` | `update:discount` | Histórico de `update:price` |
| --- | --- | --- | --- | --- |
| Montagem | `10,0 %` | nenhum | nenhum | `[[900]]` |
| Pressionar `R` | `R$ 1,00` | nenhum | nenhum | continua `[[900]]` |
| Pressionar `%` | `10,0 %` | nenhum | nenhum | continua `[[900]]` |

Os atalhos `$` e `r` também foram exercitados e reproduziram a ausência das emissões financeiras. Os eventos de tipo foram observados em todas as trocas. O preço 999 é comprovado pela fórmula existente para moeda; o script observou diretamente a máscara e os eventos, não inspecionou o computed interno de preço.

**Lacuna de cobertura:** `tests/components/MaxInputDiscount.test.ts:L136-152` testa atalhos com desconto zero e verifica somente o símbolo. Assim, não detecta a divergência financeira de um buffer não vazio. O teste de clique em `L115-134` também não verifica o conjunto completo de emissões financeiras.

## Arquivos afetados

Na implementação futura, limitar o lote a:

1. `src/components/MaxInputDiscount.vue` — completar as emissões nos dois ramos de atalhos.
2. `tests/components/MaxInputDiscount.test.ts` — regressões do contrato financeiro e não regressão das demais entradas.

Nesta etapa foi preenchido apenas `docs/issues/100/plan.md`. Não alterar exports, dependências, lockfile, stores, componentes de base, estilos ou aplicações consumidoras.

## Execuções propostas

1. Manter a execução na worktree dedicada e preservar alterações preexistentes. Não executar commit, merge, push, release ou publicação sem solicitação explícita.
2. Ampliar a suíte existente com a matriz de regressão abaixo, usando montagem do componente real e eventos nativos no input. Capturar as contagens de emissão após a montagem para não confundir o preço inicial com uma atualização decorrente do atalho.
3. No ramo `%`, chamar `emitValues()` imediatamente depois de `emit('type-change', 'percent')` e antes do `return`.
4. No ramo comum a `$`, `r` e `R`, chamar `emitValues()` imediatamente depois de `emit('type-change', 'currency')` e antes do `return`.
5. Preservar a ordem pública já existente dos eventos de tipo e a ordem financeira definida por `emitValues`. Cada atalho reconhecido emitirá uma vez cada um dos cinco eventos. Inclusive quando o tipo solicitado já estiver ativo, manter os eventos de tipo atuais e emitir um conjunto financeiro coerente, sem multiplicação por watchers.
6. Não converter ou reconstruir o buffer: atalhos continuam reinterpretando dígitos; clique no símbolo continua convertendo valores equivalentes. Não chamar `onSymbolClick`, não introduzir watchers globais, não alterar arredondamentos/limites e não adicionar emissão em `onBlur` para mascarar o defeito.
7. Manter os bloqueios de `disabled`, Ctrl/Meta/Alt e tipos fixos. Não modificar o comportamento preexistente em que o pai devolve um tipo fixo por `v-model:type_discount` e, com isso, deixa de fornecer `auto`.
8. Implementar todo o bloco e seus testes antes de executar validações; validar o conjunto e corrigir eventuais falhas em lote, sem execuções a cada microedição. Aplicar as convenções de TypeScript/ESLint do projeto, sem reformatação geral do SFC.

## Testes de regressão e validação em lote

Adicionar ou fortalecer testes na suíte existente:

| Cenário | Resultado exigido após a interação |
| --- | --- |
| `auto`, bruto 1000, desconto 10; cada tecla `R`, `r`, `$` em montagem independente | Buffer continua `100`; máscara `R$ 1,00`; tipo `currency`; novos eventos financeiros `[1]`, `[1]`, `[999]` |
| Mesma montagem; `R` seguido de `%`, aguardando atualização entre teclas | Retorno a `10,0 %`; tipo `percent`; novos eventos financeiros `[10]`, `[10]`, `[900]` no segundo atalho |
| Atalho para tipo já ativo, com buffer não vazio | Buffer e cálculos preservados; exatamente um conjunto de emissões por atalho |
| Desconto zero/buffer vazio em `auto` | Desconto emitido como 0, não `null`/`NaN`; preço igual ao bruto; tipo e máscara coerentes |
| `disabled=true`; atalhos com Ctrl, Meta ou Alt; tipos fixos `percent`, `currency` e alias `value` | Nenhuma troca ou nova emissão financeira originada pelo atalho bloqueado; desconsiderar emissão inicial de preço |
| Clique no símbolo: bruto 1000, desconto 10% | Conversão equivalente para R$ 100,00 e preço 900; retorno para 10% e preço 900, sem reinterpretar como R$ 1,00 |
| Digitação, Backspace, Delete e atualização externa de `modelValue`, `discount`, `price`/`endValue` | Preservar máscara, precisão e sincronização existentes; nenhuma emissão duplicada causada pela correção |
| Componente pai com refs para desconto/preço e listeners de tipo | Após o atalho, refs do pai correspondem à máscara e ao preço recalculado, inclusive depois do retorno das props e de mais um ciclo de atualização; sem laço ou emissão duplicada |

No teste do pai, usar fixture declarada dentro do arquivo de testes, sem novo arquivo de aplicação. Cobrir vínculos financeiros e devolução do tipo por listener controlado; testar a sequência de atalhos enquanto a prop permanecer `auto` em cenário separado. Conferir que os dois eventos de desconto transportam o mesmo número, o preço é o correspondente e os eventos mantêm ordem e contagem por interação. Não depender de campos internos não expostos quando a mesma garantia puder ser verificada pelo DOM, props e eventos.

Executar um lote dimensionado ao componente após concluir implementação e testes. Se algum gate falhar, diagnosticar causalidade antes de corrigir; não ampliar o escopo para sanar problemas preexistentes. Após as correções em lote, reexecutar somente as verificações impactadas. Não executar build, cobertura ou gate completo nesta etapa exclusivamente documental.

## Banco de dados

Nenhuma migration. Não há persistência nem alteração de schema ou de contrato de API no escopo.

## Riscos de quebra e Não-Regressão

- **Mais notificações ao consumidor:** o pai passará a receber os eventos financeiros anteriormente ausentes. Validar os payloads e a ausência de duplicação por interação; efeitos externos eventualmente disparados por listeners não são auditáveis neste repositório.
- **Confusão entre conversão e reinterpretação:** reaproveitar o clique mudaria a regra de negócio dos atalhos. Fixar as duas semânticas em testes numéricos distintos.
- **Retroalimentação das props:** o pai pode devolver desconto, preço e tipo ao filho. Validar estabilização após os watchers, sem ciclos, valores intermediários persistentes ou reemissões financeiras extras.
- **Mudança indevida do modo:** preservar aliases e a restrição dos atalhos ao modo `auto`; não reabrir o comportamento de alternância em tipos fixos.
- **Preço inicial ocultando a falha:** comparar incremento de contagem e payload após cada tecla, em vez de apenas verificar existência de `update:price`.
- **Regressão de máscara, limites ou precisão:** manter os divisores, `toFixed`, validação e entradas comuns intocados; executar a suíte existente junto com a nova cobertura.
- Não reintroduzir PrimeVue nem remover classes legadas. Não há necessidade de alterações visuais ou novas dependências.

## Validação

Comandos para a etapa futura de implementação, executados na worktree:

```bash
npx vitest run tests/components/MaxInputDiscount.test.ts
npm run type-check
npm run type-check:test
npm run lint
```

**Prova conclusiva do bug corrigido:** o teste de bruto 1000/desconto 10 deve verificar que `R` altera a máscara para `R$ 1,00` e acrescenta exatamente `update:modelValue(1)`, `update:discount(1)` e `update:price(999)`, além dos eventos de tipo. O teste inverso com `%` deve acrescentar os valores 10, 10 e 900; os testes do pai devem comprovar os mesmos valores nas refs após a sincronização. A ausência atual dessas emissões garante que essas asserções detectem o defeito, e não apenas a troca cosmética de símbolo.

Não declarar correção implementada nesta fase. A reprodução isolada foi executada; suíte Vitest, tipos, lint e build não foram executados no planejamento. Se a entrega posterior incluir pré-release/publicação, executar `npm run verify` como gate agregado completo, sem repetir seus subcomandos sobre a mesma revisão sem necessidade concreta. Esta tarefa não autoriza publicação.

## Skills Aplicáveis

- `vue-debugging-best-practices` — rastrear estado derivado, props, eventos e retorno das props pelo pai.
- `test-driven-development` — orientar regressões que discriminem o defeito; respeitar a execução em lote mandatória do projeto.
- `vitest-skill` — parametrização das teclas e asserções de payload/contagem no Vitest.
- `vue-typescript-best-practices` — tipar fixtures e contratos de eventos sem ampliar a API pública.
- `vue-eslint-stylelint-quality-standards` — manter convenções do SFC e dos testes sem reformatação fora de escopo.
- `code-review` — revisar cirurgicamente os dois ramos e a cobertura antes da integração.
- `technical-documentation-best-practices` — preservar evidências, limites da investigação e critérios de aceite verificáveis.

Não pressupor skills não disponibilizadas, como `planning-with-files` ou `production-code-audit`, nem delegação a outros agentes para este escopo.
