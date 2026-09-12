# Plano de implementação — persistência incremental do cache de ícones

## Objetivo e resultado esperado

Eliminar o custo de reprocessar todo o catálogo quando o `useIconStore` recebe poucos ícones novos. O fluxo automático deve sanitizar cada valor não confiável uma única vez, manter essa garantia no tipo usado internamente e persistir somente o delta válido em uma única transação por lote.

Ao final:

- um lote de `k` ícones novos ou recuperados produzirá no máximo `k` sanitizações e `k` chamadas a `IDBObjectStore.put`, sem depender dos `N` ícones já carregados;
- um registro lido do IndexedDB será sanitizado uma vez no helper e não novamente no store;
- SVGs vindos de API, fallback, `localStorage` legado ou IndexedDB continuarão sendo tratados como não confiáveis;
- os estados `waiting`, vazio e SVG rejeitado não serão persistidos;
- a representação persistida continuará compatível com o banco `max_icons_db`, versão 1.

## Decisão técnica central

Separar explicitamente as duas operações hoje misturadas:

1. **validar uma entrada não confiável** com `sanitizeSvg`;
2. **persistir um valor já sanitizado** sem repetir DOMPurify e DOMParser.

Para tornar a separação verificável pelo TypeScript, introduzir um tipo nominal `SanitizedSvg`. `sanitizeSvg` passa a retornar `SanitizedSvg | ''`; o carregamento do IndexedDB também retorna somente valores desse tipo após validar cada registro. Um novo helper de escrita confiável aceita apenas `Record<string, SanitizedSvg>` e executa os `put`s sem nova sanitização.

O helper público existente `saveIconsToIDB(Record<string, string>)` deve ser preservado como fronteira segura e compatível para chamadores que ainda forneçam strings arbitrárias: ele sanitiza cada entrada uma vez e delega a escrita ao helper confiável. Apenas os deltas construídos localmente logo após `sanitizeSvg` podem usar a escrita confiável diretamente.

Não usar versão ou hash persistido como autorização para pular a sanitização na leitura. Dados do IndexedDB podem ser alterados por outro script da mesma origem; portanto, cada leitura continua sendo uma fronteira não confiável. A “versão de conteúdo” é representada pelo valor que acabou de atravessar o sanitizador na execução atual, e o tipo nominal impede seu reprocessamento acidental dentro desse fluxo.

## Escopo

- Definir o contrato tipado de SVG sanitizado.
- Adicionar escrita de lote já sanitizado no helper IndexedDB.
- Persistir deltas dos lotes da API principal e dos fallbacks.
- Remover a segunda sanitização após `loadAllIconsFromIDB`.
- Migrar o cache legado sanitizando cada SVG uma vez e persistindo somente os SVGs válidos.
- Preservar `saveCache` e `debouncedSaveCache` como APIs de compatibilidade para salvamento explícito do snapshot.
- Cobrir cardinalidade de sanitizações e `put`s com testes determinísticos.
- Medir os cenários de 100, 1.000 e 10.000 itens sem impor limites frágeis de tempo à suíte de CI.

## Fora de escopo

- Alterar a API HTTP de ícones, o formato do payload de sincronização ou a política de retry.
- Trocar IndexedDB por outro mecanismo de armazenamento.
- Alterar o formato `{ name, svg }`, o nome do banco/object store ou incrementar `DB_VERSION` sem mudança de esquema.
- Confiar em hash ou marcador de versão armazenado no próprio IndexedDB como substituto de sanitização.
- Virtualizar ou redesenhar `MaxInputIconPicker`.
- Remover imediatamente `saveCache` ou `debouncedSaveCache`, pois ambos fazem parte do objeto retornado pelo store.
- Corrigir, neste achado, toda a infraestrutura de testes reais de IndexedDB; essa cobertura é coordenada com o achado `docs/optimize-new/testes_estabilidade/indexeddb_sem_teste_de_fluxo_real`.

## Arquivos a alterar ou criar

### Produção

- `src/helpers/sanitizeSvg.ts`
  - exportar o tipo nominal `SanitizedSvg`;
  - tipar o retorno de `sanitizeSvg` como `SanitizedSvg | ''`, sem alterar a política de segurança.
- `src/helpers/iconIdb.ts`
  - tipar resultados validados;
  - criar o helper de escrita de lote já sanitizado;
  - manter `saveIconsToIDB` e `saveIconToIDB` como entradas compatíveis para strings não confiáveis.
