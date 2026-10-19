# Plano de execução — Issue #93

## Escopo e diagnóstico

Planejamento elaborado em 19/10/2026. **Achado confirmado no código atual e reproduzido em execução.** Nesta etapa, somente este plano é preenchido: nenhum componente, teste, configuração ou dependência deve ser alterado. A implementação, commits, publicação e integração não fazem parte desta autorização.

### Descrição e Causa Raiz

Ao montar `MaxInputDiscount` com `gross=200`, `price=160` e `type_discount='percent'`, sem `discount` nem `modelValue`, o desconto inicial torna-se zero, o campo mostra `0,0 %` e a montagem emite `update:price(200)`. Quando o consumidor conecta esse evento ao estado do formulário, os R$ 160,00 recebidos são substituídos por R$ 200,00 sem edição do usuário. A mesma omissão afeta o alias `endValue` e o modo monetário. O problema não é somente visual: a emissão pode contaminar o estado do consumidor; persistência posterior depende da aplicação consumidora e não foi comprovada neste repositório.

**Causa Raiz Comprovada:** a inicialização resolve apenas o desconto direto e seu padrão, enquanto a conversão inversa do preço existe exclusivamente em um watcher não imediato. A emissão de montagem usa o estado inicial incorreto antes de qualquer mudança externa de preço.

| Evidência | Localização atual | Papel no defeito |
| --- | --- | --- |
| Contrato de desconto, bruto e preço líquido, com aliases | `src/components/MaxInputDiscount.vue:L83-102` | `price`/`endValue` são entradas do preço líquido, não apenas valores de saída. |
| Defaults | `src/components/MaxInputDiscount.vue:L130-140` | `default` vale `'0'`; preço e desconto explícitos podem estar ausentes. |
| Tipo e bruto efetivos | `src/components/MaxInputDiscount.vue:L171-192` | `auto` começa em percentual; `value` equivale a `currency`; `gross` precede `startValue`. |
| Resolução inicial incompleta | `src/components/MaxInputDiscount.vue:L218-234` | `discount ?? modelValue ?? default ?? 0` ignora `price` e `endValue`; zero gera buffer vazio. |
| Desconto e preço calculados | `src/components/MaxInputDiscount.vue:L235-272` | Buffer vazio implica desconto zero e preço líquido igual ao bruto: 200. |
| Conversão inversa tardia | `src/components/MaxInputDiscount.vue:L477-497` | Observa `price ?? endValue`, mas sem `immediate`; só deriva desconto quando a entrada muda depois do registro. |
| Emissão de montagem | `src/components/MaxInputDiscount.vue:L499-502` | Emite o preço calculado incorreto, 200, ao consumidor. |
| Lacuna nos testes | `tests/components/MaxInputDiscount.test.ts:L93-113` | O teste de aliases não fornece `endValue`; o de bidirecionalidade usa `setProps` após montar, não um preço líquido inicial. |

**Rastreamento causal e reverso:** estado inicial do consumidor (`price=160`) → props `price`/`endValue` → inicializador que desconsidera essas props → `digitsBuffer=''` → `currentDiscountValue=0` → `currentPrice=200` → `onMounted` → `update:price(200)` → listener do consumidor altera seu estado para 200. Reversamente, a emissão incorreta provém de `currentPrice`, que depende do buffer criado sem consultar o preço líquido. A UI deriva do mesmo buffer, por `displayValue` (`src/components/MaxInputDiscount.vue:L256-260`) e pelo binding do input (`L29-46`).

**UI ⇄ Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB:** o fluxo comprovado termina no estado reativo do componente pai. `MaxInputDiscount` importa apenas Vue e `InputBase` (`src/components/MaxInputDiscount.vue:L69-70`); não acessa store, API, rota, controller, service ou banco. Essas camadas são **não aplicáveis ao caminho causal local**. Não é necessário inventar integração de backend para corrigir a biblioteca.

**Reprodução executada, sem arquivos auxiliares:** o SFC atual foi compilado em memória com `@vue/compiler-sfc`, transpilado com TypeScript e montado com Vue em `happy-dom`. Somente `InputBase` foi substituído por um invólucro de slot, mantendo template, props, cálculos, watchers e ciclo de vida de `MaxInputDiscount`. Um pai reativo recebeu `update:price`; `nextTick` foi aguardado. Saídas observadas:

```json
{"scenario":"price percentual","props":{"gross":200,"price":160,"type_discount":"percent"},"display":"0,0 %","discount":0,"currentPrice":200,"emittedPrice":[200],"parentPrice":200}
{"scenario":"mudança posterior de price","discount":20,"currentPrice":160,"parentPrice":160}
{"scenario":"alias endValue monetário","props":{"startValue":200,"endValue":160,"type_discount":"currency"},"display":"R$ 0,00","discount":0,"currentPrice":200,"emittedPrice":[200],"parentPrice":200}
```

A atualização posterior de `price` para 160 produz os 20% corretos, isolando a divergência entre inicialização e sincronização inversa. O invólucro de `InputBase` gerou avisos de atributos não herdados por fragmento; não houve erro de execução. Essa reprodução não substitui os testes futuros com o componente completo.

### Arquivos afetados

| Arquivo | Alteração na futura implementação |
| --- | --- |
| `src/components/MaxInputDiscount.vue` | Completar a seleção da fonte inicial, compartilhar o cálculo inverso local quando adequado e sincronizar os eventos iniciais sem sobrescrita indevida. |
| `tests/components/MaxInputDiscount.test.ts` | Acrescentar regressões de montagem, precedência, aliases, feedback do pai, precisão e sincronização posterior. |
| `docs/issues/93/plan.md` | Artefato desta etapa; registrar evidências e critérios de aceite, sem implementar código. |

Não são previstas alterações em `InputBase`, stores, exports, manifesto, lockfile, dependências, playground, estilos ou backend.

### Execuções propostas

1. **Restringir a intervenção ao componente e à sua suíte existente**, na worktree pré-alocada. Preservar a API pública, as classes, os eventos existentes e o funcionamento de teclado/máscara. Não reintroduzir PrimeVue.
2. **Adicionar o bloco completo de regressões descrito abaixo**, utilizando o helper de montagem existente e um consumidor reativo para o cenário de `v-model:price`. Não depender exclusivamente de membros internos expostos: observar valor do input, eventos e estado do pai.
3. **Fixar a precedência da fonte inicial**, sem alterar a prioridade já consolidada entre descontos explícitos:
   - `discount` não nulo/indefinido tem prioridade;
   - na ausência dele, `modelValue` não nulo/indefinido tem prioridade;
   - sem ambos, consultar `price ?? endValue` e derivar o desconto, antes de recorrer a `default`;
   - sem preço líquido utilizável, preservar `default ?? 0` e o tratamento numérico atual do desconto direto.
   - Zero é valor explícito válido em todas essas entradas, não ausência. Não usar teste de veracidade (`if (price)`). `null` e `undefined` representam ausência. Se `price` e `endValue` forem fornecidos juntos, manter `price` como prioritário, tal como no watcher atual.
4. **Derivar o desconto antes de preencher o buffer**. Normalizar o preço líquido com `Number`, aceitando números e strings numéricas. Para o novo caminho de inicialização por preço, rejeitar resultados não finitos e usar o fallback de desconto padrão; não expandir esta issue para reescrever a validação numérica inteira do componente. Usar `effectiveGross` e `effectiveActiveType`, preservando as fórmulas já existentes:
   - percentual com bruto positivo: `Number((((gross - price) / gross) * 100).toFixed(1))`;
   - percentual com bruto zero ou negativo: zero, sem divisão por zero, conforme a regra inversa existente;
   - monetário: `Number((gross - price).toFixed(2))`;
   - gerar o buffer com `initBufferFromNumeric`, preservando a normalização atual de descontos não positivos.
