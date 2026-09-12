# Persistência IndexedDB não tem teste de sucesso, transação ou migração real

## Resumo
O mock global de IndexedDB nunca dispara callbacks, e os testes do helper cobrem apenas ausência de API, entradas vazias e exceção ao abrir. Criação/upgrades, leitura, gravação, conclusão, abort e limpeza ficam sem validação comportamental.

## Severidade e prioridade
**Alta / P1.** O cache persistente de ícones pode quebrar silenciosamente em browsers enquanto toda suíte passa.

## Evidências
- `tests/setup.ts:63-70`: comentário admite que o mock nunca chama `onsuccess`, `onerror` ou `onupgradeneeded` e deixa Promises pendentes.
- `tests/helpers/iconIdb.test.ts:21-64`: cobre SSR, coleção vazia e `indexedDB.open` lançando, sem banco funcional.
- `src/helpers/iconIdb.ts:27-47`: criação/upgrade de object store não exercitados.
- `src/helpers/iconIdb.ts:75-97`: `getAll` e sanitização não exercitados em fluxo real.
- `src/helpers/iconIdb.ts:114-130,152-163`: put/complete/error/abort/clear sem teste funcional.
- Relatório de cobertura: `iconIdb.ts` em aproximadamente 37,6% statements/linhas e 29,6% functions.

## Afetados
`iconIdb.ts`, inicialização/migração de `useIconStore` e cache de ícones entre sessões.

## Causa-raiz
Mock mínimo global foi documentado como limitação, mas nunca complementado por fake IndexedDB ou fixture local que implemente ciclo completo de requests/transações.

## Impacto
Mudanças de schema, falha de commit, sanitização na leitura e limpeza podem regredir sem alarme; Promise pendente também pode ser confundida com degradação silenciosa aceitável.

## Reprodução
Executar cobertura focada no helper e listar branches/funções não visitados; observar que nenhum teste cria banco/store e completa transação.

## Direção de correção
Usar `fake-indexeddb` ou mock local fiel, testar upgrade, leitura sanitizada, put em lote, abort/error, clear e integração de migração do store; impor timeout curto a Promises.

## Critérios de aceite
- Todos os estados de request/transação têm testes determinísticos.
- Nenhuma Promise fica pendente.
- Migração localStorage→IDB é testada ponta a ponta.
- Cobertura do helper atinge patamar específico acordado.

## Contraevidências consideradas
Caminhos SSR e de falha silenciosa já são testados e são úteis; eles não substituem o caminho normal usado no browser.
