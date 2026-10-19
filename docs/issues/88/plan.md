# Plano de execução — Issue #88

## Descrição e Causa Raiz

**Veracidade confirmada em 19/10/2026:** há uma lacuna real nos dois testes de desmonte. A correção solicitada ainda não existe. O defeito comprovado é de cobertura/assertividade dos testes, não uma falha atual do cleanup de produção.

### Causa Raiz Comprovada

- `tests/components/MaxInputIconPicker.test.ts:L157-170`: agenda dois nomes, desmonta, espera 200 ms reais e termina em `expect(true).toBe(true)` na linha 169. Não observa cancelamento, fila ou chamadas posteriores.
- `tests/unit/MaxInputIconPicker.spec.ts:L153-166`: verifica apenas que a fila está preenchida **antes** do desmonte (linha 160); depois espera 200 ms e executa a mesma tautologia na linha 165. Essa pré-condição não valida o cleanup.
- `tests/setup.ts:L76-105` e `L182-186`: o fetch global é simulado e aceita as requisições de ícones. Uma chamada indevida depois do desmonte não precisa causar erro ou reprovar a política de console.
- `src/components/MaxInputIconPicker.vue:L319-321`: erros individuais de rede são silenciados. Ausência de exceção, isoladamente, também não comprova ausência de requisição.

### Fluxo causal e rastreamento reverso

1. UI: abertura da gaveta chama `fetchCuratedIcons` (`src/components/MaxInputIconPicker.vue:L415-427`). Após a resposta do catálogo, `preloadInitialSvgs` coleta os nomes visíveis (`L392-397`, `L357-363`); o scroll também enfileira nomes (`L342-352`).
2. Estado **local**, não store: `enqueueSvgFetch` deduplica, acrescenta nomes à fila e agenda o debounce de 150 ms (`L329-337`); fila e timer são declarados em `L229-232`.
3. Transporte: `scheduleDrain` chama `drainQueue` (`L281-287`), que remove até 200 nomes por lote e executa POST em `props.svgUrl` com `{ names: batch }` (`L292-306`). A resposta sanitizada alimenta `svgCache`, consumido pela UI (`L307-316`, `L120-125`). No sentido inverso: SVG exibido ← cache local ← resposta do POST ← lote retirado da fila ← nomes visíveis do catálogo.
4. Desmonte: `onBeforeUnmount` cancela o timer e zera seu identificador (`L490-493`), invalida a busca de catálogo e substitui a fila por um array vazio (`L494-499`). O código de cleanup já existe; deve ser preservado.
5. Os testes chamam diretamente o método já exposto `enqueueSvgFetch` (`L502-506`), mas suas asserções finais não dependem dos efeitos do passo 4. Uma regressão deixa requisições acontecerem e os testes continuam verdes.

**Limite arquitetural:** esse fluxo de SVG usa `fetch` e estado local do componente. A store modal cuida da gaveta, não dessa fila. Não há Controller/Service/DB desse endpoint implementado neste fluxo da biblioteca; o backend pertence ao consumidor. Não inventar alterações de store, rotas, controller ou banco para corrigir estes testes.

### Comprovação experimental sem editar código-fonte

Comando executado na worktree pré-alocada:

```bash
./node_modules/.bin/vitest run tests/components/MaxInputIconPicker.test.ts tests/unit/MaxInputIconPicker.spec.ts -t 'cancela timer'
```

Resultado original: **2 arquivos aprovados; 2 testes aprovados; 15 ignorados pelo filtro; código de saída 0**.

Foi executada também uma mutação exclusivamente em memória: um plugin Vite `enforce: 'pre'`, fornecido programaticamente ao `startVitest` de `vitest/node`, transformou somente o módulo `src/components/MaxInputIconPicker.vue`. A transformação removeu, exclusivamente dentro de `onBeforeUnmount`, o bloco de cancelamento do timer e a atribuição `svgFetchQueue = []`. As duas remoções foram verificadas antes da transformação; o plugin registrou uma transformação aplicada. Os testes e o setup permaneceram originais.

Resultado mutado, com o mesmo filtro: **2 arquivos aprovados; 2 testes aprovados; 15 ignorados; código de saída 0**. Portanto, a mutação conjunta sobreviveu: os dois testes realmente não detectam a retirada das proteções anunciadas. Nenhum arquivo-fonte foi regravado. A confirmação não depende apenas da leitura da tautologia. Mutações individuais ficam como critérios de validação da implementação futura, não como experimentos já realizados.

## Arquivos afetados

| Arquivo | Alteração prevista |
| --- | --- |
| `tests/components/MaxInputIconPicker.test.ts` | Substituir o teste tautológico por verificações determinísticas de timer, ausência de POST tardio e descarte da fila remanescente. |
| `tests/unit/MaxInputIconPicker.spec.ts` | Aplicar as mesmas garantias ao teste equivalente, sem retirar os cenários existentes de acessibilidade/cache. |
| `docs/issues/88/plan.md` | Registro deste planejamento e dos critérios de aceite. |