- `src/stores/useIcon.Store.ts`
  - acumular e persistir apenas os deltas sanitizados;
  - eliminar a sanitização duplicada da carga do IndexedDB;
  - preservar o salvamento explícito de snapshot para compatibilidade.

### Testes e benchmark

- `tests/helpers/iconIdb.test.ts`
  - cobrir os dois contratos de escrita, filtros de sentinela e uma única sanitização por valor bruto.
- `tests/stores/useIcon.Store.test.ts`
  - cobrir lotes da API, lotes de fallback e carga do IndexedDB sem snapshot integral.
- `tests/stores/useIconStore.test.ts`
  - adequar o teste da API legada de debounce e deixar explícito que ela continua salvando um snapshot quando chamada pelo consumidor.
- `tests/stores/useIconStore.cache-sanitize.test.ts`
  - reforçar as regressões de segurança e a migração do `localStorage` com persistência apenas do delta válido.
- `tests/performance/iconCachePersistence.bench.ts` (novo)
  - medir sanitizações, `put`s e duração dos cenários de 100, 1.000 e 10.000 ícones acumulados.
- `package.json`
  - adicionar um script específico para executar o benchmark Vitest sem incluir medição de tempo na suíte comum.

Não há dependência nova prevista; o lockfile não deve mudar por este achado.

## Dependências e ordem de implementação

1. Estabilizar primeiro a fixture de IndexedDB prevista em `docs/optimize-new/testes_estabilidade/indexeddb_sem_teste_de_fluxo_real`, ou compartilhar a mesma fixture se os dois achados forem executados juntos.
2. Introduzir o contrato `SanitizedSvg` sem mudança de comportamento em runtime.
3. Separar, no helper IndexedDB, escrita bruta e escrita confiável.
4. Migrar o store para produzir deltas sanitizados e usar a escrita confiável apenas nesses deltas.
5. Atualizar os testes de compatibilidade e segurança.
6. Adicionar o teste de cardinalidade/benchmark e executar a validação completa.

A mudança do helper deve preceder a do store para que não exista etapa intermediária em que dados arbitrários possam alcançar uma escrita sem sanitização.

## Passos detalhados

### 1. Tornar a fronteira de confiança explícita

1. Declarar em `sanitizeSvg.ts` um tipo nominal, por exemplo `SanitizedSvg`, que continue sendo utilizável como `string` em runtime.
2. Fazer `sanitizeSvg` retornar esse tipo somente depois de todas as validações atuais do DOMPurify, DOMParser, elementos `script` e atributos `on*`.
3. Manter `''` como retorno de rejeição. Não converter `waiting` em SVG sanitizado e não relaxar nenhuma regra existente.
4. Documentar no próprio contrato que o tipo só pode ser criado pelo sanitizador durante a execução atual; casts fora da fronteira devem ser proibidos na implementação.

### 2. Separar sanitização e escrita no IndexedDB

1. Extrair a abertura da transação e o laço de `store.put` para uma função que aceite somente um mapa de `SanitizedSvg`.
2. Filtrar chaves vazias antes de abrir a transação e resolver de forma graciosa nos mesmos eventos `oncomplete`, `onerror` e `onabort` atuais.
3. Fazer `saveIconsToIDB` continuar aceitando `Record<string, string>`, sanitizar cada SVG bruto exatamente uma vez, descartar `waiting`, vazio e resultados rejeitados, e então delegar o mapa válido à nova escrita confiável.
4. Manter `saveIconToIDB` delegando à fronteira bruta para não transformar sua assinatura existente em uma promessa de confiança.
5. Em `loadAllIconsFromIDB`, sanitizar cada registro uma única vez e retornar somente entradas válidas tipadas como `SanitizedSvg`.
6. Preservar o comportamento SSR e de falha silenciosa existente.

### 3. Persistir somente o delta da API principal

1. No processamento da resposta da API, criar um mapa vazio de SVGs sanitizados para o lote atual.
2. Para cada nome solicitado, aceitar apenas resposta textual, chamar `sanitizeSvg` uma vez e adicionar ao estado e ao delta somente quando o retorno for válido.
3. Manter a semântica atual para ícones ausentes e contadores de erro.
4. Atualizar `icons_data` por chave ou com `Object.assign`, evitando também clonar os `N` itens já existentes em `updated_data`.
5. Ao final do lote, abrir no máximo uma transação de escrita confiável para o delta válido. Não chamar `saveCache()` no fluxo automático.
6. Se não houver SVG válido, não abrir transação.

### 4. Persistir somente deltas dos fallbacks