5. **Evitar divergência entre montagem e atualização posterior**. Preferir uma função local pura de conversão preço → desconto, utilizada na inicialização e no watcher inverso, sem criar um módulo público novo. Se extraída, manter o watcher com sua condição de disparo e seu comportamento para entradas já suportadas; não torná-lo incondicionalmente imediato, pois isso faria preço contraditório sobrepor `discount`/`modelValue` explícitos.
6. **Coordenar as emissões iniciais**. Quando a fonte inicial for preço líquido, sincronizar `update:modelValue` e `update:discount` com o desconto derivado na montagem, uma vez, antes de emitir o preço coerente. Manter a emissão inicial de `update:price` usada por consumidores que inicializam por desconto. No caso exato da issue, todo `update:price` deve conter 160, nunca 200. Não adicionar `update:endValue`: o alias atualmente é de entrada, e criar novo evento ampliaria a API sem necessidade.
7. **Preservar o mecanismo de sincronização posterior**, incluindo atualizações de `modelValue`, `discount`, `price` e `endValue`. A realimentação dos eventos iniciais pelo pai não pode gerar alternância de valores nem ciclos de emissão. As comparações de valores já existentes devem continuar impedindo trabalho redundante.
8. **Preservar precisão e limites vigentes**. Percentuais continuam com uma casa decimal; moeda, com duas. A validação de limite máximo apenas sinaliza erro e não deve reduzir silenciosamente o desconto derivado. Não alterar política de preços acima do bruto, descontos negativos, bruto recebido tardiamente ou recálculo por mudança isolada de bruto nesta issue.
9. Depois de implementar **todo o lote e seus testes**, executar as validações propostas, diagnosticar falhas, corrigir em lote e revalidar somente as etapas impactadas. Não executar testes, tipos ou build após cada microedição.

### Testes de regressão e validação em lote

Adicionar casos parametrizados e testes de integração local em `tests/components/MaxInputDiscount.test.ts`:

| Grupo | Entradas e verificações |
| --- | --- |
| Regressão principal | Montar com `gross=200`, `price=160`, `type_discount='percent'`, sem desconto: input `20,0 %`, desconto derivado 20, preço 160; nenhum evento `update:price` com 200. Conferir todos os eventos após os ticks, não somente o último. |
| Consumidor bidirecional | Pai com `ref(160)` e vínculo real de `price`/`update:price`: após montagem e ticks adicionais, estado permanece 160. Vincular também desconto para provar convergência em 20 e ausência de ciclo; desmontar ao final. |
| Aliases e tipos | Repetir com `startValue=200`, `endValue=160`; testar `percent`, `auto` inicialmente percentual, `currency` e `value`. Percentual deriva 20 e moeda deriva 40; líquido permanece 160. |
| Strings numéricas | Bruto `'200'` e preço `'160'`, inclusive pelos aliases, geram os mesmos resultados numéricos. |
| Preço zero | `gross=200`, `price=0`: 100% ou R$ 200,00 de desconto, líquido zero. Preservar sinalização de limite excedido, sem truncar o desconto. |
| Sem desconto efetivo | `price=gross=200`: desconto zero e preço 200, sem divisão ou emissão espúria. |
| Desconto explícito | `discount=10` e preço contraditório 160 em percentual: prevalece desconto 10, líquido 180; `discount=0` prevalece sobre `modelValue`, preço e padrão. Repetir prioridade de `modelValue`, inclusive zero, quando `discount` estiver ausente. |
| Fallback | Sem desconto e sem preço, manter `default` e zero; `discount`/`modelValue` nulos permitem derivação pelo preço. `default=5` com preço 160 não deve vencer o preço. |
| Prioridade de aliases | `gross` vence `startValue`; `price` vence `endValue`, inclusive preço zero; preço nulo permite usar `endValue`. |
| Entradas inválidas | No novo caminho inicial, preço não numérico, `NaN` e infinito não podem gerar desconto/preço não finito nem impedir fallback padrão. Não alterar precedências de valores diretos inválidos preexistentes sem evidência adicional. |
| Bruto zero e precisão | Com bruto zero e preço zero, resultado zero e ausência de `NaN`/infinito. Usar caso percentual exatamente representável com decimal e caso monetário com centavos; conferir arredondamento de uma/duas casas. Para inversão não exata, preservar a quantização atual, sem prometer centavos impossíveis de representar em percentual. |
| Atualização posterior | Após inicializar pelo preço, mudar `price` e depois `discount`/`modelValue`: desconto e preço continuam sincronizados. Repetir mudança de `endValue` quando `price` não estiver definido. |
| Interação e validação | Após derivação inicial, alternar símbolo mantendo equivalência no caso 200/160, editar e limpar pelo teclado; manter `disabled`, limites, erro e `noMessage`. Preservar toda a suíte existente. |

**Validação futura em lote:**

```bash
npx vitest run tests/components/MaxInputDiscount.test.ts
npm run type-check
npm run type-check:test
npm run lint
npm run test
npm run build
```