`src/components/MaxInputIconPicker.vue`, `tests/setup.ts` e `vitest.config.ts` são referências de análise, **não alvos de alteração**. Não adicionar dependências, helpers de produção, novas exposições públicas ou infraestrutura compartilhada para esta correção localizada.

## Execuções propostas

1. Trabalhar na worktree dedicada já alocada. Preservar alterações preexistentes, a branch e os testes fora do escopo. Nesta etapa de planejamento, alterar somente este documento.
2. Preparar todo o bloco de testes nos dois arquivos antes da validação. Manter os ambientes atuais: `jsdom` no arquivo de componentes (`L1`) e `happy-dom` pelo config no arquivo unitário (`vitest.config.ts:L23-27`).
3. Nos novos cenários, usar timers falsos **locais ao teste**, limitados a `setTimeout`/`clearTimeout`, sem virtualizar indiscriminadamente `setImmediate`. Montar com `modelValue` vazio e gaveta fechada; isolar `MaxIcon` com `global.stubs` nesses cenários para eliminar o tráfego e timers da store de ícones, sem mockar o picker ou seu agendamento real.
4. Instalar um fetch simulado próprio por cenário. Identificar chamadas da fila por URL igual à prop `svgUrl` e método POST; conferir o corpo `{ names: [...] }`. Não depender da contagem global de fetch de outros componentes nem do mock permissivo do setup. Usar tipos locais mínimos para o método exposto e para respostas pendentes, sem ampliar `any`.
5. **Cenário de cancelamento do timer pendente:**
   - Registrar os timers existentes após a montagem; enfileirar dois nomes distintos e ausentes do cache.
   - Comprovar que o enfileiramento adicionou um timer. Avançar 149 ms e conferir que ainda não houve POST para `svgUrl`.
   - Capturar o identificador do timeout efetivamente criado pelo enfileiramento por um spy transparente de `setTimeout`; observar `clearTimeout` sem substituir sua execução. Desmontar antes dos 150 ms.
   - Comprovar cancelamento desse identificador e retorno da contagem de timers ao patamar esperado para a montagem isolada. Isso deve detectar a remoção de `clearTimeout` mesmo quando a limpeza da fila continua funcionando.
   - Avançar mais de 150 ms, concluir microtarefas e verificar zero novas chamadas ao endpoint de SVG. Não usar espera de relógio real nem tautologias.
6. **Cenário comportamental de descarte da fila, independente do timer:**
   - Enfileirar 201 nomes exclusivos, avançar 150 ms e suspender a resposta do primeiro POST com uma Promise controlada pelo teste.
   - Antes de desmontar, comprovar exatamente um lote de 200 nomes corretos. O nome restante continua pendente, enquanto o primeiro lote está em voo.
   - Desmontar; resolver normalmente a resposta do primeiro POST; concluir Promises e timers relevantes. Conferir que **não existe segundo POST** com o nome restante, inclusive após um avanço adicional do relógio.
   - Esse cenário detecta a retirada de `svgFetchQueue = []` isoladamente: o `while` de `drainQueue` tentaria consumir o segundo lote após a resposta. Não exigir cancelamento do fetch que já começou nem ausência de atualização do cache por essa resposta; esses contratos não são implementados nem fazem parte desta issue.
7. **Controle positivo:** em instância viva, confirmar que os mesmos mecanismos realmente enviam o POST após 150 ms, com os nomes esperados; para a fila de 201 nomes, confirmar lotes de 200 e 1 ao liberar a resposta. Isso impede aprovação vazia por mock, stub ou enfileiramento inoperante. Preservar também o teste existente de 250 nomes em dois lotes (`tests/components/MaxInputIconPicker.test.ts:L206-249`).
8. Não usar `vm.svgFetchQueue.length === 0` como prova final: `defineExpose` recebe o array existente (`src/components/MaxInputIconPicker.vue:L502-506`), mas o hook **reatribui** a variável (`L499`). A referência previamente exposta pode continuar apontando para o array antigo. Verificar o descarte pelo comportamento do segundo lote evita alterar produção apenas para acomodar o teste.
9. Garantir teardown em `try/finally`, inclusive se uma asserção falhar: desmontar instâncias ainda montadas, finalizar respostas controladas, limpar timers somente **depois** das asserções e restaurar timers reais, spies e globais locais. Não mascarar falhas com supressão de console nem depender de `happyDOM.cancelAsync` como prova do cleanup do componente.
10. Após preparar os dois arquivos completos, validar em lote. Corrigir falhas relacionadas ao escopo em conjunto e só então revalidar. Não modificar comportamento de produção se os testes revelarem um defeito adicional: registrar evidência e separar esse escopo.

## Testes de regressão e validação em lote

