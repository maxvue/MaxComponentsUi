# Cache de ícones reprocessa a coleção inteira a cada lote

## Resumo

Ao receber um lote novo, o store salva novamente toda a coleção de ícones. A persistência sanitiza cada SVG e executa um `put` por registro; na leitura, cada SVG ainda é sanitizado tanto no helper quanto no store.

## Severidade e prioridade

- Severidade: média a alta em catálogos grandes.
- Prioridade: P1.

## Evidências

- `src/stores/useIcon.Store.ts:185-199,255-262`: após lotes, `saveCache()` recebe a coleção completa.
- `src/helpers/iconIdb.ts:106-122`: a gravação sanitiza e faz `put` de todos os registros.
- `src/helpers/iconIdb.ts:79-87` e `src/stores/useIcon.Store.ts:57-64`: o carregamento sanitiza os mesmos SVGs em duas camadas.
- `src/helpers/sanitizeSvg.ts:17-45`: cada sanitização envolve DOMPurify e parse DOM.
- Os testes existentes verificam correção e debounce, mas não cardinalidade de `put` ou sanitizações em cache grande.

## Componentes afetados

`useIconStore`, `iconIdb`, `sanitizeSvg` e componentes que carregam catálogos de ícones, em especial `MaxInputIconPicker`.

## Causa-raiz

O cache opera por snapshots integrais, embora os dados cheguem em lotes incrementais. As fronteiras de confiança não definem uma única etapa canônica de sanitização.

## Impacto quantificado

Com `N` ícones acumulados e `B` lotes, a persistência pode chegar a `O(B × N)` registros processados. Um único ícone novo em cache de `N` itens provoca `N` sanitizações e `N` puts; a carga provoca até `2N` sanitizações.

## Reprodução e benchmark

Instrumentar `sanitizeSvg` e `IDBObjectStore.put`; carregar lotes crescentes de 100 até 10.000 ícones; registrar chamadas, tempo de main thread e transação.

## Direção de solução

Persistir somente deltas ou usar transações incrementais, registrar versão/hash de conteúdo sanitizado e escolher uma única fronteira de sanitização sem reduzir segurança.

## Critérios de aceite

- Adicionar um lote de `k` itens executa `O(k)` puts/sanitizações, independentemente do total já salvo.
- Cada SVG é sanitizado uma vez por versão de conteúdo em leitura/gravação.
- Migração/invalidação do cache é testada.
- Benchmark cobre catálogos de 100, 1.000 e 10.000 itens.

## Contraevidências

- O debounce reduz a frequência temporal das gravações.
- A sanitização redundante fornece defesa em profundidade; a otimização deve preservar uma fronteira confiável e versionada.
- Catálogos pequenos ocultam o custo assintótico.
