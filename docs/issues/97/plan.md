# Plano de execução — Issue #97

## Correção cirúrgica do teste de resposta obsoleta do MaxInputIconPicker

### Descrição e Causa Raiz

**Veracidade: problema confirmado na preparação do teste; não foi constatado um defeito de produção no controle de respostas obsoletas.** O cenário atual pode passar sem iniciar a requisição antiga e, portanto, sem comprovar a proteção contra sobrescrita por uma resposta atrasada.

**Causa Raiz Comprovada:**

- `tests/components/MaxInputIconPicker.test.ts:L251-275`: cria uma promessa controlada para `q=ab`, mas não verifica se o mock chegou a recebê-la. O mock também não observa o `AbortSignal`, característica útil para testar a proteção lógica independentemente do cancelamento do transporte.
- `tests/components/MaxInputIconPicker.test.ts:L282-290`: muda `search` de `ab` para `abc` após apenas 350 ms. Contudo, `src/components/MaxInputIconPicker.vue:L465-477` observa esse estado com `watchDebounced` e `debounce: 400`. A segunda alteração substitui a primeira antes de seu callback iniciar a busca.
- `tests/components/MaxInputIconPicker.test.ts:L292-300`: libera a promessa de `ab` sem provar que ela está sendo aguardada por uma requisição. A espera adicional de 50 ms, somada aos 350 ms anteriores, situa a asserção justamente no limite nominal do debounce de `abc`, introduzindo dependência do escalonamento do ambiente.
- `src/components/MaxInputIconPicker.vue:L369-410`: já implementa cancelamento da requisição anterior e comparação de geração nos caminhos de sucesso, erro e finalização. O problema desta issue é a ausência de exercício confiável dessa proteção no teste, não a falta dessa implementação.

**Evidência experimental, sem editar código-fonte ou testes:**

1. Executado `./node_modules/.bin/vitest run tests/components/MaxInputIconPicker.test.ts -t 'resposta obsoleta'`: 1 teste aprovado e 10 ignorados; duração do caso de aproximadamente 820 ms. Aprovação isolada não comprova que as duas requisições começaram.
2. Executado um script Node via entrada padrão, importando `ref`/`nextTick` de `vue` e o `watchDebounced` real de `@maxvue/max-use`, com o mesmo debounce e a sequência temporal do teste: atribuir `ab`, aguardar 350 ms, atribuir `abc`, aguardar 350 ms e mais 50 ms. Registro observado:

```json
{"etapa":"antes de trocar para abc","chamadas":[]}
{"etapa":"antes de resolver ab","chamadas":[]}
{"etapa":"momento das asserções originais","chamadas":[{"q":"abc","ms":754}]}
{"etapa":"observação final","chamadas":[{"q":"abc","ms":754}]}
```

O script confirma o cancelamento do callback de `ab` pelo helper efetivamente instalado. Não é um registro do `fetch` do componente inteiro; a ligação entre callback e requisição está demonstrada pelo código nas linhas 470–474. A instrumentação de ambas as requisições e a prova por mutação ficam como critérios obrigatórios da implementação. Nenhuma mutação foi executada nesta etapa.

**Fluxo causal e rastreamento reverso:**

`input v-model="search"` (`src/components/MaxInputIconPicker.vue:L63-69`) ⇄ estado local `search`/`curatedIcons` (`L219-222`) → watcher com debounce (`L465-477`) → `fetchCuratedIcons(query)` (`L369-388`) → `fetch` usando a prop `listUrl` e parâmetro `q` → JSON do mock (`tests/components/MaxInputIconPicker.test.ts:L255-275`) → filtro por geração (`src/components/MaxInputIconPicker.vue:L392-410`) → `curatedIcons` → `flatIcons`/linhas virtualizadas (`L259-275`) → células da interface (`L104-125`).

Rastreamento reverso da asserção: o catálogo contendo `icon:abc` (`tests/components/MaxInputIconPicker.test.ts:L297-300`) só prova o processamento da busca recente; não prova a passagem pelo ramo `q=ab` do mock. A origem da lacuna está na troca de estado antes dos 400 ms, e não na resposta da API.

**Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB:** o catálogo usa estado local e `fetch` direto; não passa por store de dados. `useModalStore` (`src/components/MaxInputIconPicker.vue:L214-218` e `L446-463`) controla somente a pilha modal. A API é substituída por mock no teste; controller, service e banco externos não participam da reprodução e não precisam ser alterados ou presumidos.

### Arquivos afetados