| Caso | Garantia exigida | Regressão que precisa reprovar |
| --- | --- | --- |
| Timer pendente no desmonte | Timeout real do enfileiramento é cancelado; nenhum POST tardio ocorre. | Remover somente o cancelamento do timer. |
| Fila restante com lote em voo | Resolver o primeiro POST após desmontar não inicia o lote restante. | Remover somente a limpeza da fila. |
| Cleanup completo | Os dois cenários anteriores continuam corretos. | Remover simultaneamente cancelamento e limpeza. |
| Instância viva | POST após 150 ms e drenagem normal em lotes de até 200. | Desabilitar indevidamente agendamento ou drenagem. |
| Isolamento | Cenários seguintes não herdam timers falsos, fetch, respostas pendentes ou wrappers. | Vazamento de estado entre testes/ambientes. |

O controle positivo deve validar rede simulada e payload, não apenas que uma função mockada foi chamada sem relação com o comportamento real. Mantenha os testes existentes de cache, sanitização, acessibilidade e catálogo.

Na implementação futura, repetir a transformação descartável em memória utilizada na triagem, em três execuções: retirar apenas o bloco de cancelamento; retirar apenas a limpeza da fila; retirar ambos. Os testes revisados de **cada arquivo** devem reprovar por asserções relacionadas ao contrato correspondente, não por falha de importação, timeout de infraestrutura ou configuração. Confirmar que a transformação foi aplicada e guardar os resultados. Sem mutação, todos devem passar. Não persistir código mutante.

## Banco de dados

Nenhuma migration. Nenhuma alteração de esquema, persistência, IndexedDB ou dados.

## Riscos de quebra e Não-Regressão

- **Temporização e efeitos de filhos:** MaxIcon pode gerar tráfego próprio. Usar stub local, observar somente o endpoint/método do picker e confirmar o timeout específico; não alterar o setup global.
- **Referência antiga da fila:** evitar asserções sobre um array exposto antes da reatribuição, conforme explicado acima. Não mudar `defineExpose`, tipo da fila ou semântica de abertura para tornar o teste verde.
- **Resposta em voo:** o cleanup atual não aborta o POST de SVG já iniciado. O teste deve exigir apenas que os itens ainda pendentes não gerem novos POSTs; exigir aborto seria ampliar o contrato.
- **Falsa segurança por uma única observação:** zero fetch não demonstra cancelamento se a fila foi esvaziada; timer cancelado não demonstra descarte da fila. Manter cenários independentes e matar as três mutações.
- **Vazamento de fake timers/mocks:** restaurar recursos no `finally`, inclusive em testes mutados que falhem. Validar ambos os arquivos juntos e a suíte completa.
- **Escopo cirúrgico:** preservar API pública, props, eventos, classes legadas, tokens, cache entre reaberturas, limite de 200 e proteção contra catálogo obsoleto. Sem PrimeVue, alterações de dependências ou modificações de backend.

## Validação

Executar após concluir todo o bloco de testes, sem validação por microedição:

```bash
# Suítes completas afetadas, não apenas o filtro usado na triagem.
npx vitest run tests/components/MaxInputIconPicker.test.ts tests/unit/MaxInputIconPicker.spec.ts

# Tipagem dos testes alterados.
npm run type-check:test

# Estilo dos arquivos alterados, sem autofix global.
npx eslint tests/components/MaxInputIconPicker.test.ts tests/unit/MaxInputIconPicker.spec.ts

# Regressão global após os novos cenários e teardown estarem prontos.
npm run test
```

**Prova conclusiva:** os comandos sem mutação passam; as três variantes mutantes reprovam nos testes correspondentes de ambos os arquivos; o controle positivo continua demonstrando envio e drenagem normais na instância viva. Uma execução verde sem matar as mutações não encerra esta issue. Não rodar build para alterações exclusivamente de testes; se houver exigência posterior de release, executar `npm run verify` como gate completo, sem repetir suas etapas isoladas sobre a mesma revisão. Não publicar, commitar ou integrar Git sem solicitação explícita.

**Limites desta etapa:** foram executados apenas os dois testes atuais filtrados, no original e na mutação conjunta em memória. Suítes completas, tipos, lint e mutações individuais são validações propostas para a implementação; não estão sendo declaradas aprovadas neste planejamento.

## Skills Aplicáveis

- `test-driven-development`: usar as mutações para demonstrar falha real dos novos testes, sem modificar produção desnecessariamente; executar o bloco autorizado em lote conforme as diretrizes do projeto.
- `vitest-skill`: timers falsos, spies transparentes, Promises controladas e restauração dos recursos locais.
- `vue-vitest-testing-best-practices`: montagem Vue Test Utils, stub local de filhos, Pinia isolado e proibição de rede real. Aplicar os princípios compatíveis com esta biblioteca; os caminhos e a configuração específica do Engeapp descritos na skill não substituem o `vitest.config.ts` local.
- `code-review`: revisar a independência das verificações de timer/fila, controles positivos e teardown antes da integração.
- `technical-documentation-best-practices`: manter evidências, limites de escopo e comandos verificáveis neste plano.