1. Tipar `fetchIconFallback` para retornar `SanitizedSvg | null` e continuar sanitizando a resposta externa antes de devolvê-la.
2. Nos caminhos de “ícone ausente na resposta principal” e de falha integral da requisição, acumular os resultados válidos em `recoveredIcons`.
3. Persistir `recoveredIcons` uma única vez ao término de cada grupo de fallbacks, sem percorrer `icons_data`.
4. Reutilizar o mesmo mapa na sincronização com o backend, preservando o comportamento atual.
5. Garantir que falhas individuais e o sentinela vazio após o limite de retries não sejam gravados.

### 5. Remover sanitização duplicada na inicialização

1. Na migração do `localStorage`, manter dois mapas conceituais:
   - estado migrado, que pode preservar `waiting` e `''` em memória por compatibilidade;
   - delta persistível, contendo somente SVGs que acabaram de ser sanitizados com sucesso.
2. Persistir o segundo mapa pela escrita confiável, evitando a sanitização duplicada hoje feita por `saveIconsToIDB`.
3. Continuar removendo `ICON_CACHE_KEY` após a tentativa de migração, inclusive para JSON inválido.
4. Na carga do IndexedDB, mesclar diretamente o resultado já validado por `loadAllIconsFromIDB`; remover o segundo laço de `sanitizeSvg` do store.
5. Preservar a precedência atual do estado em memória/localStorage sobre o conteúdo assíncrono do IndexedDB.

### 6. Preservar compatibilidade das APIs de snapshot

1. Manter `saveCache()` sem parâmetros e `debouncedSaveCache(delay)` no retorno do store.
2. Como `icons_data` é publicamente mutável e pode receber strings não confiáveis, fazer o salvamento explícito continuar passando pela fronteira bruta `saveIconsToIDB`.
3. Documentar essas funções como compatibilidade/salvamento manual de snapshot e removê-las de todos os caminhos automáticos de lote.
4. Manter o debounce e a limpeza de timer em `onScopeDispose`.

Esse caminho explícito pode continuar sendo `O(N)` por definição; o critério de `O(k)` aplica-se à ingestão automática de novos lotes, que é o caminho quente do achado.

## Migração e compatibilidade

- O registro IndexedDB permanece `{ name: string, svg: string }`; não é necessário incrementar `DB_VERSION` nem executar migração estrutural.
- Registros existentes, inclusive criados antes desta mudança, serão sanitizados uma vez ao serem lidos e poderão ser usados normalmente.
- A migração do `localStorage` permanece automática e remove a chave legada conforme o comportamento atual.
- As assinaturas de `saveIconsToIDB`, `saveIconToIDB`, `saveCache` e `debouncedSaveCache` permanecem aceitando os mesmos argumentos.
- `SanitizedSvg` é uma restrição apenas em tempo de compilação e não altera o valor serializado nem o SVG entregue aos componentes.
- Se uma futura versão mudar a política do sanitizador, a leitura obrigatoriamente sanitizada já reaplica a política nova; um eventual marcador de versão poderá orientar limpeza ou telemetria, mas nunca dispensar essa validação.

## Estratégia de testes

### Testes unitários do helper

- Verificar que `saveIconsToIDB` chama `sanitizeSvg` uma vez para cada valor bruto elegível e grava somente retornos válidos.
- Verificar que a escrita confiável executa exatamente um `put` por entrada recebida e não chama `sanitizeSvg`.
- Verificar que `waiting`, `''`, nome vazio e SVG rejeitado não geram `put`.
- Verificar que `loadAllIconsFromIDB` sanitiza cada registro uma vez e descarta registros inválidos.
- Preservar cenários SSR, banco indisponível, transação abortada e erro de abertura.

### Testes de integração do store

- Pré-carregar `N` ícones no estado, solicitar um lote de `k` novos e afirmar que a persistência recebe somente as `k` entradas novas, sem nenhuma das `N` antigas.
- Cobrir separadamente resposta principal completa, resposta parcial seguida de fallback e falha principal seguida de fallback.
- Verificar que cada grupo resulta em no máximo uma transação e que lote vazio não persiste nada.
- Mockar `loadAllIconsFromIDB` com valores já sanitizados e afirmar que o store os mescla sem nova chamada ao sanitizador.
- Manter o teste do `debouncedSaveCache` para garantir compatibilidade do salvamento manual.

### Testes de segurança e migração

