# Plano de execução — centralização e grupos responsivos no MaxCardList

## 1. Identificação e autorização

- Data: 15/10/2026.
- Projeto: `@maxvue/max-components-ui`.
- Worktree/branch: `wt-d7c91bf0`, originada de `dev` conforme informação do usuário.
- Diretório obrigatório: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-d7c91bf0`.
- Especificação prévia: [spec.md](./spec.md). Ler este plano e a especificação na primeira admissão; nas retomadas, consultar apenas os trechos pertinentes.
- Estado desta entrega: **somente planejamento**. Código, testes, configurações e serviços não foram alterados; testes, tipos, build e scripts de projeto não foram executados.
- A autorização atual permite apenas os documentos de Plan. Execute exige autorização posterior. Não criar outra worktree, trocar branch, commitar, integrar, fazer push ou publicar. O MaxCode/usuário controla a integração e limpeza; preservar trabalho pendente.

## 2. Resultado esperado e decisões

### 2.1. Requisitos

- **R1 — Vazio com adicionar:** sem itens visíveis e fora do carregamento, centralizar o elemento de adicionar horizontal e verticalmente na região de conteúdo da lista.
- **R2 — Grupo ajustado:** no desktop, `MaxCard` com `MaxSubCard` deve acompanhar a largura dos subcards, acrescida apenas de gaps, padding e bordas necessários.
- **R3 — Limite e multilinhas:** o grupo cresce até a largura útil da lista inteira. Ao alcançar o teto, manter a largura e quebrar os subcards em novas linhas.
- **R4 — Paridade e responsividade:** funcionar com `virtualScroll=true/false`, redimensionamento, filtros e atualização de itens; preservar uma coluna no mobile.
- **R5 — Compatibilidade:** preservar props, slots, eventos, chaves, índice original dos itens, ações, busca, categorias, loading e componentes avulsos. Cards comuns continuam usando a largura das colunas configuradas.
- **R6 — Integridade operacional:** manter DOM virtualizado, medidas estáveis e descarte correto de observadores, sem dependências novas ou persistência de layout.

### 2.2. Decisões confirmadas e propostas

| Natureza | Decisão e motivo |
| --- | --- |
| Pedido confirmado | Centralização em vazio e correção desktop da composição card/subcards. |
| Resposta explícita do usuário | Limite de crescimento é a **área da lista**, não a coluna atual. Não reabrir sem requisito novo. |
| Proposta de baixo impacto | No vazio, até a ação configurada para header aparece uma única vez no centro do corpo; quando houver itens, volta à posição configurada. Evita excluir um caso do pedido e evita duplicação. |
| Proposta técnica | Um modelo de linhas por largura serve aos dois renderizadores. CSS sozinho não atualiza as linhas calculadas pelo virtualizador. |
| Proposta técnica | Reutilizar `minCardWidth` como largura preferencial de subcard sem dimensão própria e oferecer a variável contextual nova `--max-card-list-subcard-width`. Não adicionar props obrigatórias nem exigir formato novo dos dados. |
| Preservação | Alterações de estilo ficam restritas à composição dentro de `MaxCardList`. Não redesenhar `MaxCard`/`MaxSubCard` avulsos. |
| Preservação | Não migrar `useSearchBarStore` nem criar store de geometria. Não há novo GET/salvamento/cache; eventual ampliação de dados precisaria de MaxPinia e nova autorização. |

**Não adotar:** aumentar o subcard artificialmente para preencher um card largo, limitar grupos à coluna atual, desativar virtualização, renderizar todos os slots em uma árvore invisível, usar o nome de um campo arbitrário dos itens para descobrir subcards ou recriar botões/cards fora de MaxComponentsUi.

## 3. Evidências e mapa de arquivos

Estado inicial observado: worktree correta, branch `wt-d7c91bf0` e `git status --short` sem alterações anteriores. Revalidar no Execute: isso não garante que a árvore continuará limpa.

| Arquivo existente | O que foi investigado / ação futura |
| --- | --- |
| `AGENTS.md`, `.gitignore` | Convenções, worktree pré-alocada e exclusão das pastas de worktrees. Não modificar. |
| `src/components/MaxCardList.vue` | Fluxo completo: slots, estados, filtros, colunas, virtualização, índices, estilos e API exposta. Principal arquivo de implementação. |
| `src/components/MaxCard.vue` | Variante add já centraliza sua apresentação; card e composição com subcards continuam em 100%/coluna. Preservar fora da lista; mudança direta não prevista. |
| `src/components/MaxSubCard.vue` | Largura 100%, estados/slots/interação. Preservar componente avulso; mudança direta não prevista. |
| `src/types/card.ts` | Contratos públicos atuais. Não modificar para exigir metadados de layout. |
| `src/stores/useSearchBar.Store.ts` | Integração de busca existente. Não migrar nem corrigir concorrência nesta tarefa. |
| `tests/components/MaxCardList.test.ts` | Ampliar regressões; a cobertura atual de grupos usa HTML simulado, insuficiente para provar geometria. |
| `tests/components/MaxCard.test.ts`, `tests/components/MaxSubCard.test.ts` | Regressões existentes a preservar e executar na suíte. |
| `tests/setup.ts`, `tests/browser.setup.ts`, `tests/helpers/consolePolicy.ts` | Mocks, instância Pinia de teste, adaptador Axios e falha por avisos/erros inesperados. Não enfraquecer. |
| `vitest.config.ts`, `vitest.browser.config.ts`, `vitest.benchmark.config.ts`, `tsconfig.test.json` | Descoberta das suítes, Chromium, aliases/dedupe e tipos de testes. Não modificar por conveniência do teste novo. |
| `tests/browser/MaxCreditCard.browser.ts` | Referência de montagem com `createApp`, DOM real e descarte. Adaptar a ideia, sem copiar dados do exemplo. |
| `tests/benchmarks/virtualizedCollections.test.ts` | Convenção de cardinalidade determinística separada de tempo. Não usar teto temporal instável como prova de layout. |
| `playground/src/scenarios/media-brand.vue`, `playground/vite.config.ts` | Cenário existente e alias da biblioteca para fonte local. Ampliar apenas o cenário. |
| `package.json`, `package-lock.json`, `scripts/check-lockfile.mjs` | Scripts reais e proibição de referências locais. Versões e consultas oficiais estão documentadas na spec. |
| Pacote instalado `@maxvue/max-use` | `useElementSize`, `useResizeObserver`, `useMutationObserver` disponíveis no entry de runtime e tipos; importar por MaxUse. |

**Arquivos novos propostos no Execute:**

- `src/helpers/cardListLayout.ts`: cálculo puro de larguras, empacotamento e índice → linha.
- `src/helpers/useCardListLayout.ts`: observação de células montadas e preferências locais.
- `tests/helpers/cardListLayout.test.ts`: contratos do cálculo puro.
- `tests/components/useCardListLayout.test.ts`: testes do ciclo de observação com medidas controladas, sem fingir prova visual.
- `tests/browser/MaxCardList.browser.ts`: montagem dos componentes reais, geometria e cardinalidade.
- `docs/plans/wt-d7c91bf0/execution-state.json`: **somente durante Execute**, conforme seção 9; não criado em Plan.

**Limitações:** a aplicação da imagem não está disponível, não houve reprodução visual nem execução de gates. A documentação remota não tem correspondência exata garantida com todas as versões instaladas; conferir tipos locais antes de usar APIs. Não foram necessárias novas dependências ou helpers genéricos ausentes em MaxUse; os helpers novos são lógica interna específica deste componente.

## 4. Preflight de Execute — antes de implementar

1. Confirmar por leitura raiz, branch, status e conteúdo atual dos arquivos-alvo; identificar trabalho que já exista. Não sobrepor mudanças de outro executor.
2. Revalidar `package.json` e eventuais pre/posthooks dos comandos previstos, configurações e política de console. Conferir se os scripts ganharam instalações, rede, geração de arquivos ou efeitos externos.
3. Conferir resolução real de Vue/Pinia/Axios/MaxUse e symlinks. Os aliases/dedupe atuais não demonstram, sozinhos, identidade única no runtime. Confirmar que o adaptador de teste intercepta a mesma instância de Axios usada pelas dependências; registrar divergências antes de qualquer teste dependente.
4. Verificar a integridade das bibliotecas pelo gate existente aplicável, incluindo `npm run check:lockfile` após autorização de Execute. Gate falhado bloqueia validação dependente: não ignorar config/prehook, não remover proteção e não contornar com comando direto.
5. As fixtures devem usar dados sintéticos locais e `useGlobalSearch=false`, salvo testes explícitos da integração de busca. Instalar Pinia no app de teste real quando necessário, sem inventar nova camada de dados.
6. Não usar banco, filas, storage compartilhado ou serviços da aplicação da captura. Se algum bootstrap exigir esses recursos, parar e comprovar isolamento/autorização antes de executar; worktree, transações ou `--env=testing` não bastam. Não copiar `.env`.
7. Não instalar dependências ou browsers automaticamente para resolver falta do ambiente. Registrar bloqueio e próxima ação concreta; obter autorização operacional específica se necessária.

Condição de saída: contratos e ambiente suficientes para a implementação, sem falha de integridade pendente. As leituras de bibliotecas feitas em Plan não substituem esse preflight nem constituem testes aprovados.

## 5. Execução faseada

### T1 — Centralização do adicionar em vazio

**Dependência:** preflight aprovado. **Escrita:** `MaxCardList.vue`, `MaxCardList.test.ts`.

1. Separar disponibilidade da ação, estado sem itens visíveis e posição na lista preenchida. Preservar a precedência de loading.
2. Criar um ramo exclusivo de vazio com adicionar antes do grid/virtualização; impedir segunda instância no header.
3. Centralizar o elemento de ação na região de conteúdo; remover o esticamento herdado de `.max-card-list-col > *` deste caso. Usar classes locais `.max-*`, não utilitários empilhados ou estilos estáticos inline.
4. Manter evento `add` no fallback e o comportamento do slot personalizado. Preservar vazio sem ação e header/filtros fora da região centralizada.
5. Incluir testes de lista inicialmente vazia, zero por filtro, carregamento, ação por prop/slot, posição header e transições vazio → preenchido → vazio.

**Conclusão por inspeção:** uma única ação, dimensões coerentes com a spec e testes implementados. A validação executável só ocorre após T1–T5.

### T2 — Cálculo puro e modelo compartilhado de linhas

**Dependência:** preflight; integrar após T1. **Escrita:** helper puro novo e seu teste; integração posterior em `MaxCardList.vue`.

1. Definir tipos internos de célula/linha com discriminante item/add, chave, índice original e larguras. Não criar `any` novos para a geometria nem exportar esses tipos na API pública.
2. Implementar largura-base de cards comuns e largura do grupo conforme spec §3.3–3.4. Normalizar largura disponível zero, gap zero e espaço insuficiente; nunca produzir largura negativa, NaN ou loop sem progresso.
3. Empacotar de forma sequencial e linear, mantendo ordem e lacunas naturais no fim da linha. Não arredondar cada célula de modo que a soma ultrapasse a área; usar tolerância consistente para subpixel.
4. Gerar chave da linha a partir de suas células e mapa índice original → linha. A ação não recebe índice de item.
5. Cobrir sem grupos, um grupo, vários grupos, mistura com adicionar/cards comuns, largura exata, próximo item que não cabe, mobile, mudança de `columns`/`gap` e fallback de largura ainda desconhecida.

**Conclusão por inspeção:** exemplos determinísticos do empacotamento e do mapa não dependem de DOM ou de TanStack.

### T3 — Medição contextual e layout dos grupos

**Dependência:** T2. **Escrita:** composable novo e teste; `MaxCardList.vue`.

1. Vincular referências das células pela chave atual; descobrir apenas o card e subcards que pertencem àquela célula. Cobrir filhos diretos e um wrapper neutro; não somar subcards de um card mais profundo.
2. Aplicar regras contextuais de largura preferencial/flex-wrap sem alterar o CSS global de `MaxSubCard`. Respeitar dimensões explícitas e o novo token contextual quando usado. Preservar truncamento de títulos e espaço de ações.
3. Distinguir preferência de largura aplicada: não usar a dimensão já limitada pelo viewport como nova preferência permanente. Medir padding, bordas e intervalos internos sem assumir que são iguais ao `gap` externo.
4. Observar redimensionamento e mudança estrutural dos filhos por helpers MaxUse. Não observar todas as mutações de atributos produzidas pelo próprio cálculo. Agendar no máximo uma atualização pendente por frame, com leituras agrupadas antes das escritas.
5. Manter estimativa para células nunca montadas, corrigir ao renderizar, conservar preferências ao sair da janela e limpar ao remover itens da coleção. Cobrir substituição de conteúdo sob a mesma chave e desmontagem/remontagem.
6. Garantir recuperação após container oculto (largura zero), alteração de título/ações e retorno mobile → desktop. Descartar observadores e frames no unmount.
7. Integrar o mesmo conjunto de linhas ao modo estático e ao virtual, sem dois algoritmos de quebra concorrentes.
8. Preservar alturas equalizadas entre células da linha e `gridAutoRows: 1fr` no modo estático, como exige o teste existente. Não transformar essa correção em mudança geral da política de altura; paridade entre modos significa mesmas larguras/quebras/ordem, não altura total idêntica.

**Conclusão por inspeção:** seletores não atingem componentes avulsos, não há medição prévia de todos os slots nem cache persistente. Se estilos do consumidor impedirem o contrato sem destruí-los, registrar evidência e solicitar decisão específica; não expandir a correção silenciosamente.

### T4 — Integridade da virtualização e índices

**Dependência:** T2–T3. **Escrita:** `MaxCardList.vue`, testes de componente/composable.

1. Usar linhas compartilhadas como unidades de TanStack; informar chave estável da linha e `data-index` correto à medição. Preservar as APIs confirmadas na versão instalada.
2. Substituir `rowIndex * columns + colIdx` e divisão de índice por lookup do modelo. O problema é especialmente observável com adicionar e com grupos de larguras diferentes.
3. Atualizar `scrollToIndex` sem mudar sua assinatura. Para um destino ainda estimado, reaplicar a navegação somente se o reagrupamento mudar a linha do item-alvo; impor limite de tentativas e registrar impossibilidade em vez de repetir indefinidamente.
4. Recalcular medidas após quebra interna, troca de itens/filtro e resize; invalidar alturas incompatíveis quando mudar a composição da linha. Medir o espaçamento externo uma única vez, sem somar padding/gap em duplicidade.
5. Preservar a chave do primeiro item visível como âncora quando ainda existir. Não disputar a âncora com uma chamada explícita de navegação; se a chave desaparecer após filtro, limitar a posição a um intervalo válido.
6. Não desativar a virtualização; manter `height`, `maxHeight`, `estimateSize`, `overscan` e `scroll`. Evitar repasses completos de DOM e ciclos de medição sem mudança factual.

**Conclusão por inspeção:** nenhum índice de slot negativo/deslocado, mesma ordem de itens e alcance do primeiro/último item depois de reagrupamentos. Se os métodos expostos do virtualizador não oferecerem âncora suficiente na versão instalada, interromper essa parte com evidência, sem prometer preservação nem trocar a biblioteca.

### T5 — Prova geométrica e demonstração

**Dependência:** T1–T4. **Escrita:** teste browser novo; `playground/src/scenarios/media-brand.vue`.

1. Montar `MaxCardList`, `MaxCard`, `MaxSubCard` e ações reais de MaxComponentsUi. Não substituir cards por HTML no teste que comprova largura.
2. Adicionar cenários sintéticos de vazio e grupos com 1, 2 e subcards suficientes para ultrapassar o teto, nos dois modos. Incluir cards comuns misturados, header longo e ações.
3. Exercitar container desktop de 1200 px, outro mais estreito, container de 768/769 px e viewport mobile real. Garantir que o viewport do teste desktop é suficiente: mudar apenas a largura do host não desativa a media query de 768 px.
4. Medir `getBoundingClientRect`, posição/altura das linhas e `scrollWidth/clientWidth`, com tolerância de 2 px. Para vazio, comparar os centros da ação e da região útil. Para grupo sem teto, comparar soma dos filhos + intervalos + padding/bordas; depois do teto, comparar largura inalterada e surgimento de nova linha.
5. Cobrir largura explícita de subcard, wrapper neutro, grupo aninhado, resize em ambos os sentidos, adição/remoção de subcards, atualização sob a mesma chave e filtros sem resultados.
6. Verificar teclado/clique e ausência de duplicação da ação; semântica de loading/vazio preservada. Fora da lista, verificar que MaxCard/MaxSubCard mantêm dimensões e empilhamento anteriores.
7. Testar coleção sintética grande, por exemplo 1000 itens, com altura/overscan controlados. Asserir DOM proporcional às linhas visíveis e overscan, não aos 1000 itens; não escolher um teto de nós desconectado da configuração.
8. Aguardar mudanças observáveis com prazo limitado, não sleeps longos ou consultas de status repetidas sem informação nova. Desmontar app, host e observadores ao fim.
9. Acrescentar ao playground exemplos mínimos de vazio, grupo ajustado e grupo multilinha, sem remover o exemplo atual. Manter tags de abertura em uma linha e recuo de quatro espaços no script.

**Conclusão por inspeção:** fixtures reproduzem os contratos com dados não pessoais e não dependem do consumidor externo.

### T6 — Revisão e validação do lote

**Dependência:** todo o escopo e testes de T1–T5 implementados. Não validar suítes/tipos/build enquanto houver implementações concorrentes ou a cada microedição.

1. Revisar correção, simplicidade, escopo dos seletores, compatibilidade, desempenho, observadores e política de console. A mudança em virtualização é o principal marco de risco; buscar revisão independente no Execute se houver delegação autorizada, sem criar subagentes por rotina neste Plan.
2. Executar os comandos da seção 7. Se um gate de integridade falhar, bloquear os dependentes. Para falhas de harness/boot, diagnosticar em conjunto aliases, resolução, Pinia e Axios antes de repetir testes equivalentes.
3. Corrigir falhas em lote e repetir apenas os checks afetados pela revisão factual. Reaproveitar resultados aprovados de conteúdo não alterado, sem alegar que aprovam uma revisão diferente.
4. Executar revisão final do diff bruto e conferir os requisitos R1–R6. Não corrigir baseline fora do escopo sem causalidade e autorização.
5. Registrar quais requisitos estão comprovados na biblioteca e qual verificação externa permanece pendente. Não informar conclusão integral com falha ou gate previsto pendente.

## 6. Matriz de aceite por tarefa

| Tarefa / requisito | Evidência esperada | Testes pertinentes | Revisão pelo risco | Verificação manual |
| --- | --- | --- | --- | --- |
| T1 / R1 | Uma ação, centros coincidentes em até 2 px e posição restaurada ao preencher | Componente: estados/slots/eventos; browser: centros, teclado e transições | Duplicação de ação, precedência de loading e área de referência | Vazio automático e slot no playground |
| T2 / R2–R5 | Larguras finitas, ordem preservada e mapa de índices correto | Helper puro: combinações, fronteiras e fallback | Algoritmo linear, subpixel e preservação de cards comuns | Não necessária para cálculo puro |
| T3 / R2–R3,R6 | Largura acompanha subcards; teto sem overflow; preferências recuperam após resize | Composable: observação/descarte; browser: soma de larguras, wrapper e alterações de filhos | Ciclo de ResizeObserver, preferências circulares e CSS vazando | Grupo de um subcard e múltiplas linhas |
| T4 / R4–R6 | Paridade estático/virtual, navegação correta e âncora estável | Componente + browser: adicionar, scrollToIndex, último item, filtros, resize | Cache de alturas/chaves e estimativas de células fora da janela | Scroll e resize com grupos grandes |
| T5 / R1–R6 | Componentes reais e DOM limitado à janela | Browser: desktop/mobile, cardinalidade e componentes avulsos | Não confundir mock/estilo declarado com geometria real | Comparação visual clara/escura e foco no playground |
| T6 / R1–R6 | Saídas reais dos gates vinculadas à revisão | Suíte, tipos, lint, build, browser e benchmarks existentes | Falhas vigentes, integridade e relato honesto | Consumidor da imagem: `manualPending` até acesso e validação seguros |

## 7. Comandos e ordem de validação futura

Todos os comandos abaixo existem em `package.json`. Executar somente dentro da worktree autorizada, **durante Execute**, após o preflight e a implementação completa:

```bash
npm run check:lockfile
npm run test
npm run type-check:test
npm run lint
npm run build
npm run test:browser
npm run test:benchmark
```

- Não repetir `check:lockfile` se já aprovado no preflight para manifesto/lockfile/configuração inalterados. A lista explicita o gate necessário, não manda duplicá-lo.
- `npm run build` já chama `vue-tsc`, cobrindo tipos de produção. Não repetir `npm run type-check` sobre a mesma revisão sem falha ou dúvida concreta; os tipos dos testes continuam cobertos por `type-check:test`. Se optar pelo gate agregado de pré-release `npm run verify`, ele já agrega estas etapas e outras; não repetir seus componentes na mesma revisão.
- Testes `.test.ts` novos são descobertos pela suíte normal. `tests/browser/MaxCardList.browser.ts` é descoberto pelo script browser existente. Não alterar includes ou afrouxar console/cobertura para fazer o teste passar.
- Os benchmarks atuais não incluem MaxCardList; rodá-los não comprova sozinho sua performance. A prova específica é cardinalidade em navegador, algoritmo linear e ausência de ciclos de medição. Medições temporais adicionais, se necessárias ao diagnóstico, não substituem essas asserções.
- `npm run verify` é gate futuro de pré-release, não autorização para executar `release`, instalar consumidores, publicar ou fazer push. Antes de rodá-lo, inspecionar também efeitos dos scripts agregados; não contornar etapas indisponíveis e chamar o resultado de aprovado.
- `npm run dev:playground` existe, mas gera/serve artefatos e usa host/porta configurados. Somente iniciar no Execute após conferir isolamento e disponibilidade, sem tomar servidor de outra sessão. Não prometer URL externa funcional sem validação.

## 8. Riscos, recuperação e critérios de interrupção

- **Preferência de largura circular:** se for derivada da dimensão já limitada, o grupo não volta a crescer após resize. Separar preferência/aplicação e provar o ciclo desktop → mobile → desktop.
- **Virtualização de slots arbitrários:** preferências fora da janela são estimadas até a primeira montagem. Medição progressiva não é garantia de conhecimento antecipado. Preservar âncora, navegação e convergência; não esconder reflow indefinido com sleeps ou montagem de todos os itens.
- **Estilos do consumidor não disponíveis:** o anexo não prova se a largura interna vem de CSS, wrapper ou prop externa. Provar biblioteca isolada; deixar aceite externo pendente e interromper se uma incompatibilidade exigir mudar contratos/consumidor.
- **Campos e chaves:** não exigir `item.subcards`; preservar `keyField`/`itemKey`/id/key/fallback atuais. Chaves duplicadas ou fallback instável não podem receber garantia fictícia de identidade.
- **Área útil e scrollbar:** calcular usando área real de conteúdo do renderizador, descontando scrollbar/bordas onde aplicável. Medir a largura do card não substitui medir a largura disponível da lista.
- **CSS contextual:** não modificar todos os `.max-subcard` da aplicação nem apagar layouts explícitos. Preservar tokens, foco e classes legadas. Não reintroduzir PrimeVue.
- **Busca global preexistente:** há conflito de restauração de visibilidade com múltiplas listas, registrado em notificação separada. Não ampliar este lote para corrigir a store; fixtures geométricas usam busca global desabilitada.
- **Ambiente/gates:** falta de browser, divergência de biblioteca ou falha persistente exige diagnóstico e próxima ação específica. Não executar instalações, resets, migrações ou reconfigurações compartilhadas sem autorização.
- **Recuperação:** nenhuma migração ou mudança de dados é prevista. Se o lote precisar ser retirado, preparar reversão apenas dos arquivos/trechos desta tarefa, sem descartar trabalho de terceiros e com autorização. Não remover a worktree com integração pendente.

## 9. Registro de progresso e retomada no Execute

1. Antes de retomar, conferir trabalho já realizado, diff, pendências e revisões reais; executar somente lacunas. Não reabrir decisões sem evidência nova.
2. Após marcos e no handoff, registrar `docs/plans/wt-d7c91bf0/execution-state.json`, ligado ao **SHA256 real de `plan.md`**, às tarefas, seus estados e arquivos. Esse destino só é autorizado durante Execute, não nesta sessão Plan.
3. Novos registros seguem o schema **version 2 estrito** reconhecido pelo Execute, sem inventar campos. Não adicionar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`; razões e próxima ação ficam em `nextAction`, com até 512 caracteres. Comandos têm até 4096 caracteres.
4. Estados de tarefa permitidos: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`. Validação e check aceitam apenas `passed`, `failed`, `pending`; `blocked` não é resultado de validação.
5. Manter `verification` na forma `{ revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`, com hashes reais de conteúdo, nunca rótulos. `passed` exige `exitCode: 0`; `failed` exige inteiro não zero; `pending` não aceita exitCode.
6. Registrar todos os comandos realmente executados e todas as falhas, inclusive da suíte completa; não inferir aprovação/exit code de `tool:end.ok`. Checks vazios, ausência de resultado vigente ou falha vigente impedem validação integral. Version 1 segue compatível, sem provar validação integral automaticamente.
7. O registro é autodeclarado: não comprova execução nativa nem detecta checks omitidos. Para consumidor externo sem acesso, manter tarefa `manualPending` e próxima ação concreta: validar os mesmos cenários na aplicação após autorização de acesso, sem copiar credenciais.
8. Mesma falha repetida sem progresso exige diagnóstico da causa antes de nova tentativa. Cancelamento conserva resultado parcial e pendência explícita; nenhuma etapa assíncrona fica em consulta sem limite.

Execução sequencial é suficiente. Caso a sessão Execute receba autorização de delegação, T2 pode ser implementada independentemente de T1, com contexto mínimo, referências a estes documentos e arquivos de escrita distintos. T3–T4 compartilham `MaxCardList.vue` e devem ter um único responsável; não paralelizar suas edições. Revisões ocorrem nos marcos de risco e na entrega, não em cada microalteração.

## 10. Revisão do plano e situação da entrega

- Pedido e limite de largura confirmados; centralização definida em relação ao corpo da lista.
- Preservações, novos arquivos, dependências e gates explicitados; nenhuma alteração de dados ou contrato de consumidor presumida.
- Cada requisito R1–R6 tem tarefa e evidência observável na matriz de aceite.
- Limitações de medição progressiva e de acesso ao consumidor estão explícitas; não há promessa de testes aprovados ou reprodução visual realizada.
- Existe um achado independente de busca global em `docs/notifications/wt-d7c91bf0/notifications/max-components-ui-max-card-list-busca-global-multiplas-instancias.md`; apenas reportado, não incluído na implementação.
- Este plano é uma proposta revisável. A implementação e os comandos acima **não foram executados** nesta sessão.