Executar a suíte direcionada primeiro para diagnóstico do contrato; a suíte completa verifica efeitos nos demais componentes. Não repetir comandos sobre conteúdo idêntico sem motivo concreto. Antes de release, usar `npm run verify` como gate integral, em lugar de repetir suas etapas isoladas na mesma revisão; release, publicação e integração continuam fora do escopo.

**Situação desta etapa:** apenas a reprodução em memória foi executada, com saída zero do processo e confirmação dos resultados defeituosos. Nenhuma suíte, checagem de tipos ou build foi executada ou declarada aprovada. Não foram criados testes temporários nem modificado código-fonte.

### Banco de dados

Nenhuma. Correção local da biblioteca Vue, sem persistência ou schema próprio nesse fluxo.

### Riscos de quebra e Não-Regressão

- **Precedência ambígua de múltiplas fontes:** não tornar o watcher inverso imediato indiscriminadamente. Cobrir conflitos entre desconto, modelo, padrão e preço com testes explícitos, preservando `discount > modelValue`.
- **Mudança intencional do padrão inicial:** sem desconto explícito, preço líquido passa a preceder `default`. Documentar essa escolha no comentário local do inicializador e garantir que consumidores sem preço mantenham o comportamento anterior.
- **Realimentação pai/filho:** emissões iniciais de desconto podem acionar watchers do consumidor. Testar montagem com vínculos reativos e estabilidade dos eventos após ticks; não emitir em duplicidade nem sobrescrever preço com valor transitório.
- **Arredondamento:** um preço arbitrário nem sempre é exatamente representável com uma casa de percentual. Este plano preserva a aritmética existente; a garantia de manter 160 no cenário 200/160 é exata. Não aumentar precisão ou introduzir fonte de verdade paralela para resolver outra classe de problema.
- **Valores fora do domínio e limites:** preços acima do bruto e bruto não positivo continuam sujeitos à política atual de normalização; o desconto acima do máximo continua sendo erro visual, não clamp. Não converter o reparo de inicialização em mudança das regras comerciais.
- **Compatibilidade pública:** preservar nomes de props/eventos, alias `value`, formato de máscara, classes e acessibilidade do input. Não alterar `InputBase` ou remover classes legadas.
- **Refatoração do cálculo inverso:** caso a fórmula seja extraída, testar também o watcher após montagem, para não corrigir a inicialização e quebrar a bidirecionalidade já existente.

### Validação

O comando automatizado conclusivo para o defeito é:

```bash
npx vitest run tests/components/MaxInputDiscount.test.ts
```

**Critérios de aceite obrigatórios:** o novo teste deve detectar o código atual como incorreto por produzir 0/200 em vez de 20/160; depois da implementação, deve comprovar input e desconto corretos, estado do pai preservado em 160, ausência de qualquer emissão transitória de 200 e estabilidade após realimentação. Os casos de alias, moeda, fontes explícitas e atualização externa também devem passar. A detecção do defeito no código original deve ser registrada no fluxo de regressão sem rodar validações por microedição. O lote de tipos, lint, suíte completa e build deve concluir sem falhas atribuíveis à mudança; falhas de baseline devem ser identificadas, não ocultadas ou corrigidas fora de escopo.

### Skills Aplicáveis

- `vue-debugging-best-practices`: diagnóstico de divergência inicial entre props, watchers e estado do pai; já utilizada nesta análise. A referência específica de watcher indicada pela skill não está disponível na cópia local; a causa foi comprovada diretamente no SFC e na reprodução, sem depender desse arquivo ausente.
- `vue-components`: preservar Composition API, props, eventos e anatomia do componente durante a implementação.
- `vue-typescript-best-practices`: manter tipagem estrita dos dados e eventos sem ampliar a API.
- `vitest-skill` e `javascript-testing-patterns`: testes parametrizados e integração reativa pai/filho na suíte Vitest existente.
- `test-driven-development`: registrar a capacidade dos novos testes de detectar o comportamento defeituoso, respeitando a execução em lote exigida pelo projeto.
- `code-review`: revisar o diff final, especialmente precedência, eventos e não-regressão, antes de qualquer integração autorizada.
- `technical-documentation-best-practices`: manter plano, evidências e critérios de aceite em pt-BR e vinculados ao código real; utilizada na redação deste artefato.

Não se pressupõe disponibilidade de skills com nomes citados apenas como exemplos no pedido. Não há necessidade de agentes paralelos ou alterações arquiteturais para esta correção localizada.