- `tests/components/MaxInputIconPicker.test.ts`: único arquivo de implementação a modificar; importações de utilitários, preparação, asserções e limpeza do caso de resposta obsoleta.
- `docs/issues/97/plan.md`: documento desta etapa de planejamento.

Arquivos apenas consultados/validados: `src/components/MaxInputIconPicker.vue`, `tests/unit/MaxInputIconPicker.spec.ts`, `tests/setup.ts`, `vitest.config.ts` e `package.json`. Não alterar componente, helper publicado, configuração global de testes, dependências ou lockfile para acomodar o teste.

### Execuções propostas

1. Trabalhar na worktree pré-alocada, preservando a branch e alterações existentes. Limitar o trabalho ao caso de corrida e aos imports necessários no arquivo de testes.
2. Substituir as três esperas reais de 350/350/50 ms desse caso por relógio falso local (`vi.useFakeTimers()`), avanço assíncrono explícito e sincronização das atualizações Vue. Não mockar `watchDebounced` nem reduzir o debounce do componente.
3. Criar respostas adiadas e tipadas para `ab` e `abc`, com controles de resolução independentes. Registrar apenas chamadas de catálogo com os respectivos parâmetros `q`; excluir consultas de SVG e chamadas incidentais de ícones. Manter o transporte simulado deliberadamente indiferente ao aborto, permitindo que a resposta antiga realmente alcance a proteção por geração.
4. Montar o componente como no cenário existente e atribuir `search = 'ab'`. Aguardar `nextTick` antes de avançar o relógio, pois o watcher precisa observar a alteração. Após 350 ms simulados, afirmar que nenhuma busca de catálogo começou; avançar os 50 ms restantes e afirmar exatamente uma chamada para `q=ab`, ainda pendente, com `isLoading === true`.
5. Só então atribuir `search = 'abc'`, sincronizar o watcher e avançar outros 400 ms simulados. Afirmar que o registro do catálogo é exatamente `['ab', 'abc']`, que ambas as promessas ainda estão controladas pelo teste e que o sinal da primeira requisição foi abortado ao iniciar a segunda. Não usar a contagem global de `fetch` como sinônimo da contagem de buscas.
6. Resolver primeiro `abc`; esgotar suas continuações de promessa e o ciclo Vue com `flushPromises`/`nextTick`, de forma compatível com o relógio falso instalado. Afirmar o catálogo recente, `search === 'abc'`, `isLoading === false` e `hasLoadError === false` **antes** de liberar `ab`.
7. Resolver `ab` posteriormente, garantindo que seu `json()` também foi consumido. Sincronizar novamente promessas e Vue e repetir as asserções de catálogo e estados. Isso distingue resposta descartada por geração de resposta que nunca iniciou ou nunca chegou ao componente.
8. Garantir limpeza em `finally`, inclusive se uma asserção intermediária falhar: liberar as respostas controladas restantes, desmontar a instância, descartar timers locais pendentes e restaurar timers reais e os globals substituídos. Não usar execução irrestrita de todos os timers enquanto houver promessas de rede pendentes. Não alterar indiscriminadamente o ciclo de vida dos demais testes.
9. Implementar todo esse bloco e suas asserções antes das validações. Depois executar o lote definido abaixo, corrigir falhas relacionadas em conjunto e revalidar apenas o que for afetado. Não aumentar os sleeps como solução.

### Testes de regressão e validação em lote

**Caso corrigido, com premissas observáveis:**

- Aos 350 ms de `ab`, nenhuma requisição de catálogo iniciou; aos 400 ms, iniciou exatamente `ab`.
- `abc` só é digitado após a confirmação de que `ab` está em andamento.
- As duas buscas iniciaram na ordem esperada; não há busca extra indevida de catálogo.
- A resposta de `abc` foi aplicada antes de liberar a antiga.
- A resposta atrasada de `ab` foi entregue e lida, mas não substituiu o catálogo recente nem alterou os estados de sucesso.
- O aborto anterior foi observado, mas não usado pelo mock para ocultar a corrida.

**Prova de sensibilidade obrigatória na futura implementação:** executar o teste contra uma transformação temporária, isolada e não persistida do componente que torne incondicional apenas a aplicação da resposta bem-sucedida protegida em `src/components/MaxInputIconPicker.vue:L392-398`. Manter o mock indiferente ao aborto. O caso deve falhar na asserção final de catálogo, mostrando `icon:ab` no lugar de `icon:abc`, e não em timeout ou erro de infraestrutura. O componente original deve voltar a passar. Remover somente o cancelamento não precisa produzir falha, pois a proteção por geração permanece válida; não confundir isso com mutante sobrevivente do filtro de geração. Não deixar mutações em arquivos de produção, nem usar descarte Git de trabalho preexistente.