- Reexecutar SVGs com `script`, atributos `on*` e URLs `javascript:` vindos de API, fallback, `localStorage` e IndexedDB.
- Afirmar que nenhum conteúdo rejeitado entra no delta confiável ou é persistido.
- Na migração legada, afirmar uma sanitização por SVG bruto, uma escrita do delta válido e remoção da chave do `localStorage`.
- Confirmar que registros IndexedDB no formato versão 1 continuam carregando sem upgrade de esquema.

### Acessibilidade

Não há alteração de markup, foco, teclado, semântica ARIA ou anúncio de estado. Não é necessário criar teste a11y exclusivo. Como regressão indireta, executar os testes de integração de `MaxInputIconPicker` para confirmar que ícones válidos continuam aparecendo e que estados ausentes continuam com o fallback visual existente.

### Benchmark e regressão de complexidade

1. Executar o mesmo lote fixo `k` sobre catálogos já carregados com `N = 100`, `1.000` e `10.000`.
2. Instrumentar o sanitizador e o `put` da fixture IndexedDB.
3. Registrar duração e contagens, mas usar contagens — não tempo de parede — como bloqueio determinístico de CI.
4. Afirmar em todos os tamanhos:
   - `sanitizeCount === k` para entradas externas válidas;
   - `putCount === k`;
   - uma transação por lote não vazio;
   - nenhum item anterior aparece no payload de persistência.
5. Medir também a carga de `N` registros e afirmar `sanitizeCount === N`, sem segunda passagem no store.

## Critérios mensuráveis de aceite

- Para `N ∈ {100, 1.000, 10.000}` e um lote válido fixo de `k`, o fluxo automático realiza exatamente `k` sanitizações, `k` puts e uma transação.
- Aumentar `N` mantendo `k` constante não altera essas contagens.
- A carga de `N` registros válidos do IndexedDB chama `sanitizeSvg` exatamente `N` vezes no helper e zero vezes adicionais no store.
- O fluxo automático não chama `saveCache` nem envia um snapshot completo ao helper IndexedDB.
- `waiting`, vazio, resposta não textual e SVG rejeitado produzem zero puts.
- Todos os testes existentes de sanitização, store, IndexedDB e `MaxInputIconPicker` permanecem verdes.
- `npm run type-check`, `npm run test` e `npm run build` concluem sem erro.
- O benchmark dedicado executa com os três tamanhos e reporta contagens e duração de cada cenário.

## Riscos e mitigação

- **Persistir dado não sanitizado por uso incorreto do helper confiável:** restringir a assinatura a `SanitizedSvg`, evitar casts e cobrir todas as origens não confiáveis em testes.
- **Perder atualizações em lotes concorrentes:** aplicar deltas diretamente no estado atual e persistir o mapa capturado por requisição, sem substituir o estado por um snapshot antigo.
- **Alterar a precedência durante a inicialização assíncrona:** conservar a ordem de merge em que valores já presentes em memória vencem o IndexedDB.
- **Quebrar consumidores que chamam `saveCache`:** manter assinatura e semântica de snapshot, alterando apenas os chamadores automáticos internos.
- **Ocultar regressão com benchmark de tempo instável:** bloquear CI por contagem de operações e usar duração apenas como dado comparativo.
- **Conflito com a melhoria da fixture IndexedDB:** executar primeiro o achado de estabilidade ou centralizar a fixture para evitar mocks incompatíveis.

## Rollback

Se a persistência incremental causar perda de cache ou condição de corrida:

1. reverter os chamadores automáticos do store para `saveCache()`;
2. manter a sanitização reforçada no helper bruto durante a reversão;
3. não apagar nem migrar o banco, pois o formato persistido não mudou;
4. invalidar apenas o cache de teste e reproduzir o lote concorrente antes de retomar a otimização.

O rollback não exige downgrade de `DB_VERSION` nem transformação de registros.

## Validação final

1. Executar os testes focados de `sanitizeSvg`, `iconIdb` e `useIconStore`.
2. Executar o benchmark dedicado para 100, 1.000 e 10.000 itens e anexar ao registro da implementação as contagens antes/depois e os tempos observados.
3. Executar a suíte de componentes que consome ícones, especialmente `MaxInputIconPicker`.
4. Executar `npm run type-check`, `npm run test` e `npm run build`.
5. Inspecionar o diff para confirmar que:
   - nenhum caminho automático percorre a coleção completa para persistir um lote;
   - não existe cast que fabrique `SanitizedSvg` fora do sanitizador/helper de leitura;
   - todas as fronteiras externas continuam sanitizadas;
   - o esquema IndexedDB e as APIs públicas foram preservados.