**Lote após completar o bloco:**

```bash
npx vitest run tests/components/MaxInputIconPicker.test.ts tests/unit/MaxInputIconPicker.spec.ts
npm run type-check:test
npx eslint tests/components/MaxInputIconPicker.test.ts
```

As duas suítes preservam cobertura adjacente de acessibilidade, cache, cautions e drenagem de SVG sem editar seus contratos. Se houver falhas fora do caso alterado, comparar com a base antes de ampliar o escopo. Restaurar timers/globals deve impedir dependência da ordem dos casos.

Nesta etapa foram executados somente os diagnósticos descritos acima; o lote de implementação e a mutação ainda não foram executados. Build, navegador e gate completo não são necessários para salvar este plano. Caso a entrega futura inclua release, executar `npm run verify` como gate completo, sem repetir seus componentes isolados sobre a mesma revisão.

### Banco de dados

Nenhuma migration. O escopo é exclusivamente o teste unitário de uma biblioteca Vue, com respostas HTTP simuladas e sem persistência.

### Riscos de quebra e Não-Regressão

- **Vazamento de relógio falso ou globals:** poderia travar casos com esperas reais ou trocar o mock de outra instância. Mitigação: escopo local, limpeza em `finally` e execução conjunta das duas suítes.
- **Falsa corrida por mock que rejeita automaticamente ao abortar:** esconderia a ausência de proteção por geração. Mitigação: entregar a resposta antiga apesar do sinal abortado, verificar leitura do JSON e exigir falha do mutante específico.
- **Contagem poluída por SVGs e ícones auxiliares:** poderia comprovar duas chamadas que não são duas buscas. Mitigação: filtrar por endpoint de catálogo/prop `listUrl` e parâmetro `q`, sem alterar o mock de SVG dos demais casos.
- **Promessas ou watchers não processados:** avanço de relógio sem `nextTick` anterior ou sem drenagem posterior pode causar outro falso positivo. Mitigação: sincronização explícita em cada fronteira e asserção intermediária do resultado recente.
- **Acoplamento a estado privado:** o caso já lê `curatedIcons` via instância; manter essa estratégia local para esta correção, sem ampliar `defineExpose` ou alterar API pública apenas para testar.
- **Quebra de contratos de consumo:** não esperada, pois props, emits, estilos, classes legadas, debounce de produção, contratos HTTP e dependências permanecem intactos. Conferir no diff final que nenhum desses arquivos foi modificado.

### Validação

A implementação será considerada concluída somente com estas evidências combinadas:

1. O caso instrumentado demonstra duas buscas realmente iniciadas e a entrega de `abc` antes de `ab`.
2. Com o código original, o teste conserva `icon:abc` antes e depois da entrega antiga e termina sem loading/erro indevidos.
3. Com o filtro de geração do sucesso neutralizado de forma isolada, o mesmo caso falha por sobrescrita do catálogo; sem a mutação, passa novamente.
4. O lote das duas suítes, a checagem de tipos de testes e o ESLint do arquivo alterado terminam com código zero. Não relatar validação integral se algum desses passos estiver pendente ou falhando.

Comando focal para a prova positivo/negativo do cenário:

```bash
npx vitest run tests/components/MaxInputIconPicker.test.ts -t 'resposta obsoleta'
```

Apenas esse comando verde, sem asserções das duas chamadas e sem a contraprova por mutação, não encerra a issue. Revisar o diff final; não fazer commit, push, integração ou publicação sem autorização explícita.

### Skills Aplicáveis

- `vitest-skill`: timers falsos, mocks de rede, execução focal e controle de respostas.
- `vue-vitest-testing-best-practices`: integração Vue Test Utils, Pinia e sincronização de promessas; adaptar às pastas de teste efetivamente usadas nesta biblioteca.
- `vue-debugging-best-practices`: rastreamento de watchers assíncronos, ciclo Vue e respostas obsoletas. A referência `reference/watch-async-cleanup.md` indicada pela skill não está disponível nesta worktree; não presumir seu conteúdo.
- `test-driven-development`: exigir evidência negativa do defeito de cobertura e a contraprova por mutação antes de declarar a regressão protegida, sem alterar produção para fabricar aprovação.
- `code-review`: conferir o isolamento do cenário, a validade causal das asserções e a ausência de mudanças de contrato antes de qualquer integração.
- `technical-documentation-best-practices`: manter evidências, limitações e comandos do plano rastreáveis e em português.
